import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AvanyxIdentityEmblem } from '../../components/identity/AvanyxIdentityEmblem';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Shield,
  Loader2,
  AtSign,
  FileText
} from 'lucide-react';

interface IdentitySignUpPageProps {
  onNavigate: (path: string) => void;
  redirectUri?: string;
}

export const IdentitySignUpPage: React.FC<IdentitySignUpPageProps> = ({
  onNavigate,
  redirectUri
}) => {
  const {
    signUpWithEmail,
    signInWithGoogle,
    signInWithGithub,
    updateProfileDetails,
    authLoading,
    authError,
    isAuthenticated,
    user
  } = useStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeLegalModal, setActiveLegalModal] = useState<'TERMS' | 'PRIVACY' | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-zinc-700' };
    let s = 0;
    if (pass.length >= 6) s += 1;
    if (pass.length >= 8) s += 1;
    if (/[A-Z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;

    if (s <= 2) return { score: 25, text: 'Weak', color: 'bg-rose-500' };
    if (s === 3) return { score: 50, text: 'Fair', color: 'bg-amber-500' };
    if (s === 4) return { score: 75, text: 'Good', color: 'bg-yellow-400' };
    return { score: 100, text: 'Strong', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(password);

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

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanName = name.trim();
    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setLocalError('Username must be at least 3 alphanumeric characters.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please re-type your password.');
      return;
    }
    if (!agreedTerms) {
      setLocalError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLocalLoading(true);
    try {
      await signUpWithEmail(cleanEmail, password, cleanName);
      // Synchronize additional profile fields (username, phone)
      try {
        await updateProfileDetails(cleanName, '', undefined);
      } catch {
        // Non-blocking
      }
      handleSuccessRedirect();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to create your AVANYX account.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      await signInWithGoogle();
      handleSuccessRedirect();
    } catch (err: any) {
      setLocalError(err.message || 'Google account creation was cancelled.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGithubSignUp = async () => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      await signInWithGithub();
      handleSuccessRedirect();
    } catch (err: any) {
      setLocalError(err.message || 'GitHub account creation was cancelled.');
    } finally {
      setLocalLoading(false);
    }
  };

  // If already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#121118] border border-amber-500/30 text-center shadow-2xl">
          <div className="flex justify-center mb-4">
            <AvanyxIdentityEmblem size={56} glow />
          </div>
          <h2 className="text-xl font-black text-white">Active AVANYX Identity</h2>
          <p className="mt-2 text-xs text-zinc-400">
            You are signed in as <strong className="text-white">{user.name}</strong> ({user.email}).
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => onNavigate('/identity/account')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-lg shadow-amber-500/20"
            >
              Manage Account & Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07060A] text-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header / Return Bar */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between pb-4">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Return to AVANYX Store</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
          <Shield className="w-4 h-4" />
          <span>AVANYX Identity v0.03</span>
        </div>
      </div>

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg mx-auto rounded-3xl bg-[#121118]/95 border border-amber-500/30 shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10">
        {/* Header with Centered Gold Crown AK Emblem */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="p-2.5 rounded-full bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/30 shadow-xl">
              <AvanyxIdentityEmblem size={54} glow />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Create Your Account
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-medium">
            Join the AVANYX ecosystem &bull; One login for all platforms
          </p>
        </div>

        {/* Error Alert */}
        {(localError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* SIGN UP FORM */}
        <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
          {/* Row 1: Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alok King"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-white text-xs placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Username
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="alokking"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-white text-xs placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email Address */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
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
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-white text-xs placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Row 3: Mobile Number (Optional) */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Mobile Number <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-white text-xs placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Row 4: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-white text-xs placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-white text-xs placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Password Strength Bar */}
          {password.length > 0 && (
            <div className="space-y-1 animate-fadeIn">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">Strength:</span>
                <span className="font-bold text-amber-400">{strength.text}</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>
          )}

          {/* Terms Agreement Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded bg-black/40 border-white/20 text-amber-500 focus:ring-amber-400 shrink-0"
              />
              <span className="text-xs text-zinc-300 leading-relaxed">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('TERMS')}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('PRIVACY')}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Privacy Policy
                </button>
              </span>
            </label>
          </div>

          {/* Submit Sign Up Button */}
          <button
            type="submit"
            disabled={localLoading || authLoading}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {localLoading || authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider: or continue with */}
        <div className="relative my-5 text-center">
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
            onClick={handleGoogleSignUp}
            disabled={localLoading || authLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all disabled:opacity-50"
          >
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
            onClick={handleGithubSignUp}
            disabled={localLoading || authLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all disabled:opacity-50"
          >
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

        {/* Bottom Switch Link to Sign In */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-zinc-400">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('/login')}
              className="text-amber-400 hover:text-amber-300 font-bold ml-1 transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>

      {/* Legal Modal */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#14131A] border border-amber-500/30 p-6 shadow-2xl text-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                {activeLegalModal === 'TERMS' ? 'Terms of Service' : 'Privacy Policy'}
              </h3>
              <button
                onClick={() => setActiveLegalModal(null)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="py-4 text-xs text-zinc-300 space-y-2 max-h-60 overflow-y-auto">
              {activeLegalModal === 'TERMS' ? (
                <p>
                  By creating an account, you agree to adhere to AVANYX security policies and maintain the integrity of your authentication tokens across connected ecosystem apps.
                </p>
              ) : (
                <p>
                  AVANYX protects your account data using encrypted storage and zero-trust boundaries. Admins cannot view your personal sessions or credentials.
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-white/10 text-right">
              <button
                onClick={() => setActiveLegalModal(null)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
