import React from 'react';
import { useStore } from '../context/StoreContext';
import { AvanyxLogo } from './AvanyxLogo';
import { AvanyxIdentityAvatar } from './identity';
import {
  Menu,
  Search,
  Sun,
  Moon,
  X,
  Bell,
  Download,
  ShieldCheck,
  Gamepad2,
  Layers,
  Sparkles,
  Code2,
  GraduationCap,
  FileText,
  Mail,
  LogIn,
  UserPlus
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    darkMode,
    setDarkMode,
    setCurrentTab,
    currentTab,
    toggleSidebar,
    downloads,
    notifications,
    user,
    isAuthenticated
  } = useStore();

  const activeDownloads = downloads.filter((d) => d.status === 'DOWNLOADING').length;
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const scrollToSection = (sectionId: string, fallbackTab?: 'APPS' | 'GAMES' | 'DEV_CONSOLE') => {
    if (currentTab !== 'HOME') {
      if (fallbackTab) {
        setCurrentTab(fallbackTab);
        return;
      }
      setCurrentTab('HOME');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (fallbackTab) {
      setCurrentTab(fallbackTab);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#18191D]/95 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 transition-colors shrink-0">
      {/* Left: Sidebar Toggle + Brand Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-[#1D1B20] dark:text-[#E6E1E5] hover:bg-[#E8DEF8] dark:hover:bg-[#32343B] transition-colors focus:outline-none"
          title="Toggle Navigation Sidebar (☰)"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={() => {
            setCurrentTab('HOME');
            if (typeof window !== 'undefined' && window.history && window.history.pushState) {
              window.history.pushState({}, '', '/store');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 focus:outline-none group text-left"
        >
          <AvanyxLogo size={32} showText={false} />
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-[#1D1B20] dark:text-[#E6E1E5] group-hover:text-[#6750A4] dark:group-hover:text-[#D0BCFF] transition-colors leading-tight">
              AVANYX <span className="text-[#6750A4] dark:text-[#D0BCFF]">Store</span>
            </span>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" /> 100% Verified APKs
            </span>
          </div>
        </button>
      </div>

      {/* Center 1: Global Store Navigation Links (Desktop) */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
        <button
          onClick={() => scrollToSection('trusted-apps', 'APPS')}
          className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1D1B20] dark:hover:text-white transition-colors"
        >
          Apps
        </button>
        <button
          onClick={() => scrollToSection('games', 'GAMES')}
          className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1D1B20] dark:hover:text-white transition-colors"
        >
          Games
        </button>
        <button
          onClick={() => scrollToSection('ai-apps')}
          className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1D1B20] dark:hover:text-white transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#6750A4] dark:text-[#D0BCFF]" />
          <span>AI</span>
        </button>
        <button
          onClick={() => scrollToSection('dev-tools', 'DEV_CONSOLE')}
          className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1D1B20] dark:hover:text-white transition-colors"
        >
          Developers
        </button>
        <button
          onClick={() => scrollToSection('students')}
          className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1D1B20] dark:hover:text-white transition-colors"
        >
          Students
        </button>
        <button
          onClick={() => {
            setCurrentTab('INTRO');
            if (typeof window !== 'undefined' && window.history && window.history.pushState) {
              window.history.pushState({}, '', '/');
            }
          }}
          className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1D1B20] dark:hover:text-white transition-colors"
        >
          Docs
        </button>
        <button
          onClick={() => scrollToSection('contact')}
          className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1D1B20] dark:hover:text-white transition-colors"
        >
          Contact
        </button>
      </nav>

      {/* Center 2: Global Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm lg:max-w-md relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F] dark:text-[#CAC4D0]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search verified APKs, games, AI..."
          className="w-full pl-9 sm:pl-10 pr-8 py-2 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-transparent focus:border-[#6750A4] dark:focus:border-[#D0BCFF] text-xs text-[#1D1B20] dark:text-[#E6E1E5] placeholder-[#49454F] dark:placeholder-[#CAC4D0] focus:outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Dark / Light Theme Toggle */}
        <button
          onClick={() => setDarkMode((prev) => !prev)}
          className="p-2 sm:p-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-[#1D1B20] dark:text-[#E6E1E5] hover:bg-[#E8DEF8] dark:hover:bg-[#32343B] transition-colors focus:outline-none"
          title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Dark/Light Theme"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#6750A4]" />
          )}
        </button>

        {/* If Not Authenticated: Sign In & Sign Up buttons (Strict Store Styling, No Identity button) */}
        {!isAuthenticated ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setCurrentTab('LOGIN');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/login');
                }
              }}
              className="px-3 sm:px-4 py-2 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] dark:hover:bg-[#32343B] text-[#1D1B20] dark:text-[#E6E1E5] text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-[#6750A4] dark:text-[#D0BCFF]" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('SIGNUP');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/signup');
                }
              }}
              className="px-3 sm:px-4 py-2 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white text-xs font-extrabold shadow-md shadow-[#6750A4]/20 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        ) : (
          /* If Authenticated: Downloads, Notifications & User Avatar (Opens Account Management) */
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeDownloads > 0 && (
              <button
                onClick={() => setCurrentTab('DOWNLOADS')}
                className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors relative"
                title="Active Downloads"
              >
                <Download className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                  {activeDownloads}
                </span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab('NOTIFICATIONS')}
              className="p-2 sm:p-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-[#1D1B20] dark:text-[#E6E1E5] hover:bg-[#E8DEF8] dark:hover:bg-[#32343B] transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#6750A4] text-white text-[9px] font-black flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Profile Avatar -> Opens Store Profile */}
            <button
              id="header-profile-avatar-btn"
              onClick={() => {
                setCurrentTab('PROFILE');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/profile');
                }
              }}
              className="p-0.5 rounded-2xl hover:ring-2 hover:ring-[#6750A4] transition-all ml-1"
              title={`Profile: ${user.name}`}
            >
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
                    : user.role === 'STUDENT'
                    ? 'STUDENT'
                    : 'VERIFIED'
                }
              />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

