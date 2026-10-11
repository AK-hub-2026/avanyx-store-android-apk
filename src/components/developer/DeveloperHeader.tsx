import React, { useState } from 'react';
import { AvanyxLogo } from '../AvanyxLogo';
import { User } from '../../types';
import {
  Menu,
  Search,
  X,
  Bell,
  HelpCircle,
  Store,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface DeveloperHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: User;
  onExitToStore: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenHelp?: () => void;
}

export const DeveloperHeader: React.FC<DeveloperHeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  searchQuery,
  setSearchQuery,
  user,
  onExitToStore,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenHelp
}) => {
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] h-16 px-3 sm:px-5 md:px-6 bg-[#11121C]/85 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* 1 & 2. Left: Hamburger Menu + AVANYX Store Logo & Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Hamburger Menu Toggle */}
        <button
          id="dev-sidebar-toggle-btn"
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95 focus:outline-none"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* AVANYX Developer Console Logo + Title */}
        <div
          onClick={onExitToStore}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="AVANYX Developer Console"
        >
          <AvanyxLogo size={32} showText={false} />
          <div className="flex items-center gap-2">
            <span className="font-black text-sm sm:text-base tracking-tight text-white group-hover:text-[#C084FC] transition-colors whitespace-nowrap">
              AVANYX <span className="font-semibold text-zinc-400 hidden lg:inline">Developer Console</span>
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#9333EA]/20 border border-[#9333EA]/40 text-[#C084FC] font-extrabold text-[10px] uppercase tracking-wider">
              v2.3
            </span>
          </div>
        </div>
      </div>

      {/* 3. Center: Large Rounded Search Bar (Takes Most Width) */}
      <div className="flex-1 max-w-4xl mx-2 sm:mx-4 hidden md:flex items-center">
        <div className="relative w-full group">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#C084FC] transition-colors pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps, releases, packages, developers..."
            className="w-full pl-11 pr-10 py-2.5 rounded-full bg-[#0E0F17]/90 hover:bg-[#0E0F17] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/30 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Toggle (Visible on Small Screens) */}
      <div className="md:hidden flex items-center">
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 flex items-center justify-center transition"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* 4, 5, 6, 7. Right Actions: Notifications, Help, User Avatar, Store View Button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* 4. Notification Bell with Badge */}
        <button
          id="dev-header-notifications-btn"
          type="button"
          onClick={onOpenNotifications}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-95"
          title="Notifications"
          aria-label="Developer Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#9333EA] text-white text-[9px] font-black flex items-center justify-center border-2 border-[#11121C] shadow-sm">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* 5. Help (?) Icon with Quick Menu */}
        <div className="relative">
          <button
            id="dev-header-help-btn"
            type="button"
            onClick={() => {
              if (onOpenHelp) onOpenHelp();
              setShowHelpDropdown(!showHelpDropdown);
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-95"
            title="Help & Documentation"
            aria-label="Help and Documentation"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Help Popover Dropdown */}
          {showHelpDropdown && (
            <div className="absolute right-0 mt-2 w-64 p-3 rounded-2xl bg-[#161724] border border-white/10 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2 py-1.5 border-b border-white/10 mb-2">
                <p className="text-xs font-bold text-white">Developer Studio Help</p>
                <p className="text-[10px] text-zinc-400">AVANYX Publishing & API Docs</p>
              </div>

              <div className="space-y-1">
                <a
                  href="#policy"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowHelpDropdown(false);
                    if (onOpenHelp) onOpenHelp();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition"
                >
                  <BookOpen className="w-4 h-4 text-[#C084FC]" />
                  <span>Developer Policy & Guide</span>
                </a>
                <a
                  href="#guidelines"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowHelpDropdown(false);
                    if (onOpenHelp) onOpenHelp();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>APK Integrity & Rules</span>
                </a>
                <div className="p-2 rounded-xl bg-[#9333EA]/10 border border-[#9333EA]/20 mt-2">
                  <p className="text-[11px] text-[#C084FC] font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Real-time Sandbox</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    All APK submissions and telemetry metrics sync live with Firestore.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. User Avatar / Profile */}
        <div
          className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-white/10"
          title={`${user.name} (${user.email || 'Publisher'})`}
        >
          <img
            src={user.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user.name || 'dev')}`}
            alt={user.name}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover bg-black/20 ring-2 ring-[#9333EA] shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-white truncate max-w-[110px] leading-tight">
              {user.name || 'Developer'}
            </p>
            <p className="text-[10px] text-[#C084FC] font-semibold leading-tight">
              {user.realRole || 'PUBLISHER'}
            </p>
          </div>
        </div>

        {/* 7. Store View Button (Blue/Purple Pill) */}
        <button
          id="dev-header-store-view-btn"
          type="button"
          onClick={onExitToStore}
          className="h-9 px-3.5 sm:px-4 rounded-full bg-gradient-to-r from-[#9333EA] to-[#7E22CE] hover:from-[#A855F7] hover:to-[#9333EA] text-white font-extrabold text-xs shadow-md shadow-[#9333EA]/25 hover:shadow-[#9333EA]/40 flex items-center gap-1.5 transition active:scale-95 shrink-0"
          title="Return to AVANYX Store"
        >
          <Store className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Back to Store</span>
        </button>
      </div>

      {/* Mobile Search Overlay Bar */}
      {mobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 p-3 bg-[#11121C] border-b border-white/10 md:hidden z-50 flex items-center gap-2 shadow-xl animate-in fade-in duration-150">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps, releases, packages..."
              className="w-full pl-10 pr-8 py-2 rounded-full bg-[#0E0F17] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300"
          >
            Close
          </button>
        </div>
      )}
    </header>
  );
};

