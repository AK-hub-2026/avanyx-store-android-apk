import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { isPrimaryAdminEmail } from '../services/firestoreService';
import {
  AvanyxIdentityAvatar,
  AvanyxIdentityBadge,
  AvanyxIdentityAuthCard
} from '../components/identity';
import {
  User,
  Settings,
  Bell,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  ExternalLink,
  Lock,
  LogIn,
  LogOut,
  Mail,
  UserPlus,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  GraduationCap,
  Sparkles,
  KeyRound,
  Trash2,
  Edit3,
  X,
  BadgeCheck,
  Eye,
  Building2,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const {
    user,
    firebaseUser,
    isAuthenticated,
    authLoading,
    authError,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    setAdminViewRole,
    updateProfileDetails,
    sendPasswordReset,
    sendVerificationEmail,
    deleteAccount,
    requestDeveloperVerification,
    requestStudentVerification,
    clearAuthError,
    apps,
    notifications,
    setCurrentTab
  } = useStore();

  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedHostname, setCopiedHostname] = useState(false);

  // Edit Profile Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatarUrl);
  const [editBio, setEditBio] = useState(user.bio || '');

  // Forgot Password Modal State (Before Authentication)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyHostname = (hostToCopy?: string) => {
    const text = hostToCopy || currentHostname;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedHostname(true);
      setTimeout(() => setCopiedHostname(false), 2500);
    }
  };

  const installedApps = apps.filter((app) => app.isInstalled);
  const isAdmin = isAuthenticated && (user.role === 'ADMIN' || user.realRole === 'ADMIN' || isPrimaryAdminEmail(user.email));
  const isDeveloper = isAuthenticated && (isAdmin || user.role === 'DEVELOPER' || user.realRole === 'DEVELOPER' || user.verifiedDeveloper || user.developerStatus === 'VERIFIED');
  const isStudent = isAuthenticated && (isAdmin || user.role === 'STUDENT' || user.realRole === 'STUDENT' || user.studentStatus === 'VERIFIED');
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPass = password;
    const cleanName = displayName.trim();

    if (!cleanEmail || !cleanPass) return;
    setIsSubmitting(true);
    setActionSuccess(null);
    clearAuthError();
    try {
      if (authMode === 'LOGIN') {
        await signInWithEmail(cleanEmail, cleanPass);
        setActionSuccess('Signed in successfully via Firebase Auth!');
      } else {
        await signUpWithEmail(cleanEmail, cleanPass, cleanName);
        setActionSuccess('Account created and signed in via Firebase Auth!');
      }
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch {
      // Error handled by StoreContext authError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setActionSuccess(null);
    clearAuthError();
    try {
      await signInWithGoogle();
      setActionSuccess('Signed in with Google successfully!');
    } catch {
      // Error handled in StoreContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRedirectSignIn = async () => {
    setIsSubmitting(true);
    setActionSuccess(null);
    clearAuthError();
    try {
      await signInWithGoogleRedirect();
    } catch {
      // Error handled in StoreContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await signOutUser();
      setActionSuccess('Signed out of Firebase account.');
    } catch {
      // Error handled in StoreContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await updateProfileDetails(editName, editAvatar, editBio);
      setIsEditingProfile(false);
      setActionSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.warn('[Profile Edit Notice]', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await sendPasswordReset();
      setActionSuccess(`Password reset email sent to ${user.email}. Check your inbox!`);
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await sendVerificationEmail();
      setActionSuccess(`Verification email sent to ${user.email}. Please verify your address!`);
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      setActionSuccess('Account successfully deleted.');
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnauthenticatedPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setForgotMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    setForgotSubmitting(true);
    setForgotMessage(null);
    try {
      await sendPasswordReset(cleanEmail);
      setForgotMessage({
        type: 'success',
        text: `If an account is associated with ${cleanEmail}, a password reset email has been sent. Please check your inbox and spam folder.`
      });
      setForgotEmail('');
    } catch (err: any) {
      setForgotMessage({
        type: 'error',
        text: err.message || 'Failed to send password reset email. Please try again later.'
      });
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-white via-white to-[#F3EDF7] dark:from-[#1E1F23] dark:via-[#1E1F23] dark:to-[#2A282F] border border-black/5 dark:border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#6750A4]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <AvanyxIdentityAvatar
              src={user.avatarUrl}
              name={user.name}
              size="xl"
              showBadge={user.verificationBadge === 'VERIFIED'}
              badgeType={
                user.role === 'ADMIN'
                  ? 'ADMIN'
                  : user.role === 'DEVELOPER'
                  ? 'DEV'
                  : user.role === 'STUDENT'
                  ? 'STUDENT'
                  : 'VERIFIED'
              }
              glow={user.role === 'ADMIN'}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
                  {user.name}
                </h1>

                {/* Role Pill */}
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                    user.role === 'ADMIN'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : user.role === 'DEVELOPER'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : user.role === 'STUDENT'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      : 'bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF]'
                  }`}
                >
                  {user.role === 'ADMIN' && <ShieldAlert className="w-3.5 h-3.5" />}
                  {user.role === 'DEVELOPER' && <Terminal className="w-3.5 h-3.5" />}
                  {user.role === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5" />}
                  {user.role === 'USER' && <ShieldCheck className="w-3.5 h-3.5" />}
                  {user.role}
                </span>

                {user.verificationBadge === 'VERIFIED' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Badge
                  </span>
                )}

                {isAuthenticated && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Firebase Single UID
                  </span>
                )}
              </div>

              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] font-medium">
                {user.email || 'Guest User (Unauthenticated)'}
              </p>

              {user.bio && (
                <p className="text-xs text-[#1D1B20] dark:text-[#E6E1E5] italic pt-0.5 max-w-md">
                  "{user.bio}"
                </p>
              )}

              <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] font-mono">
                UID: {user.id || 'GUEST_SESSION'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {isAuthenticated && (
              <button
                onClick={() => {
                  setEditName(user.name);
                  setEditAvatar(user.avatarUrl);
                  setEditBio(user.bio || '');
                  setIsEditingProfile(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-[#1D1B20] dark:text-[#E6E1E5] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] font-bold text-xs shadow-sm transition-all"
              >
                <Edit3 className="w-4 h-4 text-[#6750A4]" />
                Edit Profile
              </button>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : null}
          </div>
        </div>

        {/* Master Admin View Switcher (Only visible to authenticated ADMIN accounts) */}
        {user.realRole === 'ADMIN' && (
          <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#6750A4]/5 dark:bg-[#D0BCFF]/5 p-4 rounded-2xl">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-[#6750A4] dark:text-[#D0BCFF] flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Admin Store Preview Mode
              </span>
              <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                Preview store behavior under different role views (User / Developer / Student / Admin) without altering backend permissions.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#1E1F23] rounded-2xl shrink-0 shadow-sm border border-black/5 dark:border-white/5">
              {(['USER', 'DEVELOPER', 'STUDENT', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAdminViewRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    user.role === r
                      ? 'bg-[#6750A4] text-white shadow-sm'
                      : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verification Status Cards (Developer / Student) */}
      {isAuthenticated && (() => {
        const isAdmin = user.role === 'ADMIN' || user.realRole === 'ADMIN' || isPrimaryAdminEmail(user.email);
        const isDevVerified = isAdmin || user.developerStatus === 'VERIFIED' || user.developerStatus === 'APPROVED' || user.role === 'DEVELOPER' || user.realRole === 'DEVELOPER' || user.role === 'VERIFIED_DEVELOPER' || user.realRole === 'VERIFIED_DEVELOPER';
        const isDevPending = !isAdmin && (user.developerStatus === 'PENDING' || user.developerStatus === 'PENDING_REVIEW' || user.developerStatus === 'UNDER_REVIEW');
        const isStuVerified = !isAdmin && (user.studentStatus === 'VERIFIED' || user.studentStatus === 'APPROVED' || user.role === 'STUDENT' || user.realRole === 'STUDENT' || user.role === 'VERIFIED_STUDENT' || user.realRole === 'VERIFIED_STUDENT');
        const isStuPending = !isAdmin && (user.studentStatus === 'PENDING' || user.studentStatus === 'PENDING_REVIEW' || user.studentStatus === 'UNDER_REVIEW');

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Developer Verification Box */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-3 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                    <Terminal className="w-4.5 h-4.5 text-emerald-500" />
                    <span>Developer Verification</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isAdmin
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                        : isDevVerified
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : isDevPending
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-black/5 dark:bg-white/5 text-[#49454F] dark:text-[#CAC4D0]'
                    }`}
                  >
                    {isAdmin
                      ? 'ADMINISTRATOR VERIFIED'
                      : isDevVerified
                      ? 'VERIFIED'
                      : isDevPending
                      ? 'PENDING REVIEW'
                      : 'UNVERIFIED'}
                  </span>
                </div>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                  {isAdmin
                    ? 'Permanent developer and global store management privileges are actively provisioned for this Administrator account.'
                    : 'Publish Android APKs directly to the global store, sign releases with SHA-256 certificates, and manage store listings.'}
                </p>
              </div>

              {isAdmin ? (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Full Developer & Admin Access Active
                  </span>
                  <button
                    onClick={() => setCurrentTab('DEV_CONSOLE')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#6750A4] text-white text-xs font-bold hover:bg-[#523e85] transition-all flex items-center gap-1.5"
                  >
                    Developer Console &rarr;
                  </button>
                </div>
              ) : isDevVerified ? (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Developer privileges active
                  </span>
                  <button
                    onClick={() => setCurrentTab('DEV_CONSOLE')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                  >
                    Console &rarr;
                  </button>
                </div>
              ) : isDevPending ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Pending Admin Review</span>
                    </span>
                    <span className="font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      {user.developerDetails?.caseId || 'DEV-REVIEW'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                    Aadhaar, selfie, and studio credentials submitted. Verification in progress.
                  </p>
                  <button
                    onClick={() => setCurrentTab('DEVELOPER_APPLY')}
                    className="w-full py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <span>View Application & Status</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentTab('DEVELOPER_APPLY')}
                  className="w-full py-2.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Apply for Developer Verification
                </button>
              )}
            </div>

            {/* Student Verification Box */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-3 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                    <GraduationCap className="w-4.5 h-4.5 text-blue-500" />
                    <span>Student Verification</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isAdmin
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                        : isStuVerified
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : isStuPending
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-black/5 dark:bg-white/5 text-[#49454F] dark:text-[#CAC4D0]'
                    }`}
                  >
                    {isAdmin
                      ? 'ADMINISTRATOR'
                      : isStuVerified
                      ? 'VERIFIED'
                      : isStuPending
                      ? 'PENDING REVIEW'
                      : 'UNVERIFIED'}
                  </span>
                </div>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                  {isAdmin
                    ? 'Administrative role active. Administrator access supersedes academic and student tier restrictions.'
                    : 'Gain verified student badges, early access developer beta tracks, and academic developer cloud tiers.'}
                </p>
              </div>

              {isAdmin ? (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Academic Restrictions Waived
                  </span>
                  <span className="text-[11px] font-mono text-[#49454F] dark:text-[#CAC4D0]">
                    Administrator Tier
                  </span>
                </div>
              ) : isStuVerified ? (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Student status verified
                  </span>
                  <button
                    onClick={() => setCurrentTab('STUDENT_CONSOLE')}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5"
                  >
                    Student Console &rarr;
                  </button>
                </div>
              ) : isStuPending ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Pending Admin Review</span>
                    </span>
                    <span className="font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      {user.studentDetails?.caseId || 'STU-REVIEW'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                    Class 10th Marksheet/TC and Aadhaar credentials submitted for verification.
                  </p>
                  <button
                    onClick={() => setCurrentTab('STUDENT_APPLY')}
                    className="w-full py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <span>View Application & Status</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentTab('STUDENT_APPLY')}
                  className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" /> Apply for Student Verification
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Account Management & Security Section (Kept inside profile menu only) */}
      {isAuthenticated && (
        <div id="profile-account-management" className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
                  <span>Account Management & Security</span>
                </h2>
              </div>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                Session governance, security credentials, password, and single UID authentication &bull; UID: <span className="font-mono text-[#6750A4] dark:text-[#D0BCFF]">{user.id || 'ACTIVE'}</span>
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{authError}</div>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div className="space-y-4 pt-1">
            {/* Authenticated user management buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                id="btn-goto-account-settings"
                onClick={() => setCurrentTab('ACCOUNT_SETTINGS')}
                className="p-3.5 rounded-2xl bg-[#6750A4]/10 dark:bg-[#D0BCFF]/10 hover:bg-[#6750A4]/20 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold transition-all flex items-center gap-2.5 text-left border border-[#6750A4]/20"
              >
                <Settings className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                <div>
                  <div>Account Settings</div>
                  <div className="text-[10px] font-normal text-[#49454F] dark:text-[#CAC4D0]">Email, password, security</div>
                </div>
              </button>

              <button
                onClick={handlePasswordReset}
                disabled={isSubmitting}
                className="p-3.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] text-[#1D1B20] dark:text-[#E6E1E5] text-xs font-bold transition-all flex items-center gap-2.5 text-left"
              >
                <KeyRound className="w-4 h-4 text-amber-500" />
                <div>
                  <div>Reset / Change Password</div>
                  <div className="text-[10px] font-normal text-[#49454F] dark:text-[#CAC4D0]">Send secure reset link</div>
                </div>
              </button>

              <button
                onClick={handleSendVerificationEmail}
                disabled={isSubmitting}
                className="p-3.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] text-[#1D1B20] dark:text-[#E6E1E5] text-xs font-bold transition-all flex items-center gap-2.5 text-left"
              >
                <Mail className="w-4 h-4 text-emerald-500" />
                <div>
                  <div>Email Verification</div>
                  <div className="text-[10px] font-normal text-[#49454F] dark:text-[#CAC4D0]">
                    {user.emailVerified ? 'Verified address' : 'Send verification link'}
                  </div>
                </div>
              </button>
            </div>

            {/* Account Deletion Section (Forbidden for Admin) */}
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" /> Danger Zone: Delete Account
                </span>
                <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                  Permanently erase your user profile and Firestore data.
                  {user.realRole === 'ADMIN' && (
                    <span className="font-bold text-rose-600 block mt-0.5">
                      (Admin accounts cannot be self-deleted for security and system continuity).
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={user.realRole === 'ADMIN'}
                className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
            <span className="text-xs font-bold">Installed Applications</span>
            <PackageCheck className="w-4 h-4 text-[#6750A4]" />
          </div>
          <p className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
            {installedApps.length} APKS
          </p>
          <span className="text-[10px] text-emerald-500 font-bold">100% CyberShield Scanned</span>
        </div>

        <div
          onClick={() => setCurrentTab('NOTIFICATIONS')}
          className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-1 cursor-pointer hover:border-[#6750A4]/40 transition-all"
        >
          <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
            <span className="text-xs font-bold">Unread Notifications</span>
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
            {unreadCount} Alerts
          </p>
          <span className="text-[10px] text-[#6750A4] dark:text-[#D0BCFF] font-bold">Click to view alerts</span>
        </div>

        {isAdmin ? (
          <div
            onClick={() => setCurrentTab('ADMIN_CONSOLE')}
            className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-rose-500/20 space-y-1 cursor-pointer hover:border-rose-500/40 transition-all"
          >
            <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
              <span className="text-xs font-bold">Admin Console</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              Admin Access
            </p>
            <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
              Open Admin Console <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        ) : isDeveloper ? (
          <div
            onClick={() => setCurrentTab('DEV_CONSOLE')}
            className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-1 cursor-pointer hover:border-[#6750A4]/40 transition-all"
          >
            <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
              <span className="text-xs font-bold">Developer Studio</span>
              <Terminal className="w-4 h-4 text-[#6750A4]" />
            </div>
            <p className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
              Developer
            </p>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              Open Developer Console <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        ) : isStudent ? (
          <div
            onClick={() => setCurrentTab('STUDENT_CONSOLE')}
            className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-cyan-500/20 space-y-1 cursor-pointer hover:border-cyan-500/40 transition-all"
          >
            <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
              <span className="text-xs font-bold">Student Console</span>
              <GraduationCap className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              Student Edition
            </p>
            <span className="text-[10px] text-cyan-500 font-bold flex items-center gap-1">
              Open Student Console <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        ) : (
          <div
            onClick={() => setCurrentTab('DEVELOPER_APPLY')}
            className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-1 cursor-pointer hover:border-[#6750A4]/40 transition-all"
          >
            <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
              <span className="text-xs font-bold">Developer Program</span>
              <BadgeCheck className="w-4 h-4 text-[#6750A4]" />
            </div>
            <p className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
              Standard User
            </p>
            <span className="text-[10px] text-[#6750A4] dark:text-[#D0BCFF] font-bold flex items-center gap-1">
              Apply for Developer Verification <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#6750A4]" />
                Edit Profile Details
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Bio / Status Note
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Android developer, AI explorer..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold hover:bg-[#523e85] disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal (Before Authentication) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
                Reset Your Password
              </h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage(null);
                }}
                className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
              Enter your account's email address. We'll send a secure password reset link to your inbox.
            </p>

            {forgotMessage && (
              <div
                className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                  forgotMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {forgotMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{forgotMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUnauthenticatedPasswordReset} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Email Address
                </label>
                <input
                  id="input-forgot-password-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your-account@example.com"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMessage(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-forgot-password"
                  type="submit"
                  disabled={forgotSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {forgotSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-md w-full border border-rose-500/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Confirm Account Deletion
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
              This action is permanent and irreversible. Your user document, verification requests, and account credentials will be erased immediately.
            </p>

            <div className="p-3 rounded-2xl bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300 font-medium">
              Please type <span className="font-mono font-black">DELETE</span> below to confirm:
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-center font-bold"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || isSubmitting}
                onClick={handleDeleteAccount}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
