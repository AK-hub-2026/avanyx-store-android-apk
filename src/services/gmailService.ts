/**
 * Gmail Workspace Integration Service
 * Manages Google OAuth Scopes for Gmail, in-memory Access Tokens,
 * and direct Gmail REST API operations (fetching messages, threads, labels, sending emails, drafts).
 */

import { GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify'
];

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  labelIds: string[];
  internalDate: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  bodyText?: string;
  isUnread?: boolean;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

// In-memory token cache - NEVER persisted to localStorage/sessionStorage
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Configure Google Auth Provider with Gmail Scopes
 */
export function getGmailAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  GMAIL_SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });
  provider.setCustomParameters({
    prompt: 'select_account consent',
    access_type: 'offline'
  });
  return provider;
}

/**
 * Connect or authorize Gmail via Google Popup
 */
export async function connectGmail(): Promise<{ user: FirebaseUser; accessToken: string }> {
  try {
    isSigningIn = true;
    const provider = getGmailAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google OAuth access token for Gmail.');
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken
    };
  } catch (error: any) {
    console.error('Gmail OAuth connection failed:', error);
    if (error.code === 'auth/network-request-failed') {
      throw new Error('OAuth network request failed. If you are inside an embedded iframe or have popup blockers active, please ensure popups/cross-site cookies are allowed or open the application in a new dedicated tab.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Google Sign-in popup was blocked by your browser. Please enable popups for this site and try again.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup was closed before completing authorization.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in attempt was already in progress.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Get current in-memory access token
 */
export function getGmailAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Set or clear the cached token in memory
 */
export function setGmailAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

/**
 * Disconnect Gmail (clears in-memory token)
 */
export function disconnectGmail(): void {
  cachedAccessToken = null;
}

/**
 * Helper to execute authorized Gmail REST API requests
 */
async function gmailFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  if (!cachedAccessToken) {
    throw new Error('GMAIL_NOT_CONNECTED: Gmail access token not found in memory. Please connect your Google account.');
  }

  const url = endpoint.startsWith('http') ? endpoint : `https://gmail.googleapis.com/gmail/v1/users/me${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${cachedAccessToken}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    cachedAccessToken = null;
    throw new Error('GMAIL_AUTH_EXPIRED: Gmail access token expired or revoked. Please reconnect.');
  }

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Gmail API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch the authenticated user's Gmail profile
 */
export async function fetchGmailProfile(): Promise<GmailProfile> {
  return await gmailFetch('/profile');
}

/**
 * List recent Gmail messages
 */
export async function listGmailMessages(queryStr = '', maxResults = 20): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string }> {
  const queryParam = queryStr ? `&q=${encodeURIComponent(queryStr)}` : '';
  const data = await gmailFetch(`/messages?maxResults=${maxResults}${queryParam}`);
  return {
    messages: data.messages || [],
    nextPageToken: data.nextPageToken
  };
}

/**
 * Get full details for a specific Gmail message ID
 */
export async function getGmailMessageDetails(messageId: string): Promise<GmailMessage> {
  const data = await gmailFetch(`/messages/${messageId}?format=full`);
  
  const headers: GmailMessageHeader[] = data.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const from = getHeader('From');
  const to = getHeader('To');
  const subject = getHeader('Subject') || '(No Subject)';
  const date = getHeader('Date');

  let bodyText = '';
  if (data.payload?.body?.data) {
    bodyText = decodeBase64Url(data.payload.body.data);
  } else if (data.payload?.parts) {
    // Traverse parts for text/plain or text/html
    const plainPart = data.payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (plainPart?.body?.data) {
      bodyText = decodeBase64Url(plainPart.body.data);
    } else {
      const htmlPart = data.payload.parts.find((p: any) => p.mimeType === 'text/html');
      if (htmlPart?.body?.data) {
        bodyText = decodeBase64Url(htmlPart.body.data);
      }
    }
  }

  const isUnread = (data.labelIds || []).includes('UNREAD');

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet || '',
    labelIds: data.labelIds || [],
    internalDate: data.internalDate,
    from,
    to,
    subject,
    date,
    bodyText,
    isUnread
  };
}

/**
 * Send an email through Gmail with RFC 2822 formatting
 */
export async function sendGmailEmail(to: string, subject: string, body: string): Promise<{ id: string; threadId: string }> {
  // Construct RFC 2822 formatted string
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    body
  ];
  const message = messageParts.join('\r\n');
  const raw = encodeBase64Url(message);

  return await gmailFetch('/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw })
  });
}

/**
 * Mark a message as read (remove UNREAD label)
 */
export async function markGmailMessageRead(messageId: string): Promise<void> {
  await gmailFetch(`/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({
      removeLabelIds: ['UNREAD']
    })
  });
}

/**
 * Helpers for base64url encoding/decoding
 */
function encodeBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    return atob(base64);
  }
}
