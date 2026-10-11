import React from 'react';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Rocket,
  Users,
  UploadCloud,
  BarChart3,
  MessageSquare,
  Activity,
  Download,
  ShieldCheck,
  Building2,
  FileCheck2,
  Bell,
  ShieldAlert,
  HardDrive,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Package,
  HeartPulse,
  ShoppingBag,
  DollarSign,
  Share2,
  KeyRound,
  Link2,
  Star,
  Eye,
  Sparkles,
  CreditCard,
  TrendingUp,
  Receipt,
  Key,
  UserCheck
} from 'lucide-react';
import { DeveloperConsoleTab } from './developerTypes';

interface DeveloperSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: DeveloperConsoleTab;
  setActiveTab: (tab: DeveloperConsoleTab) => void;
  appsCount: number;
  unreadNotificationsCount?: number;
  pendingReviewsCount?: number;
  crashesCount?: number;
}

export const DeveloperSidebar: React.FC<DeveloperSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  appsCount,
  unreadNotificationsCount = 0,
  pendingReviewsCount = 0,
  crashesCount = 0
}) => {
  const isTabActive = (tab: DeveloperConsoleTab) => {
    if (activeTab === tab) return true;
    if (tab === 'MY_APPS' && activeTab === 'ALL_APPS') return true;
    if (tab === 'APK_DISTRIBUTION' && (activeTab === 'SUBMIT_APP' || activeTab === 'TESTING')) return true;
    if (tab === 'PROMOTION_CENTER' && activeTab === 'PROMOTION_MANAGER') return true;
    if (tab === 'BILLING_CENTER' && activeTab === 'BILLING') return true;
    if (tab === 'REVENUE_ANALYTICS' && (activeTab === 'DOWNLOAD_ANALYTICS' || activeTab === 'ANALYTICS')) return true;
    if (tab === 'NOTIFICATIONS' && activeTab === 'NOTIFICATION_CENTER') return true;
    if (tab === 'SETTINGS' && activeTab === 'CONSOLE_SETTINGS') return true;
    return false;
  };

  const navItem = (
    tab: DeveloperConsoleTab,
    label: string,
    Icon: React.ElementType,
    badge?: string | number,
    badgeColor: string = 'bg-[#EC4899]/30 text-[#F472B6]'
  ) => {
    const isActive = isTabActive(tab);
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`w-full flex items-center ${
          sidebarOpen ? 'justify-between px-3.5 py-2.5' : 'justify-center py-3 px-0'
        } rounded-xl text-xs font-bold transition-all relative group ${
          isActive
            ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
        title={!sidebarOpen ? label : undefined}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
          {sidebarOpen && <span className="truncate">{label}</span>}
        </div>

        {sidebarOpen && badge !== undefined && badge !== null && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeColor}`}>
            {badge}
          </span>
        )}

        {/* Tooltip for collapsed sidebar */}
        {!sidebarOpen && (
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1E1F2C] border border-[#EC4899]/30 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {label}
            {badge !== undefined && <span className="ml-2 px-1.5 py-0.5 rounded bg-[#9333EA] text-[9px]">{badge}</span>}
          </div>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-[72px]'
      } bg-[#14151C] border-r border-white/10 flex flex-col shrink-0 overflow-y-auto overflow-x-hidden py-4 transition-all duration-300 ease-in-out select-none`}
    >
      {/* Submit New App Action Button */}
      <div className="px-3 mb-4">
        {sidebarOpen ? (
          <button
            onClick={() => setActiveTab('SUBMIT_APP')}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:from-[#A855F7] hover:to-[#F472B6] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#9333EA]/25 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New App</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('SUBMIT_APP')}
            className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white flex items-center justify-center shadow-lg shadow-[#9333EA]/25 transition active:scale-95 group relative"
            title="Submit New App"
          >
            <PlusCircle className="w-5 h-5" />
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1E1F2C] border border-[#EC4899]/30 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Submit New App
            </div>
          </button>
        )}
      </div>

      {/* Navigation Items (PART A - Developer Console Sidebar) */}
      <div className="space-y-1.5 px-3 flex-1">
        {sidebarOpen && (
          <p className="text-[10px] font-black uppercase tracking-wider text-[#EC4899] px-3 mb-1 flex items-center gap-1.5">
            <span>Developer Suite</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-pulse" />
          </p>
        )}
        {navItem('DASHBOARD', 'Dashboard', LayoutDashboard)}
        {navItem('DEVELOPER_PROFILE', 'Developer Profile', Building2)}
        {navItem('MY_APPS', 'My Apps', Layers, appsCount > 0 ? appsCount : undefined, 'bg-white/10 text-zinc-300')}
        {navItem('RELEASES', 'Releases', Rocket)}
        {navItem('APK_DISTRIBUTION', 'APK Distribution', UploadCloud)}
        {navItem('PROMOTION_CENTER', 'Promotion Center', Sparkles, 'FEATURE', 'bg-amber-500/20 text-amber-300')}
        {navItem('BILLING_CENTER', 'Billing Center', CreditCard, 'v3.7', 'bg-emerald-500/20 text-emerald-300')}
        {navItem('PAYOUT_CENTER', 'Payout Center', DollarSign, 'UPI', 'bg-[#EC4899]/20 text-[#F472B6]')}
        {navItem('REVENUE_ANALYTICS', 'Revenue Analytics', TrendingUp, 'LIVE', 'bg-emerald-500/20 text-emerald-300')}
        {navItem('API_CENTER', 'API Center', Key, 'SDK', 'bg-[#9333EA]/30 text-[#C084FC]')}
        {navItem('PURCHASE_HISTORY', 'Purchase History', Receipt)}
        {navItem('NOTIFICATIONS', 'Notifications', Bell, unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined, 'bg-red-500/20 text-red-300')}
        {navItem('SETTINGS', 'Settings', SettingsIcon)}
      </div>

      {/* Bottom Sidebar Collapse Toggle Bar */}
      <div className="px-3 pt-4 border-t border-white/10 mt-auto flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className={`w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center ${
            sidebarOpen ? 'justify-between px-3' : 'justify-center'
          } text-xs font-bold transition`}
        >
          {sidebarOpen ? (
            <>
              <span>Collapse Sidebar</span>
              <ChevronLeft className="w-4 h-4" />
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
