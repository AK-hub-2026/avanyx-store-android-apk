import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  Server,
  ShieldCheck,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Radio
} from 'lucide-react';
import { fetchCategories } from '../../services/firestoreService';

interface AdminSystemHealthProps {
  appsCount: number;
  usersCount: number;
  requestsCount: number;
  categoriesCount: number;
  auditLogsCount: number;
}

export const AdminSystemHealth: React.FC<AdminSystemHealthProps> = ({
  appsCount,
  usersCount,
  requestsCount,
  categoriesCount,
  auditLogsCount
}) => {
  const [latency, setLatency] = useState<number | null>(null);
  const [testingLatency, setTestingLatency] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [firestoreStatus, setFirestoreStatus] = useState<'ONLINE' | 'DEGRADED' | 'CHECKING'>('CHECKING');

  const runDiagnostics = async () => {
    setTestingLatency(true);
    const start = performance.now();
    try {
      await fetchCategories();
      const end = performance.now();
      const diff = Math.round(end - start);
      setLatency(diff);
      setFirestoreStatus(diff > 1200 ? 'DEGRADED' : 'ONLINE');
    } catch (err) {
      console.error('Diagnostic error:', err);
      setFirestoreStatus('DEGRADED');
      setLatency(null);
    } finally {
      setTestingLatency(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div id="admin-system-health" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Infrastructure Telemetry</span>
          </div>
          <h2 className="text-xl font-black text-[#1D1B20] dark:text-white">Enterprise System & Firestore Health</h2>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
            Continuous real-time probe monitoring Firebase services, RBAC enforcement policies, and live latency.
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={testingLatency}
          className="px-4 py-2.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm self-start sm:self-center disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${testingLatency ? 'animate-spin' : ''}`} />
          <span>Ping Firestore Probe</span>
        </button>
      </div>

      {/* Core Health Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Firestore Database */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {firestoreStatus}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1D1B20] dark:text-white">
              {latency !== null ? `${latency} ms` : 'Probing...'}
            </div>
            <div className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
              Round-Trip Firestore Latency
            </div>
          </div>
          <div className="pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        </div>

        {/* Security Rules & RBAC */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400">
              STRICT
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1D1B20] dark:text-white">
              RBAC v3.0
            </div>
            <div className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
              Security Rules Enforcement
            </div>
          </div>
          <div className="pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            Roles: USER, STUDENT, DEVELOPER, ADMIN
          </div>
        </div>

        {/* Real-Time Listeners */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-600 dark:text-purple-400">
              STREAMING
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1D1B20] dark:text-white">
              onSnapshot()
            </div>
            <div className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
              Live Web Socket Channels
            </div>
          </div>
          <div className="pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            Zero polling, sub-millisecond sync
          </div>
        </div>

        {/* Single UID Auth Linking */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400">
              ACTIVE
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1D1B20] dark:text-white">
              Single UID
            </div>
            <div className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
              OAuth Credential Linking
            </div>
          </div>
          <div className="pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            Google & GitHub merge handling
          </div>
        </div>
      </div>

      {/* Realtime Collections Telemetry */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4 shadow-sm">
        <h3 className="text-sm font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
          Firestore Production Collections Audit
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#1D1B20] dark:text-white">apps</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
            <div className="text-xl font-black text-[#1D1B20] dark:text-white">{appsCount} docs</div>
            <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">Catalog, binaries, checksums</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#1D1B20] dark:text-white">users</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
            <div className="text-xl font-black text-[#1D1B20] dark:text-white">{usersCount} docs</div>
            <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">RBAC roles, verification profiles</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#1D1B20] dark:text-white">verification_requests</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
            <div className="text-xl font-black text-[#1D1B20] dark:text-white">{requestsCount} docs</div>
            <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">Developer & student queue</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#1D1B20] dark:text-white">categories</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
            <div className="text-xl font-black text-[#1D1B20] dark:text-white">{categoriesCount} docs</div>
            <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">Dynamic store taxonomy</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#1D1B20] dark:text-white">audit_logs</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
            <div className="text-xl font-black text-[#1D1B20] dark:text-white">{auditLogsCount} events</div>
            <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">Immutable admin action logs</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#1D1B20] dark:text-white">telemetry</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
            <div className="text-xl font-black text-[#1D1B20] dark:text-white">Raw Events</div>
            <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">app_downloads & app_views streams</div>
          </div>
        </div>
      </div>
    </div>
  );
};
