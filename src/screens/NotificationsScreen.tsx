import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Bell, CheckCheck, Trash2, ShieldCheck, Sparkles, Tag, KeyRound, BadgeCheck, FileText, Clock } from 'lucide-react';

export const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    openAppDetails
  } = useStore();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const filtered = notifications.filter((n) => filter === 'ALL' || !n.isRead);

  const getNotificationIcon = (notif: any) => {
    if (notif.category === 'VERIFICATION' || notif.title?.toLowerCase().includes('token') || notif.title?.toLowerCase().includes('draft')) {
      if (notif.title?.toLowerCase().includes('token')) return <KeyRound className="w-4 h-4" />;
      if (notif.title?.toLowerCase().includes('approved') || notif.title?.toLowerCase().includes('verified')) return <BadgeCheck className="w-4 h-4" />;
      if (notif.title?.toLowerCase().includes('resumed')) return <Clock className="w-4 h-4" />;
      return <FileText className="w-4 h-4" />;
    }
    if (notif.type === 'SECURITY') return <ShieldCheck className="w-4 h-4" />;
    if (notif.type === 'PROMOTION') return <Tag className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  const getNotificationBadgeClass = (notif: any) => {
    if (notif.category === 'VERIFICATION' || notif.title?.toLowerCase().includes('token') || notif.title?.toLowerCase().includes('draft')) {
      return 'bg-purple-500/20 text-purple-600 dark:text-purple-300';
    }
    if (notif.type === 'SECURITY') return 'bg-emerald-500/20 text-emerald-500';
    if (notif.type === 'PROMOTION') return 'bg-amber-500/20 text-amber-500';
    return 'bg-[#6750A4]/20 text-[#6750A4]';
  };

  return (
    <div className="space-y-5 pb-8 px-4 max-w-4xl mx-auto">
      {/* Title */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#6750A4] dark:text-[#D0BCFF]" />
            Notification Center
          </h1>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
            Live verification tokens, draft updates, security alerts, and store activity
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E8DEF8] dark:bg-[#4A4458] text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold hover:bg-[#6750A4] hover:text-white transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#CAC4D0]/30 text-xs font-bold pb-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filter === 'ALL'
              ? 'bg-[#6750A4] text-white'
              : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filter === 'UNREAD'
              ? 'bg-[#6750A4] text-white'
              : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5'
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* Notifications Feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-sm font-semibold text-[#49454F] dark:text-[#CAC4D0]">
            No notifications found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationRead(notif.id);
                if (notif.deepLinkAppId) openAppDetails(notif.deepLinkAppId);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                !notif.isRead
                  ? 'bg-[#E8DEF8]/40 dark:bg-[#4A4458]/40 border-[#6750A4]/40 shadow-xs'
                  : 'bg-[#F3EDF7]/50 dark:bg-[#2A282F]/50 border-[#CAC4D0]/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${getNotificationBadgeClass(notif)}`}
                  >
                    {getNotificationIcon(notif)}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                      {notif.title}
                    </h3>
                    <p className="text-xs text-[#1D1B20]/80 dark:text-[#E6E1E5]/80 mt-1 leading-relaxed font-sans">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-medium">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {notif.category && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400">
                          {notif.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="p-1.5 rounded-full hover:bg-black/10 text-[#49454F] transition-colors"
                  aria-label="Delete Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
