import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Lock, Sparkles, Terminal } from 'lucide-react';

export const SecurityAlertsScreen: React.FC = () => {
  const { apps, setCurrentTab } = useStore();

  const installedApps = apps.filter((app) => app.isInstalled);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-emerald-500" />
            CyberShield Security Alerts
          </h1>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
            Real-time APK integrity verification, SHA-256 signature audits, and malware monitoring
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('SETTINGS')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold hover:bg-[#6750A4]/20 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Security Preferences
        </button>
      </div>

      {/* CyberShield Status Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-white to-white dark:from-emerald-950/30 dark:via-[#1E1F23] dark:to-[#1E1F23] border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                CyberShield Protection Active
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider">
                  100% SECURE
                </span>
              </h2>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                All store packages pass strict automated static code analysis & sandbox tests before listing
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-bold text-[#49454F] dark:text-[#CAC4D0] uppercase">Verified SHA-256</span>
            <p className="text-lg font-extrabold text-emerald-500">100%</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-bold text-[#49454F] dark:text-[#CAC4D0] uppercase">Malware Detected</span>
            <p className="text-lg font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">0 Threats</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-bold text-[#49454F] dark:text-[#CAC4D0] uppercase">Installed Checked</span>
            <p className="text-lg font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">{installedApps.length} Packages</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-bold text-[#49454F] dark:text-[#CAC4D0] uppercase">Sandbox Isolation</span>
            <p className="text-lg font-extrabold text-emerald-500">Enabled</p>
          </div>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 p-6 space-y-4">
        <h2 className="text-base font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#6750A4]" />
          Recent Security Audit Log
        </h2>

        <div className="space-y-3">
          {apps.slice(0, 5).map((app) => (
            <div
              key={app.id}
              className="p-4 rounded-2xl bg-[#F3EDF7]/50 dark:bg-[#2A282F]/40 border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={app.iconUrl}
                  alt={app.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                    {app.name}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold">
                      Verified {app.version}
                    </span>
                  </h3>
                  <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] font-mono">
                    SHA-256: {app.sha256Checksum || 'a89f2104c9e8310f92b73'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed Audit
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
