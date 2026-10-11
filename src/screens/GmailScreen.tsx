import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Mail,
  Send,
  RefreshCw,
  Search,
  Inbox,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Lock,
  Sparkles,
  ArrowLeft,
  Paperclip,
  Check,
  LogOut,
  Clock,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import {
  connectGmail,
  disconnectGmail,
  getGmailAccessToken,
  fetchGmailProfile,
  listGmailMessages,
  getGmailMessageDetails,
  sendGmailEmail,
  markGmailMessageRead,
  GmailMessage,
  GmailProfile
} from '../services/gmailService';

export const GmailScreen: React.FC = () => {
  const { user, isAuthenticated, setCurrentTab } = useStore();

  const [isConnected, setIsConnected] = useState(false);
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Active message reader
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Compose Email modal / state
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Confirmation dialog for sending / mutating data
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  // Check initial connection
  useEffect(() => {
    const token = getGmailAccessToken();
    if (token) {
      setIsConnected(true);
      loadGmailData();
    }
  }, []);

  const handleConnectGmail = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await connectGmail();
      if (res?.accessToken) {
        setIsConnected(true);
        setSuccessMsg('Successfully connected to Gmail with Google Workspace OAuth!');
        await loadGmailData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate and connect Gmail.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGmail();
    setIsConnected(false);
    setProfile(null);
    setMessages([]);
    setSelectedMessage(null);
    setSuccessMsg('Disconnected Gmail account from session.');
  };

  const loadGmailData = async () => {
    if (!getGmailAccessToken()) return;
    setRefreshing(true);
    setError(null);
    try {
      const p = await fetchGmailProfile();
      setProfile(p);

      const listRes = await listGmailMessages(searchQuery, 20);
      if (listRes.messages && listRes.messages.length > 0) {
        // Fetch message previews concurrently (first 15)
        const detailed = await Promise.all(
          listRes.messages.slice(0, 15).map(async (m) => {
            try {
              return await getGmailMessageDetails(m.id);
            } catch (e) {
              return null;
            }
          })
        );
        setMessages(detailed.filter((m): m is GmailMessage => m !== null));
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      if (err.message?.includes('GMAIL_NOT_CONNECTED') || err.message?.includes('GMAIL_AUTH_EXPIRED')) {
        setIsConnected(false);
      }
      setError(err.message || 'Error fetching Gmail data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectMessage = async (msg: GmailMessage) => {
    setSelectedMessage(msg);
    if (msg.isUnread) {
      try {
        await markGmailMessageRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isUnread: false } : m))
        );
      } catch (err) {
        console.warn('Failed to mark read:', err);
      }
    }
  };

  const initiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      setError('Please fill in all recipient, subject, and body fields before sending.');
      return;
    }
    // Workspace guideline: Require explicit user confirmation for email delivery
    setShowSendConfirmation(true);
  };

  const confirmAndSendEmail = async () => {
    setShowSendConfirmation(false);
    setIsSending(true);
    setError(null);
    try {
      await sendGmailEmail(composeTo.trim(), composeSubject.trim(), composeBody.trim());
      setSuccessMsg(`Email successfully sent to ${composeTo.trim()} via Gmail!`);
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      await loadGmailData();
    } catch (err: any) {
      setError(err.message || 'Failed to send email via Gmail API');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="gmail-workspace-container" className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-sm">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                Gmail Workspace Hub
              </h1>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Official Google Workspace Gmail integration with permission from the app's users.
              </p>
            </div>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-gmail"
              onClick={loadGmailData}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[#1D1B20] dark:text-[#E6E1E5] text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              id="btn-compose-email"
              onClick={() => setIsComposing(true)}
              className="px-4 py-2 rounded-2xl bg-[#6750A4] text-white hover:bg-[#523e85] transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose Email</span>
            </button>
            <button
              id="btn-disconnect-gmail"
              onClick={handleDisconnect}
              className="px-3 py-2 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1 transition-all"
              title="Disconnect Gmail session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs hover:opacity-75">✕</button>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs hover:opacity-75">✕</button>
        </div>
      )}

      {/* Not Connected State -> Styled Official Google Sign-in Card */}
      {!isConnected ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm text-center space-y-6 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
              Connect Your Google Workspace Gmail
            </h2>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
              Connect Gmail to read store developer inquiries, send verification feedback, or manage app communications directly within AVANYX with permission from your Google account.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Workspace Security & Privacy Guarantee</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[#49454F] dark:text-[#CAC4D0] text-[11px]">
              <li>Tokens are held strictly in temporary memory cache and never stored to disk.</li>
              <li>Every outbound email requires your explicit confirmation before dispatch.</li>
              <li>Protected by Google Cloud OAuth 2.0 with project scopes.</li>
            </ul>
          </div>

          <button
            id="btn-google-workspace-signin"
            onClick={handleConnectGmail}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white dark:bg-[#2B2C30] hover:bg-slate-50 dark:hover:bg-[#34353A] border border-slate-300 dark:border-slate-700 text-[#1D1B20] dark:text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>{loading ? 'Connecting Google Workspace...' : 'Sign in with Google (Connect Gmail)'}</span>
          </button>
        </div>
      ) : (
        /* Connected Workspace View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Messages List */}
          <div className="md:col-span-1 space-y-3">
            {/* Account Info Pill */}
            {profile && (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center justify-between text-xs shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-xl bg-[#6750A4]/15 text-[#6750A4] flex items-center justify-center font-black shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] truncate">
                      {profile.emailAddress}
                    </div>
                    <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">
                      {profile.messagesTotal.toLocaleString()} messages
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center gap-2 shadow-sm">
              <Search className="w-3.5 h-3.5 text-[#49454F] dark:text-[#CAC4D0]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadGmailData()}
                placeholder="Search messages (e.g. from:support)..."
                className="bg-transparent text-xs w-full text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none"
              />
            </div>

            {/* Messages Scroll Area */}
            <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm max-h-[600px] overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 ${
                      selectedMessage?.id === msg.id
                        ? 'bg-[#F3EDF7] dark:bg-[#25262B]'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs truncate ${msg.isUnread ? 'font-black text-[#1D1B20] dark:text-white' : 'font-semibold text-[#49454F] dark:text-[#CAC4D0]'}`}>
                        {msg.from || 'Unknown Sender'}
                      </span>
                      {msg.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#6750A4] shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] truncate">
                      {msg.subject}
                    </div>
                    <div className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] line-clamp-2">
                      {msg.snippet}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  {refreshing ? 'Loading messages from Gmail...' : 'No messages found in your inbox.'}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Message Detail View */}
          <div className="md:col-span-2 space-y-4">
            {selectedMessage ? (
              <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 p-6 shadow-sm space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
                      {selectedMessage.subject}
                    </h2>
                    <div className="text-xs text-[#49454F] dark:text-[#CAC4D0] space-y-0.5">
                      <div>From: <strong className="text-[#1D1B20] dark:text-[#E6E1E5]">{selectedMessage.from}</strong></div>
                      <div>To: {selectedMessage.to}</div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" /> {selectedMessage.date}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsComposing(true);
                      setComposeTo(selectedMessage.from || '');
                      setComposeSubject(`Re: ${selectedMessage.subject}`);
                      setComposeBody(`\n\n--- On ${selectedMessage.date}, ${selectedMessage.from} wrote:\n${selectedMessage.snippet}`);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>

                {/* Email Body */}
                <div className="text-xs text-[#1D1B20] dark:text-[#E6E1E5] whitespace-pre-wrap leading-relaxed max-h-[450px] overflow-y-auto p-4 rounded-2xl bg-black/5 dark:bg-white/5 font-sans">
                  {selectedMessage.bodyText || selectedMessage.snippet || '(Empty message body)'}
                </div>
              </div>
            ) : (
              <div className="p-16 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 text-center text-xs text-[#49454F] dark:text-[#CAC4D0] flex flex-col items-center justify-center gap-2">
                <Inbox className="w-10 h-10 text-[#49454F] dark:text-[#CAC4D0] opacity-40" />
                <span>Select a conversation from the left to read email details</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {isComposing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-lg w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#6750A4]" /> Compose Email via Gmail
              </h3>
              <button
                onClick={() => setIsComposing(false)}
                className="p-1 rounded-lg text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={initiateSend} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] block mb-1">
                  Recipient Email (To):
                </label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-1 focus:ring-[#6750A4]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] block mb-1">
                  Subject:
                </label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="AVANYX Developer Verification Update"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-1 focus:ring-[#6750A4]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] block mb-1">
                  Message Body:
                </label>
                <textarea
                  required
                  rows={6}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your email here..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-1 focus:ring-[#6750A4] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold hover:bg-[#523e85] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email...</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Destructive / Mutating Workspace Action */}
      {showSendConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-[#E6E1E5]">
                Confirm Outbound Email
              </h3>
            </div>

            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
              Are you sure you want to send this email via your authenticated Gmail account?
            </p>

            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-xs space-y-1">
              <div>To: <strong>{composeTo}</strong></div>
              <div>Subject: <strong>{composeSubject}</strong></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSendConfirmation(false)}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndSendEmail}
                disabled={isSending}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
