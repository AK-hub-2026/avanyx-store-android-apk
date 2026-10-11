import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AvanyxIdentityEmblem } from './AvanyxIdentityEmblem';
import { AvanyxIdentityAvatar } from './AvanyxIdentityAvatar';
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
  ChevronDown,
  ExternalLink,
  UserCheck,
  KeyRound,
  LogOut,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  Smartphone,
  AlertTriangle
} from 'lucide-react';

interface AvanyxIdentityHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const AvanyxIdentityHeader: React.FC<AvanyxIdentityHeaderProps> = ({
  currentPath,
  onNavigate
}) => {
  const { user, isAuthenticated, signOutUser, setCurrentTab } = useStore();
  const [ecosystemOpen, setEcosystemOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.realRole === 'ADMIN';

  const handleReturnToStore = () => {
    setCurrentTab('HOME');
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', '/');
    }
  };

  const getProductIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag':
        return <ShoppingBag className="w-4 h-4 text-purple-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-sky-400" />;
      case 'Code2':
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#09090C]/95 backdrop-blur-xl border-b border-amber-500/20 text-[#FAFAFA] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-18 flex items-center justify-between gap-4 py-3">
          {/* 1. Left: Brand & Monogram Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/identity')}
              className="flex items-center gap-3 group text-left focus:outline-none"
              title="AVANYX Identity Home"
            >
              <AvanyxIdentityEmblem size={44} glow />
              <div className="hidden sm:flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase">
                    AVANYX IDENTITY
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                    Disabled / Backend Pending
                  </span>
                </div>
                <span className="text-[10px] text-[#A1A1AA] font-medium tracking-tight">
                  One Identity. All AVANYX Platforms.
                </span>
              </div>
            </button>

            {/* Core Trust Badges (Hidden on mobile) */}
            <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-white/10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-semibold">
                <ShieldCheck className="w-3 h-3 text-amber-400" /> Secure
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-semibold">
                <Globe className="w-3 h-3 text-amber-400" /> Unified
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-semibold">
                <Lock className="w-3 h-3 text-amber-400" /> Private
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-semibold">
                <Layers className="w-3 h-3 text-amber-400" /> Universal
              </span>
            </div>
          </div>

          {/* 2. Middle: Ecosystem Switcher Dropdown */}
          <div className="hidden md:flex items-center relative">
            <button
              onClick={() => setEcosystemOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#E4E4E7] transition-all"
            >
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                AVANYX Ecosystem
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${ecosystemOpen ? 'rotate-180' : ''}`} />
            </button>

            {ecosystemOpen && (
              <div
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 rounded-2xl bg-[#121118] border border-amber-500/30 p-3 shadow-2xl z-50 animate-fadeIn"
                onMouseLeave={() => setEcosystemOpen(false)}
              >
                <div className="text-[10px] uppercase font-black tracking-wider text-amber-400 px-2 pb-2 border-b border-white/10">
                  Unified Ecosystem Platforms
                </div>
                <div className="space-y-1 mt-2">
                  {AVANYX_ECOSYSTEM_PRODUCTS.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-2 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                          {getProductIcon(prod.iconName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {prod.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate max-w-[150px]">
                            {prod.tagline}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 font-semibold border border-white/10">
                        {prod.badgeText}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 mt-2 border-t border-white/10">
                  <button
                    onClick={handleReturnToStore}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Launch AVANYX Store</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Right: Navigation & Auth Controls */}
          <div className="flex items-center gap-2.5">
            {/* Direct Link to Store */}
            <button
              onClick={handleReturnToStore}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-colors"
              title="Return to AVANYX Store"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
              <span>AVANYX Store</span>
            </button>

            {/* Auth Buttons or Account Dropdown */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('/identity/login')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentPath === '/identity/login'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('/identity/signup')}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs shadow-md shadow-amber-500/20 transition-all transform hover:scale-[1.02]"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 pl-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-amber-500/30 transition-all"
                >
                  <div className="flex flex-col text-right hidden sm:flex">
                    <span className="text-xs font-bold text-white leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold leading-none">
                      {user.username || `@${user.name.toLowerCase().replace(/\s+/g, '')}`}
                    </span>
                  </div>
                  <AvanyxIdentityAvatar
                    src={user.avatarUrl}
                    name={user.name}
                    size="sm"
                    showBadge={user.verificationBadge === 'VERIFIED'}
                    badgeType={
                      user.role === 'ADMIN'
                        ? 'ADMIN'
                        : user.role === 'DEVELOPER'
                        ? 'DEV'
                        : 'VERIFIED'
                    }
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 mr-1" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#14131A] border border-amber-500/30 p-2 shadow-2xl z-50 animate-fadeIn"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="p-3 border-b border-white/10 mb-1">
                      <div className="text-xs font-black text-white">{user.name}</div>
                      <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-400 font-bold">
                        <UserCheck className="w-3 h-3" />
                        {user.role} &bull; Universal Profile
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/identity/account');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-white/10 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-amber-400" />
                        <span>Account Management</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/identity/apps');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-white/10 transition-colors"
                      >
                        <Layers className="w-4 h-4 text-sky-400" />
                        <span>Connected Apps</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/identity/account/devices');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-white/10 transition-colors"
                      >
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>Devices & Sessions</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('/identity/admin/oauth');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-500/15 transition-colors"
                        >
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span>OAuth Client Manager</span>
                        </button>
                      )}

                      <div className="pt-1 mt-1 border-t border-white/10">
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await signOutUser();
                            onNavigate('/identity/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white md:hidden"
              aria-label="Toggle Mobile Navigation"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileNavOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onNavigate('/identity');
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-left text-zinc-200"
              >
                Identity Home
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onNavigate('/identity/account');
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-left text-zinc-200"
              >
                Account Center
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onNavigate('/identity/apps');
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-left text-zinc-200"
              >
                Connected Apps
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    onNavigate('/identity/admin/oauth');
                  }}
                  className="p-2.5 rounded-xl bg-amber-500/15 text-amber-300 text-xs font-bold text-left"
                >
                  OAuth Manager
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={handleReturnToStore}
                className="flex items-center gap-2 text-xs font-bold text-purple-300"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Go to AVANYX Store</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
