import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  User,
  Shield,
  Key,
  Mail,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Sparkles,
  GraduationCap,
  Terminal,
  ArrowLeft,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const AccountSettingsScreen: React.FC = () => {
  const {
    user,
    firebaseUser,
    isAuthenticated,
    updateProfileDetails,
    updateUserPassword,
    changeUserEmail,
    sendPasswordReset,
    sendVerificationEmail,
    deleteAccount,
    setCurrentTab
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'PROFILE' | 'SECURITY' | 'VERIFICATION' | 'DANGER'>('PROFILE');

  // Profile Form State
  const [displayName, setDisplayName] = useState(user.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [bio, setBio] = useState(user.bio || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security - Email Change State
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // Security - Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Password Reset & Verification link
  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verifySending, setVerifySending] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Danger Zone - Account Deletion
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);
    try {
      await updateProfileDetails(displayName.trim(), avatarUrl.trim(), bio.trim());
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Email Change
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);
    const targetEmail = newEmail.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setEmailMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (targetEmail.toLowerCase() === user.email.toLowerCase()) {
      setEmailMessage({ type: 'error', text: 'The new email is the same as your current email.' });
      return;
    }

    setEmailSaving(true);
    try {
      await changeUserEmail(emailCurrentPassword, targetEmail);
      setEmailMessage({ type: 'success', text: 'Email changed successfully!' });
      setNewEmail('');
      setEmailCurrentPassword('');
    } catch (err: any) {
      setEmailMessage({ type: 'error', text: err.message || 'Failed to update email.' });
    } finally {
      setEmailSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handle Password Reset Email
  const handleSendPasswordReset = async () => {
    setResetMessage(null);
    setResetSending(true);
    try {
      await sendPasswordReset(user.email);
      setResetMessage({
        type: 'success',
        text: `Password reset link sent to ${user.email}. Check your inbox!`
      });
    } catch (err: any) {
      setResetMessage({ type: 'error', text: err.message || 'Failed to send password reset email.' });
    } finally {
      setResetSending(false);
    }
  };

  // Handle Send Verification Email
  const handleSendVerification = async () => {
    setVerifyMessage(null);
    setVerifySending(true);
    try {
      await sendVerificationEmail();
      setVerifyMessage({
        type: 'success',
        text: `Verification email sent to ${user.email}. Please check your inbox and click the verification link.`
      });
    } catch (err: any) {
      setVerifyMessage({ type: 'error', text: err.message || 'Failed to send verification email.' });
    } finally {
      setVerifySending(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
      setShowDeleteModal(false);
      setCurrentTab('HOME');
    } catch (err: any) {
      setDeleteError(err.message || 'Account deletion failed.');
      setDeleteLoading(false);
    }
  };

  if (!isAuthenticated && !user.id.startsWith('usr_')) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#6750A4]/10 dark:bg-[#D0BCFF]/10 text-[#6750A4] dark:text-[#D0BCFF] flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
          Authentication Required
        </h2>
        <p className="text-sm text-[#49454F] dark:text-[#CAC4D0]">
          Please sign in to manage your account settings, security preferences, and verifications.
        </p>
        <button
          id="btn-goto-login-settings"
          onClick={() => setCurrentTab('PROFILE')}
          className="px-6 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-bold text-sm shadow transition-all"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const isPrimaryAdmin = user.email.toLowerCase() === 'alok8881864873@gmail.com' || user.realRole === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-profile"
            onClick={() => setCurrentTab('PROFILE')}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#49454F] dark:text-[#CAC4D0] transition-colors"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
              <User className="w-6 h-6 text-[#6750A4] dark:text-[#D0BCFF]" />
              Account Settings
            </h1>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Manage your personal details, credentials, and verification status.
            </p>
          </div>
        </div>

        {/* Role status badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isPrimaryAdmin
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : user.realRole === 'DEVELOPER'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : user.realRole === 'STUDENT'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] border border-[#6750A4]/20'
            }`}
          >
            {isPrimaryAdmin ? '👑 Admin Account' : `Role: ${user.realRole}`}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/10 dark:border-white/10 gap-2 sm:gap-6 overflow-x-auto pb-1">
        <button
          id="tab-btn-profile"
          onClick={() => setActiveSubTab('PROFILE')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'PROFILE'
              ? 'border-[#6750A4] dark:border-[#D0BCFF] text-[#6750A4] dark:text-[#D0BCFF]'
              : 'border-transparent text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" /> Profile & Identity
        </button>

        <button
          id="tab-btn-security"
          onClick={() => setActiveSubTab('SECURITY')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'SECURITY'
              ? 'border-[#6750A4] dark:border-[#D0BCFF] text-[#6750A4] dark:text-[#D0BCFF]'
              : 'border-transparent text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" /> Security & Credentials
        </button>

        <button
          id="tab-btn-verification"
          onClick={() => setActiveSubTab('VERIFICATION')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'VERIFICATION'
              ? 'border-[#6750A4] dark:border-[#D0BCFF] text-[#6750A4] dark:text-[#D0BCFF]'
              : 'border-transparent text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Role & Verifications
        </button>

        <button
          id="tab-btn-danger"
          onClick={() => setActiveSubTab('DANGER')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'DANGER'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-[#49454F] dark:text-[#CAC4D0] hover:text-rose-600 dark:hover:text-rose-400'
          }`}
        >
          <Trash2 className="w-4 h-4" /> Danger Zone
        </button>
      </div>

      {/* TAB 1: PROFILE & IDENTITY */}
      {activeSubTab === 'PROFILE' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1F24] border border-black/5 dark:border-white/5 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
              <User className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
              Public Profile Information
            </h2>

            {profileMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                <img
                  src={avatarUrl || user.avatarUrl}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#6750A4]/20 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]">Avatar Image</p>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('/avanyx-identity-avatar.svg')}
                      className="text-[11px] font-bold text-amber-500 hover:text-amber-400 underline"
                    >
                      👑 Use AVANYX Identity Avatar
                    </button>
                  </div>
                  <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                    Provide a direct HTTPS URL or use your official AVANYX Identity emblem.
                  </p>
                  <input
                    id="input-avatar-url"
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or /avanyx-identity-avatar.svg"
                    className="mt-2 w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Display Name
                </label>
                <input
                  id="input-display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name or handle"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Bio / Tagline
                </label>
                <textarea
                  id="input-user-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about yourself or your software projects..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="btn-save-profile"
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-bold text-xs shadow transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {profileSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Profile Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & CREDENTIALS */}
      {activeSubTab === 'SECURITY' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Email Verification Status Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1F24] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                  Email Address & Verification
                </h3>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                  Current: <span className="font-semibold">{user.email}</span>
                </p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  firebaseUser?.emailVerified || user.emailVerified
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                {firebaseUser?.emailVerified || user.emailVerified ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Unverified
                  </>
                )}
              </span>
            </div>

            {verifyMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  verifyMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {verifyMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {verifyMessage.text}
              </div>
            )}

            {!(firebaseUser?.emailVerified || user.emailVerified) && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  Verify your email to secure your account and unlock developer publishing.
                </p>
                <button
                  id="btn-send-verification-email"
                  onClick={handleSendVerification}
                  disabled={verifySending}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {verifySending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Send Verification Email'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Change Email Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1F24] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
              Change Email Address
            </h3>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              To change your login email, provide your new email address along with your current password.
            </p>

            {emailMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  emailMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {emailMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {emailMessage.text}
              </div>
            )}

            <form onSubmit={handleChangeEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  New Email Address
                </label>
                <input
                  id="input-new-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="newemail@example.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Current Password (for security verification)
                </label>
                <div className="relative">
                  <input
                    id="input-email-current-password"
                    type={showEmailPassword ? 'text' : 'password'}
                    required
                    value={emailCurrentPassword}
                    onChange={(e) => setEmailCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2 pr-10 text-xs rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showEmailPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="btn-update-email"
                  type="submit"
                  disabled={emailSaving}
                  className="px-5 py-2 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-bold text-xs shadow transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {emailSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating Email...
                    </>
                  ) : (
                    'Update Email'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1F24] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
              Update Account Password
            </h3>

            {passwordMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="input-pass-current"
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2 pr-10 text-xs rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    id="input-pass-new"
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2 pr-10 text-xs rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Confirm New Password
                </label>
                <input
                  id="input-pass-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  id="btn-trigger-reset-email"
                  type="button"
                  onClick={handleSendPasswordReset}
                  disabled={resetSending}
                  className="text-xs text-[#6750A4] dark:text-[#D0BCFF] hover:underline font-semibold flex items-center gap-1"
                >
                  {resetSending ? 'Sending reset link...' : 'Forgot password? Send reset email'}
                </button>

                <button
                  id="btn-update-password"
                  type="submit"
                  disabled={passwordSaving}
                  className="px-5 py-2 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-bold text-xs shadow transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {passwordSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>

            {resetMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  resetMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {resetMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {resetMessage.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ROLE & VERIFICATIONS */}
      {activeSubTab === 'VERIFICATION' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Authoritative Role Summary */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1F24] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
              Account Authoritative Roles & Verification Tier
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0]">
                  Authoritative Backend Role:
                </span>
                <p className="text-sm font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
                  {user.realRole}
                </p>
                <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                  Gated directly by Firestore security rules. Cannot be modified client-side.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0]">
                  Verification Badge:
                </span>
                <p className="text-sm font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-1.5">
                  {user.verificationBadge === 'VERIFIED' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> VERIFIED BADGE
                    </span>
                  ) : (
                    <span className="text-[#49454F] dark:text-[#CAC4D0]">STANDARD (NONE)</span>
                  )}
                </p>
                <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                  Displayed publicly next to your apps and comments.
                </p>
              </div>
            </div>
          </div>

          {/* Developer Verification Module */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1F24] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
                    Developer Account Status
                  </h3>
                  <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                    Publish and distribute Android APKs to thousands of AVANYX Store users.
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  user.developerStatus === 'VERIFIED'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : user.developerStatus === 'PENDING'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-black/5 dark:bg-white/5 text-[#49454F] dark:text-[#CAC4D0]'
                }`}
              >
                {user.developerStatus === 'VERIFIED'
                  ? 'VERIFIED'
                  : user.developerStatus === 'PENDING'
                  ? 'PENDING APPROVAL'
                  : 'NOT APPLIED'}
              </span>
            </div>

            {user.developerStatus === 'VERIFIED' ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
                <span>Your Developer Account is active and verified. You can publish apps directly in Developer Console.</span>
                <button
                  id="btn-goto-dev-console"
                  onClick={() => setCurrentTab('DEV_CONSOLE')}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Open Dev Console
                </button>
              </div>
            ) : user.developerStatus === 'PENDING' ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                Your Developer Verification application is currently under review by our Admin team. You will be notified once approved.
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  Apply for a Developer account to publish apps and get a verified badge.
                </p>
                <button
                  id="btn-apply-developer-from-settings"
                  onClick={() => setCurrentTab('PROFILE')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Submit Developer Application
                </button>
              </div>
            )}
          </div>

          {/* Student Verification Module */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1F24] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
                    Student Verification Status
                  </h3>
                  <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                    Verified students receive exclusive developer tools and student developer badges.
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  user.studentStatus === 'VERIFIED'
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    : user.studentStatus === 'PENDING'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-black/5 dark:bg-white/5 text-[#49454F] dark:text-[#CAC4D0]'
                }`}
              >
                {user.studentStatus === 'VERIFIED'
                  ? 'VERIFIED STUDENT'
                  : user.studentStatus === 'PENDING'
                  ? 'PENDING APPROVAL'
                  : 'NOT APPLIED'}
              </span>
            </div>

            {user.studentStatus === 'VERIFIED' ? (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-400 font-semibold">
                Your Student Status is active and verified with your academic institution.
              </div>
            ) : user.studentStatus === 'PENDING' ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                Your Student Verification request is currently in the Admin approval queue.
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  Verify with your school or university to claim your student badge.
                </p>
                <button
                  id="btn-apply-student-from-settings"
                  onClick={() => setCurrentTab('PROFILE')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Apply for Student Verification
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DANGER ZONE */}
      {activeSubTab === 'DANGER' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete AVANYX Account
            </h3>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Permanently delete your user account, cloud profile data, and personal records from the AVANYX platform. This action cannot be undone.
            </p>

            {isPrimaryAdmin ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                🛡️ Security Protection: Administrator accounts ({user.email}) are system-critical and cannot be self-deleted from the user dashboard.
              </div>
            ) : (
              <div className="pt-2">
                <button
                  id="btn-open-delete-modal"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete My Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#1E1F24] rounded-2xl border border-rose-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
                Confirm Permanent Account Deletion
              </h3>
            </div>

            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">{user.email}</span>? All of your saved preferences, downloaded apps, and verification records will be permanently removed.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {deleteError}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Type <span className="text-rose-600 font-mono">DELETE</span> to confirm:
                </label>
                <input
                  id="input-delete-confirm-text"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Your Account Password (optional verification):
                </label>
                <input
                  id="input-delete-confirm-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                id="btn-cancel-delete"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeletePassword('');
                  setDeleteError(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-account"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  'Permanently Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
