import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { AvanyxIdentityAvatar } from '../../components/identity/AvanyxIdentityAvatar';
import { AvanyxIdentityEmblem } from '../../components/identity/AvanyxIdentityEmblem';
import {
  fetchUserSessions,
  registerCurrentDeviceSession,
  revokeUserSession,
  revokeAllOtherSessions,
  fetchConnectedApps,
  revokeConnectedApp,
  calculateIdentitySecurityAudit,
  detectCurrentDevicePlatform,
  getClientNetworkDetails
} from '../../services/identityService';
import {
  UserDeviceSession,
  ConnectedApp,
  IdentityAccountSubTab,
  UniversalIdentitySecurityAudit
} from '../../types/identity';
import { maskPhoneNumber } from '../../services/firestoreService';
import {
  User as UserIcon,
  Shield,
  Smartphone,
  Layers,
  Bell,
  Building,
  CreditCard,
  Settings,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Mail,
  Edit3,
  ExternalLink,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Globe,
  Plus,
  ShieldCheck,
  Eye,
  EyeOff,
  ShoppingBag,
  Sparkles,
  Code2,
  Gamepad2,
  ArrowRight,
  X
} from 'lucide-react';

interface IdentityAccountPageProps {
  initialSubTab?: IdentityAccountSubTab;
  onNavigate: (path: string) => void;
}

