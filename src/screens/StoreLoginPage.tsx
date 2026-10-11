import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AvanyxLogo } from '../components/AvanyxLogo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  KeyRound,
  Sparkles
} from 'lucide-react';

interface StoreLoginPageProps {
  onSuccess?: () => void;
  onNavigateToSignUp?: () => void;
  onBackToStore?: () => void;
}

export const StoreLoginPage: React.FC<StoreLoginPageProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onBackToStore
}) => {
  const {
    signInWithEmail,
    signInWithGoogle,
    signInWithGithub,
    sendPasswordReset,
    setCurrentTab,
    authLoading,
    authError,
    pendingLinkInfo,
    clearPendingLinkInfo,
    isAuthenticated
  } = useStore();

  const [email, setEmail] = useState(() => pendingLinkInfo?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  React.useEffect(() => {
    if (pendingLinkInfo?.email && !email) {
      setEmail(pendingLinkInfo.email);
    }
  }, [pendingLinkInfo]);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleReturnToStore = () => {
    if (onBackToStore) {
      onBackToStore();
    } else {
      setCurrentTab('HOME');
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        window.history.pushState({}, '', '/');
      }
    }
  };

  const handleSuccessfulAuth = () => {
    const returnTo = typeof window !== 'undefined' ? sessionStorage.getItem('avanyx_login_return_to') : null;
    if (returnTo) {
      sessionStorage.removeItem('avanyx_login_return_to');
      if (returnTo === '/developer/apply' || returnTo === 'DEVELOPER_APPLY') {
        setCurrentTab('DEVELOPER_APPLY');
        if (typeof window !== 'undefined' && window.history && window.history.pushState) {
          window.history.pushState({}, '', '/developer/apply');
        }
        if (onSuccess) onSuccess();
        return;
      }
      if (returnTo === '/student/apply' || returnTo === 'STUDENT_APPLY') {
        setCurrentTab('STUDENT_APPLY');
        if (typeof window !== 'undefined' && window.history && window.history.pushState) {
          window.history.pushState({}, '', '/student/apply');
        }
        if (onSuccess) onSuccess();
        return;
      }
    }

    setCurrentTab('HOME');
    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      window.history.pushState({}, '', '/store');
    }
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLocalLoading(true);
    try {
      await signInWithEmail(cleanEmail, password);
      handleSuccessfulAuth();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in. Please verify your email and password.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      await signInWithGoogle();
      handleSuccessfulAuth();
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in was cancelled or interrupted.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      await signInWithGithub();
      handleSuccessfulAuth();
    } catch (err: any) {
      setLocalError(err.message || 'GitHub sign-in was cancelled or interrupted.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    try {
      await sendPasswordReset(forgotEmail.trim());
      setForgotSuccess(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send password reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121316] text-[#1D1B20] dark:text-[#E6E1E5] flex flex-col justify-between selection:bg-[#6750A4]/20 selection:text-[#6750A4] transition-colors">
      {/* Top Header / Return Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
        <button
          onClick={handleReturnToStore}
          className="flex items-center gap-2 text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to AVANYX Store</span>
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-medium text-[#49454F] dark:text-[#CAC4D0]">
            Secure TLS 1.3 Encryption
          </span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#18191D] rounded-3xl border border-black/5 dark:border-white/5 p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/20 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <button onClick={handleReturnToStore} className="focus:outline-none">
                <AvanyxLogo size={48} showText={false} />
              </button>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] tracking-tight">
                Sign in to AVANYX Store
              </h1>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-1">
                Access verified apps, games, developer tools, and cloud downloads.
              </p>
            </div>
          </div>

          {/* Social Sign In Options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={localLoading || authLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 hover:bg-[#E8DEF8] dark:hover:bg-[#32343B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.7 0 3 .7 3.7 1.3l2.8-2.8C16.8 1.9 14.6 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.4 2.6C6.2 7.1 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.6C.7 9 0 10.9 0 12s.7 3 1.9 5.4l3.4-2.6z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-4.9L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={handleGithubSignIn}
              disabled={localLoading || authLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 hover:bg-[#E8DEF8] dark:hover:bg-[#32343B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-black/5 dark:bg-white/5" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#49454F]/70 dark:text-[#CAC4D0]/70">
              Or with Email
            </span>
            <div className="flex-1 h-px bg-black/5 dark:bg-white/5" />
          </div>

          {/* Pending Credential Link Notice */}
          {pendingLinkInfo && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="flex-1 space-y-1">
                <p className="font-bold">Credential Link Required</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  An existing account exists for <span className="font-semibold underline">{pendingLinkInfo.email}</span>. Sign in with your password below to securely link your {pendingLinkInfo.provider} account under one profile.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(localError || authError) && !pendingLinkInfo && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{localError || authError}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F] dark:text-[#CAC4D0]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-transparent focus:border-[#6750A4] dark:focus:border-[#D0BCFF] text-xs text-[#1D1B20] dark:text-[#E6E1E5] placeholder-[#49454F] dark:placeholder-[#CAC4D0] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-[#6750A4] dark:text-[#D0BCFF] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F] dark:text-[#CAC4D0]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-transparent focus:border-[#6750A4] dark:focus:border-[#D0BCFF] text-xs text-[#1D1B20] dark:text-[#E6E1E5] placeholder-[#49454F] dark:placeholder-[#CAC4D0] focus:outline-none transition-all"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6750A4] focus:ring-[#6750A4] border-gray-300"
                />
                <span className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  Remember this device
                </span>
              </label>
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={localLoading || authLoading}
              className="w-full py-3 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white text-xs font-black shadow-lg shadow-[#6750A4]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {localLoading || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link to Sign Up */}
          <div className="pt-2 text-center text-xs text-[#49454F] dark:text-[#CAC4D0]">
            Don't have an AVANYX account?{' '}
            <button
              type="button"
              onClick={() => {
                if (onNavigateToSignUp) {
                  onNavigateToSignUp();
                } else {
                  setCurrentTab('SIGNUP');
                  if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                    window.history.pushState({}, '', '/signup');
                  }
                }
              }}
              className="font-extrabold text-[#6750A4] dark:text-[#D0BCFF] hover:underline"
            >
              Sign Up
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#18191D] rounded-3xl border border-black/5 dark:border-white/5 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
              Reset Password
            </h3>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Enter the email address associated with your AVANYX account and we'll send you a password reset link.
            </p>

            {forgotSuccess ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Reset email sent! Please check your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-transparent focus:border-[#6750A4] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSuccess(false);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-2xl bg-[#6750A4] text-white text-xs font-black flex items-center justify-center gap-1"
                  >
                    {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Link'}
                  </button>
                </div>
              </form>
            )}

            {forgotSuccess && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                }}
                className="w-full py-2.5 rounded-2xl bg-[#6750A4] text-white text-xs font-black"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-[#49454F] dark:text-[#CAC4D0] border-t border-black/5 dark:border-white/5">
        <span>© 2026 AVANYX Ecosystem Inc. All rights reserved.</span>
      </footer>
    </div>
  );
};
