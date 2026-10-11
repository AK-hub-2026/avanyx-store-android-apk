import React, { useState } from 'react';
import { User } from '../../types';
import {
  Settings as SettingsIcon,
  Bell,
  Activity,
  ShieldCheck,
  Save,
  CheckCircle2,
  Database
} from 'lucide-react';

interface ConsoleSettingsTabProps {
  user: User;
}

export const ConsoleSettingsTab: React.FC<ConsoleSettingsTabProps> = ({ user }) => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [telemetrySync, setTelemetrySync] = useState(true);
  const [autoVerifyCheck, setAutoVerifyCheck] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC] uppercase tracking-wider mb-1">
            <SettingsIcon className="w-4 h-4 text-[#C084FC]" />
            <span>Preferences & Workspaces</span>
          </div>
          <h1 className="text-2xl font-black text-white">Console Settings</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Configure real-time telemetry polling rates, developer alerts, and cloud database connections.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Console preferences saved successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6">
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-2xl bg-[#0F1015] border border-white/5 cursor-pointer hover:border-white/10 transition">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-white block">Email Notifications for Review Submissions</span>
              <span className="text-[11px] text-zinc-400">Receive an email when new reviews or comments are posted on your apps</span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded accent-[#9333EA]"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl bg-[#0F1015] border border-white/5 cursor-pointer hover:border-white/10 transition">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-white block">Real-time Firestore Telemetry Sync</span>
              <span className="text-[11px] text-zinc-400">Stream download and review updates directly without manual page refreshes</span>
            </div>
            <input
              type="checkbox"
              checked={telemetrySync}
              onChange={(e) => setTelemetrySync(e.target.checked)}
              className="w-4 h-4 rounded accent-[#9333EA]"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl bg-[#0F1015] border border-white/5 cursor-pointer hover:border-white/10 transition">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-white block">Automatic SHA-256 Checksum Validation</span>
              <span className="text-[11px] text-zinc-400">Verify APK cryptographic signatures before publishing releases</span>
            </div>
            <input
              type="checkbox"
              checked={autoVerifyCheck}
              onChange={(e) => setAutoVerifyCheck(e.target.checked)}
              className="w-4 h-4 rounded accent-[#9333EA]"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white font-extrabold text-xs shadow-lg shadow-[#9333EA]/30 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
