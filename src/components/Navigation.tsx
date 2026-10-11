import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  Home,
  Gamepad2,
  LayoutGrid,
  Download,
  Bell,
  Terminal,
  Settings
} from 'lucide-react';
import { NavigationTab } from '../types';

export const Navigation: React.FC = () => {
  const { currentTab, setCurrentTab, notifications, downloads } = useStore();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const activeDownloads = downloads.filter((d) => d.status === 'DOWNLOADING').length;

  const tabs: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'HOME', label: 'Home', icon: Home },
    { id: 'GAMES', label: 'Games', icon: Gamepad2 },
    { id: 'APPS', label: 'Apps', icon: LayoutGrid },
    { id: 'DOWNLOADS', label: 'Downloads', icon: Download, badge: activeDownloads },
    { id: 'NOTIFICATIONS', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'DEV_CONSOLE', label: 'Publish', icon: Terminal },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Navigation Bar */}
      <nav className="hidden md:flex items-center justify-center gap-1 bg-white/50 dark:bg-[#1E1F23]/50 backdrop-blur-md p-1.5 rounded-2xl border border-black/5 dark:border-white/5 my-4 max-w-4xl mx-auto px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#6750A4] text-white shadow-md'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-[#6750A4]' : 'bg-[#6750A4] text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#121316]/90 backdrop-blur-xl border-t border-black/5 dark:border-white/5 px-2 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-colors ${
                isActive
                  ? 'text-[#6750A4] dark:text-[#D0BCFF]'
                  : 'text-[#49454F] dark:text-[#CAC4D0]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-[#6750A4] text-white text-[9px] font-extrabold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
