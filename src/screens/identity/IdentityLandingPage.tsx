import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AvanyxIdentityEmblem } from '../../components/identity/AvanyxIdentityEmblem';
import { AVANYX_ECOSYSTEM_PRODUCTS } from '../../data/avanyxEcosystemData';
import {
  ShieldCheck,
  Globe,
  Lock,
  Layers,
  Sparkles,
  ShoppingBag,
  Gamepad2,
  Code2,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Server,
  Zap,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface IdentityLandingPageProps {
  onNavigate: (path: string) => void;
}

export const IdentityLandingPage: React.FC<IdentityLandingPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, user, setCurrentTab } = useStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeLegalModal, setActiveLegalModal] = useState<'TERMS' | 'PRIVACY' | 'DOCS' | null>(null);

  const getProductIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag':
        return <ShoppingBag className="w-6 h-6 text-purple-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-sky-400" />;
      case 'Code2':
        return <Code2 className="w-6 h-6 text-emerald-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-6 h-6 text-amber-400" />;
      default:
        return <Layers className="w-6 h-6 text-violet-400" />;
    }
  };

  const faqs = [
    {
      q: 'What is AVANYX Identity?',
      a: 'AVANYX Identity is the universal root authentication and single sign-on (SSO) engine for every product created by AVANYX. One secure login grants you instant access to AVANYX Store, Aether Platform, Infinity Studio, Bomb Rush 3D, and future ecosystem apps.'
    },
    {
      q: 'Is my data secure across platforms?',
      a: 'Yes. All authentication is strictly backed by Firebase Authentication and Firestore security rules (RBAC). Device sessions and private tokens are isolated so even system administrators cannot view your device fingerprints or private session state.'
    },
    {
      q: 'How does Single Sign-On (SSO) work for third-party developers?',
      a: 'Developers can register OAuth 2.0 / OIDC clients through the OAuth Client Manager. When users log in, standard OpenID Connect tokens (RS256) authenticate identity without exposing passwords or sensitive database credentials.'
    },
    {
      q: 'Can I manage or revoke sessions on remote devices?',
      a: 'Yes. From your Identity Account management dashboard (/identity/account/devices), you can view every device where you are currently signed in and revoke individual devices or all remote devices with a single click.'
    },
    {
      q: 'Will my login change when migrating to avanyx.io?',
      a: 'No. The domain architecture is engineered with standard OIDC issuer endpoints (https://identity.avanyx.io) so migration to custom domains occurs seamlessly with zero disruption to user sessions.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#07060A] text-[#FAFAFA] selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-amber-500/15">
        {/* Subtle Ambient Radial Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-amber-500/15 via-yellow-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Gold AK Medallion Badge */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/30 shadow-2xl backdrop-blur-md mb-4">
              <AvanyxIdentityEmblem size={72} glow />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Disabled / Backend Pending</span>
            </div>
          </div>

          {/* Glowing Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            One Identity for the{' '}
            <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              AVANYX Ecosystem
            </span>
          </h1>

          {/* Subtitle & Value Statement */}
          <p className="mt-4 text-base sm:text-xl text-[#D4D4D8] max-w-2xl mx-auto font-medium">
            <span className="text-amber-300 font-bold">Secure • Unified • Private • Universal.</span>
            <br />
            Access all AVANYX products, developer engines, and 3D games with a single master account.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => onNavigate('/identity/signup')}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 flex items-center gap-2 transform hover:scale-[1.02] transition-all"
                >
                  <span>Create AVANYX Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('/identity/login')}
                  className="px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-amber-500/30 text-white font-bold text-sm sm:text-base transition-all"
                >
                  Sign In to Account
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('/identity/account')}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 flex items-center gap-2 transform hover:scale-[1.02] transition-all"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Go to Account Management</span>
                </button>
                <button
                  onClick={() => onNavigate('/identity/apps')}
                  className="px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-amber-500/30 text-white font-bold text-sm sm:text-base transition-all"
                >
                  Manage Connected Apps
                </button>
              </>
            )}
          </div>

          {/* Active Ecosystem Platform Badges */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-bold mr-2">
              Integrated Platforms:
            </span>
            {AVANYX_ECOSYSTEM_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:border-amber-500/40 transition-colors"
              >
                {getProductIcon(prod.iconName)}
                <span>{prod.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {prod.badgeText}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Four Golden Feature Pillars */}
      <section className="py-16 sm:py-24 bg-[#0A090F]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Engineered for Trust & Effortless Single Sign-On
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-400">
              A modern identity provider combining cryptographic session tokens with granular privacy controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Secure */}
            <div className="p-6 rounded-3xl bg-[#121118] border border-amber-500/25 hover:border-amber-500/50 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Secure</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Advanced multi-layered security with Firebase Auth, biometric support, and zero-trust session revocation.
              </p>
            </div>

            {/* Card 2: Unified */}
            <div className="p-6 rounded-3xl bg-[#121118] border border-amber-500/25 hover:border-amber-500/50 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Unified</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                One universal profile for AVANYX Store, Aether AI Platform, Infinity Studio, and multiplayer 3D games.
              </p>
            </div>

            {/* Card 3: Private */}
            <div className="p-6 rounded-3xl bg-[#121118] border border-amber-500/25 hover:border-amber-500/50 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Private</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Strict database isolation. Admins cannot view user device lists or tamper with private credentials.
              </p>
            </div>

            {/* Card 4: Universal */}
            <div className="p-6 rounded-3xl bg-[#121118] border border-amber-500/25 hover:border-amber-500/50 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Universal</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Runs seamlessly across Web browsers, Android APK runtimes, desktop clients, and autonomous cloud services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Deep Dive: What is AVANYX Identity */}
      <section className="py-16 sm:py-24 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Universal Authentication Provider
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                Not just a store login. <br />
                The root account for everything AVANYX.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
                Similar to how Google Account anchors Gmail, YouTube, and Drive, or Microsoft Account unlocks Xbox and Azure, <strong className="text-amber-400">AVANYX Identity</strong> is the standalone identity engine powering every service in the AVANYX family.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-zinc-300">
                    <strong className="text-white">Seamless Cross-Platform Sync:</strong> Your developer badge, games progress, and downloaded packages synchronize automatically.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-zinc-300">
                    <strong className="text-white">Centralized Device Control:</strong> View signed-in phones, laptops, and tablets; terminate remote sessions in real time.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-zinc-300">
                    <strong className="text-white">OpenID Connect & OAuth 2.0:</strong> Native support for authorization flows and custom developer API integrations.
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => onNavigate('/identity/signup')}
                  className="px-6 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors"
                >
                  <span>Register Free Universal ID</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Architecture Hierarchy Visualizer */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111018] border border-amber-500/30 shadow-2xl relative">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 mb-2">
                  <AvanyxIdentityEmblem size={40} glow />
                </div>
                <div className="text-sm font-black text-amber-300 uppercase">
                  AVANYX Identity Core (v0.03)
                </div>
                <div className="text-[11px] text-zinc-400">
                  Firebase Authentication &bull; Cloud Firestore RBAC
                </div>
              </div>

              {/* Connecting Tree */}
              <div className="space-y-3">
                {AVANYX_ECOSYSTEM_PRODUCTS.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                        {getProductIcon(prod.iconName)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{prod.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {prod.clientId}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      SSO Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Frequently Asked Questions */}
      <section className="py-16 sm:py-24 bg-[#0A090F]/90 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Everything you need to know about AVANYX Identity architecture and security.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#121118] border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-zinc-200 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    {item.q}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3 animate-fadeIn">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="py-12 border-t border-white/10 bg-[#060508] text-zinc-400 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <AvanyxIdentityEmblem size={36} />
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm">AVANYX Identity</span>
                <span className="text-[10px] text-zinc-500">
                  Universal Authentication & SSO Architecture
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
              <button
                onClick={() => setActiveLegalModal('DOCS')}
                className="hover:text-amber-400 transition-colors"
              >
                Documentation
              </button>
              <button
                onClick={() => setActiveLegalModal('PRIVACY')}
                className="hover:text-amber-400 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setActiveLegalModal('TERMS')}
                className="hover:text-amber-400 transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={() => onNavigate('/identity/admin/oauth')}
                className="hover:text-amber-400 transition-colors"
              >
                OAuth Admin
              </button>
              <button
                onClick={() => {
                  setCurrentTab('HOME');
                  if (window.history && window.history.pushState) window.history.pushState({}, '', '/');
                }}
                className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
              >
                Return to AVANYX Store
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <div>&copy; 2026 AVANYX Corporation. All rights reserved.</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>Identity Service Live &bull; Firebase Auth & Cloud Firestore</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Modal for Legal & Docs */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-[#14131A] border border-amber-500/30 p-6 shadow-2xl text-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  {activeLegalModal === 'TERMS'
                    ? 'Terms of Service'
                    : activeLegalModal === 'PRIVACY'
                    ? 'Privacy Policy'
                    : 'Universal Identity Documentation'}
                </h3>
              </div>
              <button
                onClick={() => setActiveLegalModal(null)}
                className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs leading-relaxed max-h-[60vh] overflow-y-auto">
              {activeLegalModal === 'TERMS' && (
                <>
                  <p>
                    By accessing or using AVANYX Identity, you agree to comply with all security rules and ecosystem standards.
                  </p>
                  <p>
                    <strong>1. Account Responsibility:</strong> You are responsible for safeguarding your login credentials and connected sessions.
                  </p>
                  <p>
                    <strong>2. Acceptable Use:</strong> AVANYX Identity may not be used for automated brute-force attempts, unauthorized credential harvesting, or token spoofing.
                  </p>
                </>
              )}
              {activeLegalModal === 'PRIVACY' && (
                <>
                  <p>
                    AVANYX Identity is engineered with zero-trust principles. We do not sell your personal information or telemetry data.
                  </p>
                  <p>
                    <strong>Data Encryption:</strong> All sessions and user records are stored securely in Cloud Firestore with role-based access rules.
                  </p>
                  <p>
                    <strong>Admin Boundaries:</strong> System administrators are strictly prohibited from viewing user device sessions or private tokens.
                  </p>
                </>
              )}
              {activeLegalModal === 'DOCS' && (
                <>
                  <p>
                    <strong>OpenID Connect Endpoints:</strong>
                  </p>
                  <pre className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[10px] text-amber-300 overflow-x-auto">
{`Issuer: https://identity.avanyx.io
Authorize: /oauth2/v1/authorize [Backend Pending]
Token: /oauth2/v1/token [Backend Pending]
UserInfo: /oauth2/v1/userinfo [Backend Pending]`}
                  </pre>
                  <p>
                    For detailed OAuth client configuration, visit the Identity Admin Dashboard.
                  </p>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 text-right">
              <button
                onClick={() => setActiveLegalModal(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
