import { StoreApp, AppNotification, User } from '../types';

export const GUEST_USER: User = {
  id: '',
  name: 'Guest User',
  email: '',
  role: 'USER',
  realRole: 'USER',
  activeViewRole: 'USER',
  avatarUrl: '/avanyx-identity-avatar.svg',
  verifiedDeveloper: false,
  developerStatus: 'NONE',
  studentStatus: 'NONE',
  adminStatus: 'NONE',
  verificationBadge: 'NONE',
  emailVerified: false,
  status: 'ACTIVE'
};

export const INITIAL_USER: User = GUEST_USER;

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_sec_01',
    title: 'Security Scan Completed',
    message: 'Avanyx Security engine completed runtime system verification. System integrity verified.',
    timestamp: new Date().toISOString(),
    isRead: false,
    type: 'SECURITY'
  },
  {
    id: 'notif_promo_01',
    title: 'Spotlight: Nova Player Ultra',
    message: 'Discover the latest release of Nova Player with lossless media playback and hardware acceleration.',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    isRead: false,
    type: 'PROMOTION',
    deepLinkAppId: 'nova_player'
  },
  {
    id: 'notif_sys_01',
    title: 'AVANYX Store Updated',
    message: 'Store engine updated to v3.5.5.9 with direct Firestore catalog streaming.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    isRead: true,
    type: 'SYSTEM'
  }
];
