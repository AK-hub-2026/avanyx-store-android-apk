import React from 'react';
import { useStore } from '../context/StoreContext';
import { NavigationTab } from '../types';
import { AvanyxLogo } from './AvanyxLogo';
import { AvanyxIdentityAvatar } from './identity';
import {
  Home,
  Gamepad2,
  LayoutGrid,
  Download,
  ShieldAlert,
  Terminal,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  Mail,
  KeyRound,
  Sparkles,
  Compass,
  GraduationCap,
  BadgeCheck,
  Receipt,
  Gift
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    notifications,
    downloads,
    sidebarOpen,
    toggleSidebar,
    user,
    isAuthenticated
  } = useStore();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const activeDownloads = downloads.filter((d) => d.status === 'DOWNLOADING').length;

  const isDeveloper = isAuthenticated && (user.role === 'DEVELOPER' || user.realRole === 'DEVELOPER' || user.verifiedDeveloper || user.developerStatus === 'VERIFIED' || user.role === 'ADMIN' || user.realRole === 'ADMIN');
  const isDevPending = isAuthenticated && (user.developerStatus === 'PENDING_REVIEW' || user.developerDetails?.status === 'PENDING_REVIEW');
  const showDevButton = isAuthenticated; // Permanent Developer Console button after login (PART C)

  const isAdmin = isAuthenticated && (user.role === 'ADMIN' || user.realRole === 'ADMIN');

  const isStudent = isAuthenticated && (user.role === 'STUDENT' || user.realRole === 'STUDENT' || user.studentStatus === 'VERIFIED' || user.role === 'ADMIN' || user.realRole === 'ADMIN');
  const isStuPending = isAuthenticated && (user.studentStatus === 'PENDING_REVIEW' || user.studentDetails?.status === 'PENDING_REVIEW');
  const showStuButton = isStudent || isStuPending;

  const handleTabClick = (tab: NavigationTab) => {
    // Guard Profile / Account navigation -> navigates to Store Profile
    if (tab === 'ACCOUNT' || tab === 'PROFILE') {
      setCurrentTab('PROFILE');
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        window.history.pushState({}, '', '/profile');
      }
      return;
    }

    // Guard Developer Console navigation - Permanent access after login
    if (tab === 'DEV_CONSOLE') {
      if (!isAuthenticated) {
        setCurrentTab('LOGIN');
        if (typeof window !== 'undefined' && window.history && window.history.pushState) {
          window.history.pushState({}, '', '/login');
        }
        return;
      }
      setCurrentTab('DEV_CONSOLE');
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        window.history.pushState({}, '', '/developer');
      }
      return;
    }

    // Developer Apply
    if (tab === 'DEVELOPER_APPLY') {
      if (!isAuthenticated) {
        setCurrentTab('LOGIN');
        if (typeof window !== 'undefined' && window.history && window.history.pushState) {
          window.history.pushState({}, '', '/login');
        }
        return;
      }
      setCurrentTab('DEVELOPER_APPLY');
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        window.history.pushState({}, '', '/developer/apply');
      }
      return;
    }

    // Student Console
    if (tab === 'STUDENT_CONSOLE') {
      if (!isAuthenticated) {
        setCurrentTab('LOGIN');
        if (typeof window !== 'undefined' && window.history && window.history.pushState) {
          window.history.pushState({}, '', '/login');
        }
        return;
      }
      if (isStuPending && !isStudent) {
        setCurrentTab('STUDENT_APPLY');
        if (typeof window !== 'undefined' && window.history && window.history.pushState) {
          window.history.pushState({}, '', '/student/apply');
        }
        return;
      }
      if (!isStudent) {
        setCurrentTab('STUDENT_APPLY');
        if (typeof window !== 'undefined' && window.history && window.history.pushState) {
          window.history.pushState({}, '', '/student/apply');
        }
        return;
      }
      setCurrentTab('STUDENT_CONSOLE');
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        window.history.pushState({}, '', '/student');
      }
      return;
    }

    // Guard Admin Console navigation
    if (tab === 'ADMIN_CONSOLE' || tab === 'ADMIN_OAUTH') {
      if (!isAuthenticated) {
        setCurrentTab('LOGIN');
        if (typeof window !== 'undefined' && window.history && window.history.pushState) {
          window.history.pushState({}, '', '/login');
        }
        return;
      }
      if (!isAdmin) {
        setCurrentTab('HOME');
        if (typeof window !== 'undefined' && window.history && window.history.pushState) {
          window.history.pushState({}, '', '/store');
        }
        return;
      }
      setCurrentTab(tab);
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        window.history.pushState({}, '', tab === 'ADMIN_CONSOLE' ? '/admin' : '/identity/admin/oauth');
      }
      return;
    }

    setCurrentTab(tab);
    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      if (tab === 'INTRO') {
        window.history.pushState({}, '', '/');
      } else if (tab === 'HOME') {
        window.history.pushState({}, '', '/store');
      } else if (tab === 'LOGIN') {
        window.history.pushState({}, '', '/login');
      } else if (tab === 'SIGNUP') {
        window.history.pushState({}, '', '/signup');
      }
    }
  };

  const isTabActive = (tab: NavigationTab) => currentTab === tab;

  const getItemClass = (tab: NavigationTab) => {
    const active = isTabActive(tab);
    return `w-full flex items-center ${
      sidebarOpen ? 'justify-start px-3.5 gap-3.5' : 'justify-center px-0'
    } py-3 rounded-2xl font-bold text-xs transition-all duration-150 relative group ${
      active
        ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/25 ring-1 ring-[#6750A4]'
        : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-[#F3EDF7] dark:hover:bg-[#2A282F] hover:text-[#1D1B20] dark:hover:text-[#E6E1E5]'
    }`;
  };

  return (
    <aside
      id="avanyx-sidebar"
      className={`h-full bg-white dark:bg-[#18191D] border-r border-black/5 dark:border-white/5 transition-[width] duration-300 ease-in-out flex flex-col shrink-0 z-30 select-none ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Top Sidebar Header with Official AVANYX Logo & Toggle */}
      <div
        className={`h-16 px-4 flex items-center border-b border-black/5 dark:border-white/5 shrink-0 ${
          sidebarOpen ? 'justify-between' : 'justify-center'
        }`}
      >
        <button
          onClick={() => handleTabClick('HOME')}
          className="flex items-center text-left group focus:outline-none"
          title="AVANYX Store Home"
        >
          <AvanyxLogo
            size={36}
            showText={sidebarOpen}
            compact={!sidebarOpen}
          />
        </button>

        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-[#F3EDF7] dark:hover:bg-[#2A282F] hover:text-[#1D1B20] dark:hover:text-white transition-colors"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Scrollable Body */}
      <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden flex flex-col justify-between scrollbar-none space-y-6">
        <div className="space-y-5">
          {/* Section 1: Main Store Navigation */}
          <div className="space-y-1">
            {sidebarOpen && (
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-[#49454F]/70 dark:text-[#CAC4D0]/70 mb-2">
                Store Navigation
              </p>
            )}

            {/* 🏠 Home */}
            <button
              onClick={() => handleTabClick('HOME')}
              className={getItemClass('HOME')}
              title="Home"
            >
              <Home className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="truncate">Home</span>}
            </button>

            {/* 🎮 Games */}
            <button
              onClick={() => handleTabClick('GAMES')}
              className={getItemClass('GAMES')}
              title="Games"
            >
              <Gamepad2 className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="truncate">Games</span>}
            </button>

            {/* 📱 Apps */}
            <button
              onClick={() => handleTabClick('APPS')}
              className={getItemClass('APPS')}
              title="Apps"
            >
              <LayoutGrid className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="truncate">Apps</span>}
            </button>

            {/* ⬇️ Downloads */}
            <button
              onClick={() => handleTabClick('DOWNLOADS')}
              className={getItemClass('DOWNLOADS')}
              title="Downloads"
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <Download className="w-5 h-5" />
                {activeDownloads > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce shadow-sm">
                    {activeDownloads}
                  </span>
                )}
              </div>
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">Downloads</span>
                  {activeDownloads > 0 && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {activeDownloads} active
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* 🛡️ Security Alerts */}
            <button
              onClick={() => handleTabClick('SECURITY_ALERTS')}
              className={getItemClass('SECURITY_ALERTS')}
              title="Security Alerts"
            >
              <ShieldAlert className="w-5 h-5 shrink-0 text-emerald-500" />
              {sidebarOpen && <span className="truncate">Security Alerts</span>}
            </button>
          </div>

          {/* Divider 1 */}
          <div className="border-t border-black/5 dark:border-white/5 mx-1" />

          {/* Section 2: Developer & System */}
          <div className="space-y-1">
            {sidebarOpen && (
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-[#49454F]/70 dark:text-[#CAC4D0]/70 mb-2">
                Consoles & Portals
              </p>
            )}

            {/* Consoles & Portals (Permanent Developer Console button after login - PART C) */}
            {showDevButton && (
              <button
                id="sidebar-nav-dev-console"
                onClick={() => handleTabClick('DEV_CONSOLE')}
                className={getItemClass('DEV_CONSOLE')}
                title={isDevPending && !isDeveloper ? 'Developer Application Pending Review' : 'Developer Console'}
              >
                <Terminal className="w-5 h-5 shrink-0 text-[#6750A4] dark:text-[#D0BCFF]" />
                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">Developer Console</span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        isDeveloper
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : isDevPending
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse'
                          : user.developerStatus === 'REJECTED'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF]'
                      }`}
                    >
                      {isDeveloper
                        ? 'STUDIO'
                        : isDevPending
                        ? 'PENDING'
                        : user.developerStatus === 'REJECTED'
                        ? 'REJECTED'
                        : 'DEV'}
                    </span>
                  </div>
                )}
              </button>
            )}

            {/* 🎓 Student Console (Visible if verified OR pending student application submitted) */}
            {showStuButton && (
              <button
                id="sidebar-nav-student-console"
                onClick={() => handleTabClick('STUDENT_CONSOLE')}
                className={getItemClass('STUDENT_CONSOLE')}
                title={isStuPending && !isStudent ? 'Student Application Pending Review' : 'Student Console'}
              >
                <GraduationCap className="w-5 h-5 shrink-0 text-cyan-500" />
                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">Student Console</span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        isStuPending && !isStudent
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse'
                          : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                      }`}
                    >
                      {isStuPending && !isStudent ? 'PENDING' : 'ACADEMIC'}
                    </span>
                  </div>
                )}
              </button>
            )}

            {/* 🛡️ Admin Console (Protected: Only for Authenticated Admins) */}
            {isAdmin && (
              <button
                id="sidebar-nav-admin-console"
                onClick={() => handleTabClick('ADMIN_CONSOLE')}
                className={getItemClass('ADMIN_CONSOLE')}
                title="Admin Console"
              >
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate text-rose-600 dark:text-rose-400 font-bold">Admin Console</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
                      ADMIN
                    </span>
                  </div>
                )}
              </button>
            )}

            {/* ✉️ Gmail Workspace (Admin Only) */}
            {isAdmin && (
              <button
                id="sidebar-nav-gmail"
                onClick={() => handleTabClick('GMAIL')}
                className={getItemClass('GMAIL')}
                title="Gmail Workspace"
              >
                <Mail className="w-5 h-5 shrink-0 text-rose-500" />
                {sidebarOpen && <span className="truncate">Gmail Hub</span>}
              </button>
            )}

            {/* ⚙️ Settings */}
            <button
              id="sidebar-nav-settings"
              onClick={() => handleTabClick('SETTINGS')}
              className={getItemClass('SETTINGS')}
              title="Settings"
            >
              <Settings className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="truncate">Settings</span>}
            </button>

            {/* 🧭 Documentation & Intro Page */}
            <button
              id="sidebar-nav-intro"
              onClick={() => handleTabClick('INTRO')}
              className={getItemClass('INTRO')}
              title="Documentation & About"
            >
              <Compass className="w-5 h-5 shrink-0 text-[#6750A4] dark:text-[#D0BCFF]" />
              {sidebarOpen && <span className="truncate">Documentation & About</span>}
            </button>
          </div>
        </div>

        {/* Section 3: Account Controls */}
        <div className="space-y-1 pt-2">
          <div className="border-t border-black/5 dark:border-white/5 mx-1 mb-3" />

          {sidebarOpen && (
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-[#49454F]/70 dark:text-[#CAC4D0]/70 mb-2">
              Store Account
            </p>
          )}

          {/* 🔔 Notifications */}
          <button
            id="sidebar-nav-notifications"
            onClick={() => handleTabClick('NOTIFICATIONS')}
            className={getItemClass('NOTIFICATIONS')}
            title="Notifications"
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#6750A4] text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            {sidebarOpen && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="truncate">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF]">
                    {unreadCount} new
                  </span>
                )}
              </div>
            )}
          </button>

          {/* 🧾 Purchase History & Billing */}
          <button
            id="sidebar-nav-purchase-history"
            onClick={() => handleTabClick('PURCHASE_HISTORY')}
            className={getItemClass('PURCHASE_HISTORY')}
            title="Purchase History & Billing"
          >
            <Receipt className="w-5 h-5 shrink-0 text-[#6750A4] dark:text-[#D0BCFF]" />
            {sidebarOpen && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="truncate">Purchases & Billing</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  v3.7
                </span>
              </div>
            )}
          </button>

          {/* 🎁 Rewards Center (PART F) */}
          <button
            id="sidebar-nav-rewards-center"
            onClick={() => handleTabClick('REWARDS_CENTER')}
            className={getItemClass('REWARDS_CENTER')}
            title="Rewards Center"
          >
            <Gift className="w-5 h-5 shrink-0 text-amber-500" />
            {sidebarOpen && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="truncate">Rewards Center</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Bonus
                </span>
              </div>
            )}
          </button>

          {/* 👤 AVANYX Store Profile */}
          <button
            id="sidebar-nav-profile"
            onClick={() => handleTabClick('PROFILE')}
            className={getItemClass('PROFILE')}
            title="Profile"
          >
            <div className="shrink-0 relative flex items-center justify-center">
              <AvanyxIdentityAvatar
                src={user.avatarUrl}
                name={user.name}
                size="xs"
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
            </div>
            {sidebarOpen && (
              <div className="flex-1 text-left min-w-0">
                <span className="truncate block font-bold">{user.name}</span>
                <span className={`text-[9px] font-bold block -mt-0.5 ${
                  user.role === 'DEVELOPER' || user.role === 'ADMIN'
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-[#49454F] dark:text-[#CAC4D0]'
                }`}>
                  {user.id ? `AVANYX ${user.role}` : 'AVANYX Guest'}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Collapse/Expand Sidebar Footer Toggle */}
      <div className="p-3 border-t border-black/5 dark:border-white/5 shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label="Toggle Sidebar"
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-2 text-xs font-bold">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Menu</span>
            </div>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
