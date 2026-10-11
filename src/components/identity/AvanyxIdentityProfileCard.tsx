import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AvanyxIdentityAvatar } from './AvanyxIdentityAvatar';
import { AvanyxIdentityBadge } from './AvanyxIdentityBadge';
import { calculateIdentitySecurityAudit } from '../../services/identityService';
import {
  ShieldCheck,
  Sparkles,
  KeyRound,
  Lock,
  Mail,
  Globe,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Edit3,
  Save,
  RefreshCw,
  Share2
} from 'lucide-react';

export const AvanyxIdentityProfileCard: React.FC = () => {
  const { user, isAuthenticated, updateProfileDetails, sendVerificationEmail } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  const securityAudit = calculateIdentitySecurityAudit(user, [], []);

  const handleCopyUid = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfileDetails(displayName.trim() || user.name, avatarUrl.trim() || user.avatarUrl, bio.trim());
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.warn('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerify = async () => {
    try {
      await sendVerificationEmail();
      setEmailSentNotice(true);
      setTimeout(() => setEmailSentNotice(false), 4000);
    } catch (err) {
      console.warn('Error sending verify email:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>Universal AVANYX Identity profile updated and synchronized across all products!</span>
        </div>
      )}

      {emailSentNotice && (
        <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-800 dark:text-sky-300 text-xs font-bold flex items-center gap-2.5">
          <Mail className="w-4 h-4 shrink-0 text-sky-500" />
          <span>Verification email dispatched to {user?.email}. Check your inbox!</span>
        </div>
      )}

      {/* Main Identity Banner Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1E1B26] border border-black/5 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AvanyxIdentityAvatar
              src={user?.avatarUrl}
              name={user?.name}
              size="xl"
              glow
              showBadge={user?.verificationBadge === 'VERIFIED'}
              badgeType={
                user?.role === 'ADMIN'
                  ? 'ADMIN'
                  : user?.role === 'DEVELOPER'
                  ? 'DEV'
                  : user?.role === 'STUDENT'
                  ? 'STUDENT'
                  : 'VERIFIED'
              }
            />

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {user?.name || 'AVANYX User'}
                </h3>
                <AvanyxIdentityBadge
                  variant="compact"
                />
              </div>

              <p className="text-xs text-slate-500 dark:text-[#CAC4D0] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email}</span>
                {user?.emailVerified ? (
                  <span className="text-[10px] text-emerald-500 font-bold ml-1">(Verified)</span>
                ) : (
                  <button
                    onClick={handleSendVerify}
                    className="text-[10px] text-amber-500 hover:underline font-bold ml-1"
                  >
                    (Verify Email)
                  </button>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {!isEditing ? (
              <button
                onClick={() => {
                  setDisplayName(user.name);
                  setAvatarUrl(user.avatarUrl);
                  setBio(user.bio || '');
                  setIsEditing(true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Universal UID and Security Score Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Universal UID Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Universal Single Sign-On UID
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-800 dark:text-amber-400 font-bold truncate">
                {user?.id || 'GUEST_UNIFIED_ID'}
              </span>
              <button
                onClick={handleCopyUid}
                className="p-1 text-slate-400 hover:text-amber-500 transition shrink-0"
                title="Copy UID"
              >
                {copiedUid ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Score Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Identity Security Level
              </span>
              <span className="text-xs font-black text-amber-500">
                {securityAudit.securityScore}% ({securityAudit.securityTier.replace('_', ' ')})
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${securityAudit.securityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="/avanyx-identity-avatar.svg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Universal Developer / Gaming Bio
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a short bio across AVANYX Store, Aether Platform, and Bomb Rush 3D..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving Changes...' : 'Save & Sync Identity'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
