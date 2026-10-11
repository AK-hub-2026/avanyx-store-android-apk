import { UserRole, VerificationBadge, DeveloperStatus, StudentStatus, AdminStatus } from '../types';

export type AvanyxProductId =
  | 'avanyx-store'
  | 'aether-platform'
  | 'infinity-studio'
  | 'bomb-rush-3d'
  | 'future-apps';

export interface AvanyxEcosystemProduct {
  id: AvanyxProductId;
  name: string;
  codename: string;
  tagline: string;
  description: string;
  iconName: string;
  accentColorHex: string;
  badgeText: string;
  version: string;
  releaseStatus: 'LIVE' | 'BETA' | 'ALPHA' | 'DEV_PREVIEW';
  supportedPlatforms: ('WEB' | 'ANDROID' | 'IOS' | 'WINDOWS' | 'MAC' | 'LINUX')[];
  defaultScopes: string[];
  features: string[];
  externalUrl?: string;
  clientId: string;
}

export interface ConnectedApp {
  id: string;
  clientId: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: 'OFFICIAL_ECOSYSTEM' | 'FIRST_PARTY_GAME' | 'DEVELOPER_TOOL' | 'THIRD_PARTY_APP';
  status: 'CONNECTED' | 'AUTHORIZED' | 'REVOKED' | 'PENDING';
  authorizedScopes: string[];
  connectedAt: string;
  lastAccessedAt: string;
  isFirstParty: boolean;
  canRevoke: boolean;
}

export type DevicePlatform = 'MAC' | 'WINDOWS' | 'LINUX' | 'ANDROID' | 'IOS' | 'WEB' | 'UNKNOWN';

export interface UserDeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  platform: DevicePlatform;
  browser: string;
  ipAddress: string;
  location: string;
  isCurrentSession: boolean;
  createdAt: string;
  lastActiveAt: string;
  userAgent?: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export interface OAuthScopeDefinition {
  scope: string;
  name: string;
  description: string;
  category: 'IDENTITY' | 'PROFILE' | 'STORE' | 'STUDIO' | 'GAMING' | 'DEVELOPER' | 'ADMIN';
  isSensitive?: boolean;
}

export type IdentityRoute =
  | '/identity'
  | '/identity/login'
  | '/identity/signup'
  | '/identity/account'
  | '/identity/account/security'
  | '/identity/account/devices'
  | '/identity/account/connections'
  | '/identity/apps'
  | '/identity/admin'
  | '/identity/admin/oauth';

export type IdentityAccountSubTab =
  | 'PROFILE'
  | 'SECURITY'
  | 'DEVICES'
  | 'CONNECTIONS'
  | 'APPS'
  | 'NOTIFICATIONS'
  | 'ORGANIZATION'
  | 'PRIVACY'
  | 'BILLING'
  | 'SETTINGS';

export interface OAuthClientApp {
  id?: string;
  clientId: string;
  clientSecretHint?: string;
  clientName: string;
  description: string;
  appType?: 'WEB' | 'MOBILE' | 'DESKTOP' | 'SERVICE' | 'GAME';
  ownerUid: string;
  ownerEmail?: string;
  homepageUrl: string;
  redirectUris: string[];
  callbackUrls?: string[];
  allowedOrigins?: string[];
  allowedScopes: string[];
  isFirstParty: boolean;
  status: 'ACTIVE' | 'BACKEND_PENDING' | 'REVOKED' | 'SUSPENDED';
  createdAt: string;
  updatedAt?: string;
  secretLastRotatedAt?: string;
  logoUrl?: string;
}

export interface OAuthClientSecretResult {
  clientId: string;
  clientSecret: string;
  clientName: string;
}

export interface UniversalIdentitySecurityAudit {
  securityScore: number; // 0 - 100
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  activeSessionsCount: number;
  connectedAppsCount: number;
  hasStrongPassword: boolean;
  lastPasswordChange?: string;
  securityTier: 'TIER_1_STANDARD' | 'TIER_2_DEVELOPER' | 'TIER_3_FORTRESS';
}
