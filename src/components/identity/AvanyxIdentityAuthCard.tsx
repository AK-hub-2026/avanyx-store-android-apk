import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AvanyxIdentityAvatar } from './AvanyxIdentityAvatar';
import { AvanyxIdentityBadge } from './AvanyxIdentityBadge';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Globe,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  KeyRound,
  X
} from 'lucide-react';

export interface AvanyxIdentityAuthCardProps {
  /**
   * Target application name to display (e.g. "AVANYX Store", "Aether Platform", "Developer Console")
   */
  appName?: string;
  /**
   * Initial active auth tab ('LOGIN' or 'REGISTER')
   */
  initialMode?: 'LOGIN' | 'REGISTER';
  /**
   * Callback invoked after successful authentication
   */
  onSuccess?: () => void;
  /**
   * Optional cancel/close callback if used in a modal or overlay
   */
  onCancel?: () => void;
  /**
   * Display mode: 'card' (standalone panel with borders) or 'compact' or 'embedded'
   */
  variant?: 'card' | 'embedded' | 'modal';
  /**
   * Additional container CSS classes
   */
  className?: string;
  /**
   * Show close (X) button at top right
   */
  showCloseButton?: boolean;
}

export const AvanyxIdentityAuthCard: React.FC<AvanyxIdentityAuthCardProps> = ({
  appName = 'AVANYX Store',
  initialMode = 'LOGIN',
  onSuccess,
  onCancel,
  variant = 'card',
  className = '',
  showCloseButton = false
}) => {
  const {
    signInWithGoogle,
    signInWithGoogleRedirect,
    signInWithGithub,
    signInWithGithubRedirect,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    authLoading,
    authError,
    clearAuthError,
    isAuthenticated,
    user
  } = useStore();

  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Forgot password sub-view
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        setActionSuccess(`Signed in to AVANYX Identity successfully!`);
      } else {
        await signUpWithEmail(cleanEmail, cleanPass, cleanName);
        setActionSuccess(`AVANYX Identity account created and verified!`);
      }
      setEmail('');
      setPassword('');
      setDisplayName('');
      if (onSuccess) onSuccess();
    } catch {
      // Error is caught & stored in StoreContext authError
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
      setActionSuccess('Connected with Google via AVANYX Identity.');
      if (onSuccess) onSuccess();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setIsSubmitting(true);
    setActionSuccess(null);
    clearAuthError();
    try {
      await signInWithGoogleRedirect();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsSubmitting(true);
    setActionSuccess(null);
    clearAuthError();
    try {
      await signInWithGithub();
      setActionSuccess('Connected with GitHub via AVANYX Identity.');
      if (onSuccess) onSuccess();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubRedirect = async () => {
    setIsSubmitting(true);
    setActionSuccess(null);
    clearAuthError();
    try {
      await signInWithGithubRedirect();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      await sendPasswordReset(cleanEmail);
      setForgotSuccess(
        `If an AVANYX Identity account exists for ${cleanEmail}, a recovery link has been dispatched.`
      );
      setForgotEmail('');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to dispatch password reset. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-[#15161A] text-[#1D1B20] dark:text-[#E6E1E5] ${
        variant === 'modal'
          ? 'p-6 sm:p-8 max-w-lg w-full rounded-3xl shadow-2xl border border-amber-500/20'
          : variant === 'embedded'
          ? 'p-0 w-full'
          : 'p-6 sm:p-8 rounded-3xl shadow-xl border border-black/5 dark:border-white/10 w-full max-w-xl mx-auto'
      } ${className}`}
    >
      {/* Decorative Golden Ambient Backing */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-amber-500/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-gradient-to-tr from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Section with AK Crown Emblem */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <AvanyxIdentityAvatar
              src="/avanyx-identity-avatar.svg"
              size="lg"
              glow
              className="shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-[#1D1B20] dark:text-white flex items-center gap-1.5">
                  <span>AVANYX</span>
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Identity
                  </span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  SSO v3
                </span>
              </div>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5 font-medium">
                Unified Authentication &bull; <span className="text-[#6750A4] dark:text-[#D0BCFF] font-semibold">{appName}</span>
              </p>
            </div>
          </div>

          {showCloseButton && onCancel && (
            <button
              onClick={onCancel}
              className="p-2 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#49454F] dark:text-[#CAC4D0] transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Cross-Platform Ecosystem Badge Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-medium text-[#49454F] dark:text-[#CAC4D0]">
          <span className="px-2.5 py-1 rounded-xl bg-[#F3EDF7] dark:bg-[#202126] border border-black/5 dark:border-white/5 font-mono">
            AVANYX Store
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-[#F3EDF7] dark:bg-[#202126] border border-black/5 dark:border-white/5 font-mono">
            Aether Platform
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-[#F3EDF7] dark:bg-[#202126] border border-black/5 dark:border-white/5 font-mono">
            Developer Cloud
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
            Single UID
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 font-medium">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Notification & Domain Whitelist Helper */}
      {authError && (
        <div className="mt-4 space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 font-medium">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="leading-relaxed">{authError}</div>
              {authError.includes('already registered') && authMode === 'REGISTER' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    clearAuthError();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 font-bold transition-all text-xs"
                >
                  <LogIn className="w-3.5 h-3.5" /> Switch to Sign In &rarr;
                </button>
              )}
            </div>
          </div>

          {authError.includes('Domain authorization required') && (
            <div className="p-3.5 rounded-2xl bg-[#6750A4]/10 border border-[#6750A4]/25 text-[#1D1B20] dark:text-[#E6E1E5] text-xs space-y-2">
              <div className="font-bold text-[#6750A4] dark:text-[#D0BCFF] flex items-center justify-between">
                <span>Domain Whitelisting Help:</span>
                {copiedDomain && (
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                Add this domain in Firebase Console &rarr; Auth &rarr; Settings &rarr; Authorized Domains:
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyDomain(currentHostname)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#202126] border border-black/10 dark:border-white/10 font-mono text-[11px] font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-[#6750A4]" />
                  <span>{currentHostname}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forgot Password Sub-Modal */}
      {showForgotPassword ? (
        <div className="mt-6 space-y-4 relative z-10">
          <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#1E1F24] border border-black/5 dark:border-white/5 space-y-2">
            <h3 className="text-sm font-bold text-[#1D1B20] dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>Reset AVANYX Identity Password</span>
            </h3>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Enter the email address tied to your AVANYX Identity. We will send an official password reset link.
            </p>
          </div>

          {forgotSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{forgotSuccess}</span>
            </div>
          )}

          {forgotError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{forgotError}</span>
            </div>
          )}

          <form onSubmit={handleSendForgotPassword} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F] dark:text-[#CAC4D0]" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@avanyx.io"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#202126] text-xs text-[#1D1B20] dark:text-white border border-transparent focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className="text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] hover:underline"
              >
                &larr; Back to Sign In
              </button>

              <button
                type="submit"
                disabled={forgotLoading}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                <span>Send Reset Link</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Main Login / Registration View */
        <div className="mt-5 space-y-4 relative z-10">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F3EDF7] dark:bg-[#202126] border border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                clearAuthError();
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                authMode === 'LOGIN'
                  ? 'bg-white dark:bg-[#2A2B32] text-[#1D1B20] dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                clearAuthError();
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                authMode === 'REGISTER'
                  ? 'bg-white dark:bg-[#2A2B32] text-[#1D1B20] dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Identity</span>
            </button>
          </div>

          {/* Social OAuth Providers Grid (Google & GitHub) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || authLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3.5 rounded-2xl bg-white dark:bg-[#202126] hover:bg-[#F3EDF7] dark:hover:bg-[#2A2B32] border border-black/10 dark:border-white/10 text-xs font-bold text-[#1D1B20] dark:text-white transition-all disabled:opacity-50 shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-3.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16.1C3.5 19.9 7.4 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* GitHub Sign-In */}
            <button
              type="button"
              onClick={handleGithubSignIn}
              disabled={isSubmitting || authLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3.5 rounded-2xl bg-white dark:bg-[#202126] hover:bg-[#F3EDF7] dark:hover:bg-[#2A2B32] border border-black/10 dark:border-white/10 text-xs font-bold text-[#1D1B20] dark:text-white transition-all disabled:opacity-50 shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0 fill-current text-gray-900 dark:text-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub Developer</span>
            </button>
          </div>

          {/* Alternative redirect hints */}
          <div className="flex items-center justify-center gap-3 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            <button
              type="button"
              onClick={handleGoogleRedirect}
              className="hover:underline text-[#6750A4] dark:text-[#D0BCFF]"
            >
              Google Redirect &rarr;
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={handleGithubRedirect}
              className="hover:underline text-[#6750A4] dark:text-[#D0BCFF]"
            >
              GitHub Redirect &rarr;
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-[#49454F] dark:text-[#CAC4D0] py-1">
            <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
            <span className="text-[11px] uppercase tracking-wider font-bold">or with AVANYX credentials</span>
            <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {authMode === 'REGISTER' && (
              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Full Name / Developer Handle
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#202126] text-xs text-[#1D1B20] dark:text-white border border-transparent focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                AVANYX Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F] dark:text-[#CAC4D0]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@avanyx.io"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#202126] text-xs text-[#1D1B20] dark:text-white border border-transparent focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0]">
                  Password
                </label>
                {authMode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotPassword(true);
                    }}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F] dark:text-[#CAC4D0]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#202126] text-xs text-[#1D1B20] dark:text-white border border-transparent focus:border-amber-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || authLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : authMode === 'LOGIN' ? (
                  <LogIn className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>
                  {authMode === 'LOGIN' ? 'Sign In to AVANYX Identity' : 'Create AVANYX Identity Account'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>

          {/* Footer Security Note */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> End-to-End Encrypted Identity
            </span>
            <span className="font-mono text-[10px]">avanyx.store &bull; aether.os</span>
          </div>
        </div>
      )}
    </div>
  );
};