export const IdentityAccountPage: React.FC<IdentityAccountPageProps> = ({
  initialSubTab = 'PROFILE',
  onNavigate
}) => {
  const {
    user,
    isAuthenticated,
    signOutUser,
    updateProfileDetails,
    updateUserPassword,
    sendVerificationEmail,
    deleteAccount
  } = useStore();

  const [activeTab, setActiveTab] = useState<IdentityAccountSubTab>(initialSubTab);
  const [sessions, setSessions] = useState<UserDeviceSession[]>([]);
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [securityAudit, setSecurityAudit] = useState<UniversalIdentitySecurityAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || '+91 98765 43210');
  const [editBio, setEditBio] = useState(user?.bio || 'AVANYX Explorer & Verified Universal Account');
  const [editCountry, setEditCountry] = useState(user?.country || 'India');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load Sessions & Connected Apps
  useEffect(() => {
    if (!user?.id) return;
    const loadAccountData = async () => {
      setLoading(true);
      try {
        const [activeSessions, apps] = await Promise.all([
          registerCurrentDeviceSession(user.id),
          fetchConnectedApps(user.id)
        ]);
        setSessions(activeSessions);
        setConnectedApps(apps);
        const audit = calculateIdentitySecurityAudit(user, activeSessions, apps);
        setSecurityAudit(audit);
      } catch (err) {
        console.warn('[IdentityAccountPage] Data load notice:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAccountData();
  }, [user]);

  // Sync edits when user object changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditUsername(user.username || `@${user.name.toLowerCase().replace(/\s+/g, '')}`);
      setEditAvatarUrl(user.avatarUrl || '');
      setEditBio(user.bio || 'AVANYX Explorer & Verified Universal Account');
    }
  }, [user]);

  const handleRevokeSession = async (sessionId: string) => {
    setActionError(null);
    try {
      const updated = await revokeUserSession(user.id, sessionId);
      setSessions(updated);
      setActionSuccess('Device session revoked successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to revoke device session.');
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setActionError(null);
    try {
      const updated = await revokeAllOtherSessions(user.id);
      setSessions(updated);
      setActionSuccess('All other device sessions have been securely terminated.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to revoke other sessions.');
    }
  };

  const handleRevokeApp = async (appIdOrClientId: string) => {
    setActionError(null);
    try {
      const updated = await revokeConnectedApp(user.id, appIdOrClientId);
      setConnectedApps(updated);
      setActionSuccess('App authorization revoked.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to revoke application access.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await updateProfileDetails(editName.trim(), editAvatarUrl.trim(), editBio.trim());
      setShowEditProfileModal(false);
      setActionSuccess('Universal profile updated across all AVANYX platforms.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update profile.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (newPassword.length < 6) {
      setActionError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setActionError('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordChange(false);
      setActionSuccess('Password updated successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getProductIcon = (name: string) => {
    if (name.includes('Store')) return <ShoppingBag className="w-5 h-5 text-purple-400" />;
    if (name.includes('Aether')) return <Sparkles className="w-5 h-5 text-sky-400" />;
    if (name.includes('Studio')) return <Code2 className="w-5 h-5 text-emerald-400" />;
    if (name.includes('Bomb') || name.includes('Game')) return <Gamepad2 className="w-5 h-5 text-amber-400" />;
    return <Layers className="w-5 h-5 text-violet-400" />;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#121118] border border-amber-500/30 text-center shadow-2xl">
          <AvanyxIdentityEmblem size={56} glow className="mx-auto mb-4" />
          <h2 className="text-xl font-black text-white">Sign In Required</h2>
          <p className="mt-2 text-xs text-zinc-400">
            Please sign in to access your AVANYX Identity Account Center.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => onNavigate('/identity/login')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-lg shadow-amber-500/20"
            >
              Sign In to Account
            </button>
            <button
              onClick={() => onNavigate('/identity')}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs"
            >
              Identity Landing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07060A] text-[#FAFAFA] py-6 sm:py-10 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header / Return Bar */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all"
          >
            <ArrowRight className="w-4 h-4 rotate-180 text-amber-400" />
            <span>Return to AVANYX Store</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <AvanyxIdentityEmblem size={28} glow />
              <span className="text-sm font-black text-white tracking-tight hidden sm:inline">
                AVANYX Identity
              </span>
            </div>
            <button
              onClick={() => onNavigate('/')}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all text-xs font-bold"
              title="Close Account Settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Notification Toast */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Main Dashboard Layout: Left Sidebar + Right Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 1. LEFT SIDEBAR NAVIGATION */}
          <div className="lg:col-span-3 space-y-4">
            {/* User Mini Profile Header */}
            <div className="p-5 rounded-3xl bg-[#121118] border border-amber-500/30 shadow-xl">
              <div className="flex items-center gap-3.5">
                <AvanyxIdentityAvatar
                  src={user.avatarUrl}
                  name={user.name}
                  size="md"
                  showBadge
                  badgeType={
                    user.role === 'ADMIN'
                      ? 'ADMIN'
                      : user.role === 'DEVELOPER'
                      ? 'DEV'
                      : 'VERIFIED'
                  }
                />
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-amber-400 font-semibold truncate">
                    {user.username || `@${user.name.toLowerCase().replace(/\s+/g, '')}`}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Security Tier</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black uppercase text-[9px] border border-amber-500/30">
                  {securityAudit?.securityTier.replace(/_/g, ' ') || 'TIER 3 FORTRESS'}
                </span>
              </div>
            </div>

            {/* Sidebar Tab Buttons */}
            <div className="p-2 rounded-3xl bg-[#121118] border border-white/10 space-y-1 shadow-xl">
              <button
                onClick={() => setActiveTab('PROFILE')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'PROFILE'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('SECURITY')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'SECURITY'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </button>

              <button
                onClick={() => setActiveTab('DEVICES')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'DEVICES'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Devices & Sessions</span>
              </button>

              <button
                onClick={() => setActiveTab('CONNECTIONS')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'CONNECTIONS'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Connected Accounts</span>
              </button>

              <button
                onClick={() => setActiveTab('NOTIFICATIONS')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'NOTIFICATIONS'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </button>

              <button
                onClick={() => setActiveTab('ORGANIZATION')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'ORGANIZATION'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Organization</span>
              </button>

              <button
                onClick={() => setActiveTab('PRIVACY')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'PRIVACY'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Privacy</span>
              </button>

              <button
                onClick={() => setActiveTab('APPS')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'APPS'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Connected Apps</span>
              </button>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={async () => {
                await signOutUser();
                onNavigate('/identity/login');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Everywhere</span>
            </button>
          </div>

          {/* 2. RIGHT MAIN CONTENT AREA */}
          <div className="lg:col-span-9 space-y-6">
            {/* SUBTAB 1: PROFILE */}
            {activeTab === 'PROFILE' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Header */}
                <div>
                  <h1 className="text-2xl font-black text-white">Profile Overview</h1>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Manage your personal information and profile details across all AVANYX platforms.
                  </p>
                </div>

                {/* Profile Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-[#121118] border border-amber-500/30 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <AvanyxIdentityAvatar
                        src={user.avatarUrl}
                        name={user.name}
                        size="xl"
                        showBadge
                        badgeType={
                          user.role === 'ADMIN'
                            ? 'ADMIN'
                            : user.role === 'DEVELOPER'
                            ? 'DEV'
                            : 'VERIFIED'
                        }
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white">{user.name}</h2>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        </div>
                        <div className="text-xs text-amber-400 font-semibold mt-0.5">
                          {user.username || `@${user.name.toLowerCase().replace(/\s+/g, '')}`}
                        </div>
                        <div className="mt-2 text-xs text-zinc-400 flex flex-wrap items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                            {maskPhoneNumber(user.phoneNumber || '+91 98765 43210')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            {user.country || 'India'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowEditProfileModal(true)}
                      className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>

                {/* 4 Stat Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#121118] border border-white/10">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      Account Created
                    </div>
                    <div className="mt-1 text-sm font-black text-white">
                      Jan 15, 2024
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#121118] border border-white/10">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      Account Type
                    </div>
                    <div className="mt-1 text-sm font-black text-amber-400 uppercase">
                      {user.role}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#121118] border border-white/10">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      Account Status
                    </div>
                    <div className="mt-1 text-sm font-black text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Active
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#121118] border border-white/10">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      Last Login
                    </div>
                    <div className="mt-1 text-sm font-black text-white">
                      2 min ago
                    </div>
                  </div>
                </div>

                {/* Quick Actions Grid */}
                <div>
                  <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wider text-amber-400">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => {
                        setActiveTab('SECURITY');
                        setShowPasswordChange(true);
                      }}
                      className="p-4 rounded-2xl bg-[#121118] border border-white/10 hover:border-amber-500/40 text-left transition-all group shadow-md"
                    >
                      <KeyRound className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Change Password</div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        Update account credentials
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('DEVICES')}
                      className="p-4 rounded-2xl bg-[#121118] border border-white/10 hover:border-amber-500/40 text-left transition-all group shadow-md"
                    >
                      <Smartphone className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Manage Devices</div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        {sessions.length} active sessions
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('APPS')}
                      className="p-4 rounded-2xl bg-[#121118] border border-white/10 hover:border-amber-500/40 text-left transition-all group shadow-md"
                    >
                      <Layers className="w-6 h-6 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Connected Apps</div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        {connectedApps.length} authorized platforms
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('SECURITY')}
                      className="p-4 rounded-2xl bg-[#121118] border border-white/10 hover:border-amber-500/40 text-left transition-all group shadow-md"
                    >
                      <Shield className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Security Settings</div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        2FA & recovery methods
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: SECURITY */}
            {activeTab === 'SECURITY' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-black text-white">Security & Credentials</h1>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Manage your authentication methods, password, and security score.
                  </p>
                </div>

                {/* Security Score Banner */}
                <div className="p-6 rounded-3xl bg-[#121118] border border-amber-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-2xl text-amber-400">
                      {securityAudit?.securityScore || 90}%
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        Fortress Security Status
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Your account meets maximum AVANYX cryptographic isolation standards.
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    Zero-Trust Active
                  </span>
                </div>

                {/* Password Update Card */}
                <div className="p-6 rounded-3xl bg-[#121118] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white">Account Password</h3>
                      <p className="text-xs text-zinc-400">
                        Last changed recently. Recommended to use alphanumeric characters and symbols.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200"
                    >
                      {showPasswordChange ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>

                  {showPasswordChange && (
                    <form onSubmit={handleChangePasswordSubmit} className="pt-4 border-t border-white/10 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            required
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md disabled:opacity-50"
                      >
                        {passwordLoading ? 'Updating Password...' : 'Save New Password'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 3: DEVICES & SESSIONS */}
            {activeTab === 'DEVICES' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-white">Devices & Sessions</h1>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      Manage all devices where you are currently signed in.
                    </p>
                  </div>
                  <button
                    onClick={handleRevokeAllOtherSessions}
                    className="px-4 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-black transition-all"
                  >
                    Sign Out from All Devices
                  </button>
                </div>

                {/* Privacy Guarantee Notice */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-3">
                  <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Strict Privacy Guarantee:</strong> Admins cannot view user devices. All device identifiers and sessions are strictly private to your account.
                  </span>
                </div>

                {/* Devices List */}
                <div className="space-y-3">
                  {sessions.map((sess) => {
                    const isCurrent = sess.isCurrentSession;
                    const isRevoked = sess.status === 'REVOKED';

                    return (
                      <div
                        key={sess.id}
                        className={`p-5 rounded-3xl bg-[#121118] border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          isCurrent
                            ? 'border-amber-500/50 shadow-xl shadow-amber-500/5'
                            : 'border-white/10'
                        } ${isRevoked ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-2xl ${
                              isCurrent
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-white/5 text-zinc-400 border border-white/10'
                            }`}
                          >
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-white">
                                {sess.deviceName}
                              </h3>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                                  Active now
                                </span>
                              )}
                              {isRevoked && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-black uppercase">
                                  Revoked
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-1">
                              {sess.platform} &bull; {sess.browser} &bull; {sess.location}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              Last active: {isCurrent ? 'Just now' : sess.lastActiveAt ? new Date(sess.lastActiveAt).toLocaleDateString() : 'Recent'}
                            </div>
                          </div>
                        </div>

                        {!isCurrent && !isRevoked && (
                          <button
                            onClick={() => handleRevokeSession(sess.id)}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs font-bold text-zinc-300 hover:text-rose-300 transition-all shrink-0"
                          >
                            Sign Out
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB 4: CONNECTED ACCOUNTS */}
            {activeTab === 'CONNECTIONS' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-black text-white">Connected Accounts</h1>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Manage your connected third-party federated sign-in accounts.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Google */}
                  <div className="p-5 rounded-3xl bg-[#121118] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Google Account</div>
                        <div className="text-xs text-zinc-400">{user.email}</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      Connected
                    </span>
                  </div>

                  {/* GitHub */}
                  <div className="p-5 rounded-3xl bg-[#121118] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        <Code2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">GitHub Account</div>
                        <div className="text-xs text-zinc-400">{user.name}-dev &bull; Authorized</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      Connected
                    </span>
                  </div>

                  {/* Primary Email */}
                  <div className="p-5 rounded-3xl bg-[#121118] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Primary Email Address</div>
                        <div className="text-xs text-zinc-400">{user.email} (Verified)</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
                      Primary
                    </span>
                  </div>

                  {/* Phone Number */}
                  <div className="p-5 rounded-3xl bg-[#121118] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Mobile Phone</div>
                        <div className="text-xs text-zinc-400">{maskPhoneNumber(user.phoneNumber || '+91 98765 43210')}</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 5: CONNECTED APPS */}
            {activeTab === 'APPS' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-black text-white">Connected AVANYX Apps</h1>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    These applications have authorized access to your universal AVANYX Identity.
                  </p>
                </div>

                <div className="space-y-3">
                  {connectedApps.map((app) => {
                    const isRevoked = app.status === 'REVOKED';

                    return (
                      <div
                        key={app.id}
                        className={`p-5 rounded-3xl bg-[#121118] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          isRevoked ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                            {getProductIcon(app.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-white">{app.name}</h3>
                              {isRevoked ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold">
                                  Revoked
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5">
                              {app.description}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                              Scopes: {app.authorizedScopes?.join(', ') || 'openid, profile'}
                            </div>
                          </div>
                        </div>

                        {!isRevoked && (
                          <button
                            onClick={() => handleRevokeApp(app.id)}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs font-bold text-zinc-300 hover:text-rose-300 transition-all shrink-0"
                          >
                            Revoke Access
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB 6: NOTIFICATIONS */}
            {activeTab === 'NOTIFICATIONS' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-black text-white">Notification Preferences</h1>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Configure security alerts and notification channels for your AVANYX account.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-5 rounded-3xl bg-[#121118] border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">Critical Security Alerts</h4>
                      <p className="text-xs text-zinc-400">Immediate push alerts when a new device signs in or password changes.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      Always Active
                    </span>
                  </div>

                  <div className="p-5 rounded-3xl bg-[#121118] border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">App Authorization Notices</h4>
                      <p className="text-xs text-zinc-400">Receive alerts when third-party ecosystem apps request profile scopes.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                      Enabled
                    </span>
                  </div>

                  <div className="p-5 rounded-3xl bg-[#121118] border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">Developer Release Bulletins</h4>
                      <p className="text-xs text-zinc-400">Weekly digest of SDK updates, verified APK rollouts, and platform news.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-zinc-300 border border-white/15 text-xs font-bold">
                      Subscribed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 7: ORGANIZATION */}
            {activeTab === 'ORGANIZATION' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-black text-white">Organization & Teams</h1>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Manage your developer organization, studio teams, and publishing permissions.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#121118] border border-amber-500/30 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-lg">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">{user.name}'s Studio</h3>
                      <p className="text-xs text-amber-400 font-mono">Org ID: org_{user.id.slice(0, 10)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
                      <div className="text-xs text-zinc-400">Role in Org</div>
                      <div className="text-sm font-black text-white mt-0.5">{user.role || 'Primary Owner'}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
                      <div className="text-xs text-zinc-400">Published Apps</div>
                      <div className="text-sm font-black text-white mt-0.5">{connectedApps.length} Apps</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
                      <div className="text-xs text-zinc-400">Verification Status</div>
                      <div className="text-sm font-black text-emerald-400 mt-0.5">Verified Partner</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 8: PRIVACY */}
            {activeTab === 'PRIVACY' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-black text-white">Privacy & Data Control</h1>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Your personal information is encrypted with zero-knowledge policies. Admins cannot access private sessions.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-5 rounded-3xl bg-[#121118] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-white">Download Account Archive (JSON)</h4>
                      <p className="text-xs text-zinc-400">Export a complete, machine-readable copy of your profile, sessions, and connected apps data.</p>
                    </div>
                    <button
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                          user: { id: user.id, name: user.name, email: user.email, role: user.role },
                          sessions,
                          connectedApps,
                          exportedAt: new Date().toISOString()
                        }, null, 2));
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", `avanyx_identity_${user.id}.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                        setActionSuccess('Account archive exported successfully.');
                        setTimeout(() => setActionSuccess(null), 4000);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs shrink-0 transition-all"
                    >
                      Export Data
                    </button>
                  </div>

                  <div className="p-5 rounded-3xl bg-[#121118] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-white">Strict Zero Telemetry</h4>
                      <p className="text-xs text-zinc-400">We do not sell personal data, track behavioral cross-site telemetry, or profile keystrokes.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      Enforced
                    </span>
                  </div>

                  <div className="p-5 rounded-3xl bg-[#121118] border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-rose-400">Delete AVANYX Identity</h4>
                      <p className="text-xs text-zinc-400">Permanently delete your profile and revoke all connected ecosystem apps.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete your AVANYX Identity? This action cannot be undone.")) {
                          setActionError("Please contact support@avanyx.io or submit an account erasure request to complete verification.");
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs shrink-0 transition-all"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#14131A] border border-amber-500/30 p-6 shadow-2xl text-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Edit Universal Profile
              </h3>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Country / Region
                </label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Bio / Tagline
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Avatar Photo URL
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
