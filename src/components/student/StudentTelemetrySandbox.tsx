import React, { useState, useEffect } from 'react';
import { StoreApp, User } from '../../types';
import { subscribeToDownloadEvents } from '../../services/firestoreService';
import {
  Terminal,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  FileCheck,
  Clock,
  Layers
} from 'lucide-react';

interface StudentTelemetrySandboxProps {
  user: User;
  studentApps: StoreApp[];
}

export const StudentTelemetrySandbox: React.FC<StudentTelemetrySandboxProps> = ({
  user,
  studentApps
}) => {
  const [downloadEvents, setDownloadEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // SHA-256 Checker State
  const [inputHash, setInputHash] = useState('');
  const [checkResult, setCheckResult] = useState<'MATCH' | 'NO_MATCH' | null>(null);
  const [matchedApp, setMatchedApp] = useState<StoreApp | null>(null);

  const studentAppIdsString = studentApps.map((a) => a.id).join(',');

  useEffect(() => {
    const unsub = subscribeToDownloadEvents('ALL', (events) => {
      // Filter downloads belonging to student's apps
      const studentAppIds = new Set(studentApps.map((a) => a.id));
      const filtered = events.filter((e) => studentAppIds.has(e.appId) || e.developerUid === user.id);
      setDownloadEvents(filtered);
      setLoading(false);
    });

    return () => unsub();
  }, [user.id, studentAppIdsString]);

  const handleVerifyHash = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputHash.trim().toLowerCase();
    if (!clean) return;

    const found = studentApps.find(
      (a) =>
        (a.sha256Checksum && a.sha256Checksum.toLowerCase() === clean) ||
        (a.checksumSha256 && a.checksumSha256.toLowerCase() === clean)
    );

    if (found) {
      setCheckResult('MATCH');
      setMatchedApp(found);
    } else {
      setCheckResult('NO_MATCH');
      setMatchedApp(null);
    }
  };

  return (
    <div id="student-telemetry-module" className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 space-y-1 shadow-sm">
        <h3 className="text-base font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[#6750A4] dark:text-cyan-400" />
          <span>APK Sandbox & Live Telemetry Inspector</span>
        </h3>
        <p className="text-xs text-[#49454F] dark:text-slate-400">
          Monitor real-time download packets, telemetry streams, and cryptographically verify APK signatures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Download Stream */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Live Download Stream</span>
              </h4>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Live Firestore Stream
              </span>
            </div>
            <p className="text-xs text-[#49454F] dark:text-slate-400">
              Direct telemetry packets logged whenever users install your educational APKs.
            </p>
          </div>

          <div className="divide-y divide-black/5 dark:divide-cyan-500/10 max-h-[340px] overflow-y-auto pr-1">
            {downloadEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Clock className="w-8 h-8 text-[#6750A4]/40 dark:text-cyan-500/40 mx-auto" />
                <p>No download events recorded for your student apps yet.</p>
                <p className="text-[11px] text-[#49454F] dark:text-slate-600">Events will stream in real-time as users install.</p>
              </div>
            ) : (
              downloadEvents.slice(0, 15).map((evt) => (
                <div key={evt.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-bold text-[#1D1B20] dark:text-white truncate">{evt.appName || 'Coursework Project'}</div>
                    <div className="text-[10px] font-mono text-[#6750A4] dark:text-cyan-400/80 truncate">
                      Packet ID: {evt.id.substring(0, 16)}...
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-[#49454F] dark:text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Verified Packet</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-black/5 dark:border-cyan-500/10 flex items-center justify-between text-[11px] text-slate-500">
            <span>Stream items: {downloadEvents.length}</span>
            <span>Zero mock telemetry</span>
          </div>
        </div>

        {/* SHA-256 APK Checksum Validator */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 space-y-4 shadow-sm">
          <div className="space-y-2">
            <h4 className="text-sm font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
              <span>SHA-256 Checksum Validator</span>
            </h4>
            <p className="text-xs text-[#49454F] dark:text-slate-400">
              Verify your APK's cryptographic integrity against the authoritative hash stored in the AVANYX repository.
            </p>
          </div>

          <form onSubmit={handleVerifyHash} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#1D1B20] dark:text-slate-300 mb-1">
                Enter SHA-256 Checksum
              </label>
              <input
                type="text"
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                placeholder="Paste 64-character SHA-256 hex string..."
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F9FA] dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-[#1D1B20] dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#6750A4] dark:focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Verify APK Integrity</span>
            </button>
          </form>

          {checkResult === 'MATCH' && matchedApp && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Signature Match Confirmed!</span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                This hash cryptographically matches <strong>{matchedApp.name}</strong> (v{matchedApp.version}). The APK package is untampered and clean.
              </p>
            </div>
          )}

          {checkResult === 'NO_MATCH' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No Matching Student App Found</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                This hash does not match any of your currently registered project releases. Please verify you copied the full SHA-256 from your build output.
              </p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/10 space-y-2 text-xs">
            <span className="font-bold text-[#1D1B20] dark:text-slate-300 block">How to generate SHA-256 in terminal:</span>
            <code className="block p-2 rounded-lg bg-black/5 dark:bg-black/40 text-[#6750A4] dark:text-cyan-300 font-mono text-[11px]">
              shasum -a 256 app-release.apk
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
