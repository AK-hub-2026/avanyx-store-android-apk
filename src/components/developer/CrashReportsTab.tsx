import React, { useState } from 'react';
import { StoreApp } from '../../types';
import {
  Activity,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Smartphone,
  Layers,
  ChevronRight,
  Filter,
  Copy,
  Check
} from 'lucide-react';
import { CrashReportItem } from './developerTypes';

interface CrashReportsTabProps {
  developerApps: StoreApp[];
  activeApp?: StoreApp;
}

export const CrashReportsTab: React.FC<CrashReportsTabProps> = ({
  developerApps,
  activeApp
}) => {
  const [selectedLog, setSelectedLog] = useState<CrashReportItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulated Live Crashlytics Telemetry (Clean stability status)
  const mockCrashes: CrashReportItem[] = [
    {
      id: 'crash-001',
      appName: activeApp?.name || 'AVANYX Store',
      packageName: activeApp?.packageName || 'com.avanyx.appstore.dev',
      version: '1.0.0',
      crashType: 'NullPointerException',
      message: 'Attempt to invoke virtual method on a null object reference at MediaRenderer.onRender()',
      stackTrace: `java.lang.NullPointerException: Attempt to invoke virtual method 'android.graphics.Bitmap.getWidth()' on a null object reference
    at com.avanyx.store.ui.MediaRenderer.onDraw(MediaRenderer.kt:142)
    at android.view.View.draw(View.java:23281)
    at android.view.ViewGroup.drawChild(ViewGroup.java:4521)
    at com.avanyx.store.MainActivity.onCreate(MainActivity.kt:88)`,
      deviceModel: 'Google Pixel 8 Pro (Android 14)',
      androidVersion: 'Android 14 (API 34)',
      occurrences: 1,
      lastOccurred: '2026-08-22 18:42:10 UTC',
      status: 'RESOLVED'
    }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Firebase Crashlytics Realtime Telemetry</span>
          </div>
          <h1 className="text-2xl font-black text-white">Crash Reports & Stability</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Monitor real-time application runtime exceptions, stack traces, and device OS crash rates directly from production devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-[#0F1015] border border-emerald-500/30 text-center">
            <span className="text-[10px] text-zinc-400 font-bold block">Crash-Free Users</span>
            <span className="text-xl font-black text-emerald-400">99.98%</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#0F1015] border border-white/10 text-center">
            <span className="text-[10px] text-zinc-400 font-bold block">Active Issues</span>
            <span className="text-xl font-black text-white">0 Open</span>
          </div>
        </div>
      </div>

      {/* Stability Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-1">
          <span className="text-xs font-bold text-zinc-400">Crash Free Sessions</span>
          <p className="text-2xl font-black text-emerald-400">100.0%</p>
          <p className="text-[10px] text-zinc-500 font-medium">Over 24h testing window</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-1">
          <span className="text-xs font-bold text-zinc-400">Fatal Crashes</span>
          <p className="text-2xl font-black text-white">0</p>
          <p className="text-[10px] text-zinc-500 font-medium">Zero fatal crashes recorded</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-1">
          <span className="text-xs font-bold text-zinc-400">Non-Fatal Exceptions</span>
          <p className="text-2xl font-black text-blue-400">1 Logged</p>
          <p className="text-[10px] text-zinc-500 font-medium">Handled gracefully</p>
        </div>
      </div>

      {/* Logs and Details View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Issues List */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4">
          <h3 className="text-sm font-extrabold text-white">Recorded Exception Logs</h3>
          <div className="space-y-3">
            {mockCrashes.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedLog(item)}
                className={`p-4 rounded-2xl border text-xs cursor-pointer transition ${
                  selectedLog?.id === item.id
                    ? 'bg-[#9333EA]/20 border-[#9333EA] text-white shadow-lg'
                    : 'bg-[#0F1015] border-white/5 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-red-400 font-mono">{item.crashType}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                    {item.status}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] truncate mb-2">{item.message}</p>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                  <span>v{item.version}</span>
                  <span>{item.occurrences} occurrence</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stack Trace & Device Diagnostics Viewer */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Stack Trace & Diagnostics</h3>
            {selectedLog && (
              <button
                onClick={() => handleCopy(selectedLog.stackTrace, selectedLog.id)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5"
              >
                {copiedId === selectedLog.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === selectedLog.id ? 'Copied' : 'Copy Trace'}</span>
              </button>
            )}
          </div>

          {selectedLog ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#0F1015] border border-white/5 text-xs">
                <div>
                  <span className="text-zinc-500 font-bold block text-[10px]">DEVICE / OS</span>
                  <span className="text-white font-medium">{selectedLog.deviceModel}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block text-[10px]">TIME OCCURRED</span>
                  <span className="text-white font-medium">{selectedLog.lastOccurred}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#C084FC]" />
                  <span>De-obfuscated Stack Trace</span>
                </span>
                <pre className="p-4 rounded-2xl bg-[#0A0B0E] border border-white/10 text-[11px] font-mono text-red-300 overflow-x-auto leading-relaxed">
                  {selectedLog.stackTrace}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-500 text-xs space-y-2">
              <Activity className="w-8 h-8 mx-auto text-zinc-600" />
              <p>Select an exception log from the left to inspect stack trace and device telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
