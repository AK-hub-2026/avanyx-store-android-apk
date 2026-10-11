import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AvanyxIdentityEmblem } from '../../components/identity/AvanyxIdentityEmblem';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Shield,
  Loader2,
  Sparkles
} from 'lucide-react';

interface IdentityLoginPageProps {
  onNavigate: (path: string) => void;
  redirectUri?: string;
}

export const IdentityLoginPage: React.FC<IdentityLoginPageProps> = ({
  onNavigate,
  redirectUri
}) => {
  const {
    signInWithEmail,
    signInWithGoogle,
    signInWithGithub,
    sendPasswordReset,
    authLoading,
    authError,
    isAuthenticated,
    setCurrentTab
  } = useStore();

  const [activeTab, setActiveTab] = useState<'EMAIL' | 'MOBILE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Mobile state
  const [phoneCountry, setPhoneCountry] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Redirect handling
  const handleSuccessRedirect = () => {
    if (redirectUri) {
      if (redirectUri.startsWith('http://') || redirectUri.startsWith('https://')) {
        window.location.href = redirectUri;
        return;
      }
      onNavigate(redirectUri);
      return;
    }
    onNavigate('/identity/account');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLocalLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      handleSuccessRedirect();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      await signInWithGoogle();
      handleSuccessRedirect();
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in was interrupted.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      await signInWithGithub();
      handleSuccessRedirect();
    } catch (err: any) {
      setLocalError(err.message || 'GitHub sign-in was interrupted.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setLocalError('Please enter a valid mobile phone number.');
      return;
    }
    setLocalError(null);
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setLocalError('Please enter the 6-digit OTP sent to your device.');
      return;
    }
    // Mobile SMS OTP Backend Pending
    setLocalError('[Backend Pending: Twilio / Firebase Phone Auth SMS Gateway connection is pending backend deployment. Please use Email or Google/GitHub Sign In for instant access.]');
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

  // If already authenticated, offer instant redirect to Account
  if (isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#121118] border border-amber-500/30 text-center shadow-2xl">
          <div className="flex justify-center mb-4">
            <AvanyxIdentityEmblem size={56} glow />
          </div>
          <h2 className="text-xl font-black text-white">Already Signed In</h2>
          <p className="mt-2 text-xs text-zinc-400">
            You are actively authenticated with your universal AVANYX Identity.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => onNavigate('/identity/account')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-lg shadow-amber-500/20"
            >
              Go to Account Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentTab('HOME');
                if (window.history && window.history.pushState) window.history.pushState({}, '', '/');
              }}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs"
            >
              Launch AVANYX Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl bg-[#121118]/95 border border-amber-500/30 shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10">
        {/* Header with Centered Gold Crown AK Emblem */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="p-2.5 rounded-full bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/30 shadow-xl">
              <AvanyxIdentityEmblem size={54} glow />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-medium">
            Sign in to your AVANYX account
          </p>
        </div>

        {/* Tab Switcher: Email Login vs Mobile Login */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-black/40 border border-white/10 mb-6">
          <button
            onClick={() => {
              setActiveTab('EMAIL');
              setLocalError(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'EMAIL'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Login</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('MOBILE');
              setLocalError(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'MOBILE'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Login</span>
          </button>
        </div>

        {/* Error Alert */}
        {(localError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* 1. EMAIL LOGIN FORM */}
        {activeTab === 'EMAIL' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="youremail@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-xs placeholder:text-zinc-600 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-xs placeholder:text-zinc-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-black/40 border-white/20 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-xs text-zinc-400">Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={localLoading || authLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {localLoading || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* 2. MOBILE LOGIN FORM */
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Mobile Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      className="px-2.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-400"
                    >
                      <option value="+91">🇮🇳 +91 (IN)</option>
                      <option value="+1">🇺🇸 +1 (US)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+971">🇦🇪 +971 (AE)</option>
                      <option value="+65">🇸🇬 +65 (SG)</option>
                    </select>
                    <div className="relative flex-1">
                      <Smartphone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-xs placeholder:text-zinc-600 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <span>Send Login OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-300">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 text-center tracking-[0.5em] text-lg font-mono rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-amber-400"
                  />
                  <span className="block mt-1 text-[10px] text-zinc-500">
                    Sent to {phoneCountry} {phoneNumber}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  Verify & Sign In
                </button>
              </form>
            )}
          </div>
        )}

        {/* Divider: or continue with */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#121118] text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
            or continue with
          </span>
        </div>

        {/* Social Authentication Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={localLoading || authLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all disabled:opacity-50"
          >
            {/* Google Colorful Vector */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={handleGithubSignIn}
            disabled={localLoading || authLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all disabled:opacity-50"
          >
            {/* GitHub Vector */}
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Bottom Switch Link to Sign Up */}
        <div className="mt-8 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-zinc-400">
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('/identity/signup')}
              className="text-amber-400 hover:text-amber-300 font-bold ml-1 transition-colors"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-[#14131A] border border-amber-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Reset Password
              </h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                }}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {forgotSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-xs text-zinc-300">
                  Password reset email dispatched to <br />
                  <strong className="text-white">{forgotEmail}</strong>
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="py-4 space-y-4">
                <p className="text-xs text-zinc-400">
                  Enter your registered AVANYX account email to receive a secure recovery link.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="youremail@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending link...' : 'Send Recovery Email'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
