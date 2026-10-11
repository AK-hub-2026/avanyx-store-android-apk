import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sparkles,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { DeveloperNotification } from './developerTypes';

interface NotificationCenterTabProps {
  notifications?: DeveloperNotification[];
}

export const NotificationCenterTab: React.FC<NotificationCenterTabProps> = () => {
  const [notifications, setNotifications] = useState<DeveloperNotification[]>([
    {
      id: 'notif-1',
      title: 'AVANYX Store Console v2.1 Live',
      message: 'Welcome to Developer Console v2.1! Enjoy real-time Crashlytics, direct Supabase storage uploaders, and Blue Tick verification.',
      timestamp: '2026-08-23 00:30 UTC',
      type: 'SUCCESS',
      read: false
    },
    {
      id: 'notif-2',
      title: 'APK Security Verification Succeeded',
      message: 'Automatic static security scan completed with 0 malware detections for your published APK binaries.',
      timestamp: '2026-08-22 14:15 UTC',
      type: 'INFO',
      read: false
    },
    {
      id: 'notif-3',
      title: 'Direct Firestore Telemetry Active',
      message: 'Download counters and verified user reviews are directly synced in real-time with your Firestore database.',
      timestamp: '2026-08-21 09:00 UTC',
      type: 'INFO',
      read: true
    }
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC] uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4 text-[#C084FC]" />
            <span>Developer Bulletin & Alerts</span>
          </div>
          <h1 className="text-2xl font-black text-white">Notification Center</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Critical security alerts, APK ingestion status updates, and official AVANYX platform announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#C084FC]" />
            <span>Mark all read</span>
          </button>
          <button
            onClick={clearNotifications}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/20 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#161722] border border-white/10 space-y-2">
            <Bell className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No New Notifications</h3>
            <p className="text-xs text-zinc-500">You're all caught up on store alerts and release bulletins.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 rounded-2xl border transition flex items-start gap-4 ${
                notif.read
                  ? 'bg-[#161722]/60 border-white/5'
                  : 'bg-[#161722] border-[#9333EA]/40 shadow-lg shadow-[#9333EA]/5'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#9333EA]/20 border border-[#9333EA]/30 text-[#C084FC] flex items-center justify-center shrink-0 mt-0.5">
                {notif.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {notif.type === 'INFO' && <Info className="w-4 h-4 text-[#C084FC]" />}
                {notif.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {notif.type === 'ALERT' && <ShieldAlert className="w-4 h-4 text-red-400" />}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-white text-xs">{notif.title}</h4>
                  <span className="text-[10px] text-zinc-500 font-mono">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
