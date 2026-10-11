import React from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Users,
  Terminal,
  GraduationCap,
  Layers,
  Sparkles,
  History,
  Activity,
  ArrowRight,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import { StoreApp, User, VerificationRequest, CategoryItem, AuditLog } from '../../types';

interface AdminDashboardOverviewProps {
  appsList: StoreApp[];
  usersList: User[];
  requests: VerificationRequest[];
  categoriesList: CategoryItem[];
  auditLogs: AuditLog[];
  onNavigateTab: (tab: string) => void;
  onSync: () => void;
  loading: boolean;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  appsList,
  usersList,
  requests,
  categoriesList,
  auditLogs,
  onNavigateTab,
  onSync,
  loading
}) => {
  // Pure live Firestore metrics calculation
  const publishedApps = appsList.filter((a) => a.status === 'APPROVED' || a.status === 'PUBLISHED').length;
  const pendingApps = appsList.filter((a) => a.status === 'PENDING_REVIEW' || a.status === 'PENDING' || !a.status).length;
  const suspendedApps = appsList.filter((a) => a.status === 'SUSPENDED' || a.status === 'BANNED').length;

  const verifiedDevs = usersList.filter((u) => u.role === 'DEVELOPER' || u.verifiedDeveloper || u.developerStatus === 'VERIFIED').length;
  const verifiedStudents = usersList.filter((u) => u.role === 'STUDENT' || u.studentStatus === 'VERIFIED').length;
  const adminUsers = usersList.filter((u) => u.role === 'ADMIN' || u.realRole === 'ADMIN').length;

  const pendingDevRequests = requests.filter((r) => r.type === 'DEVELOPER' && r.status === 'PENDING_REVIEW').length;
  const pendingStudentRequests = requests.filter((r) => r.type === 'STUDENT' && r.status === 'PENDING_REVIEW').length;
  const totalPendingVerifications = pendingDevRequests + pendingStudentRequests;

  return (
    <div id="admin-overview-dashboard" className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1E1F23] to-[#2B2C33] text-white border border-white/5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-rose-500/20 text-rose-300 uppercase border border-rose-500/30">
              Root Clearance
            </span>
            <span className="text-xs font-mono text-zinc-400">Production Store Engine</span>
          </div>
          <h2 className="text-xl font-black text-white">AVANYX Enterprise System Overview</h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Live telemetry stream listening directly to Firestore production collections. Zero simulated data.
          </p>
        </div>

        <button
          onClick={onSync}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md self-start sm:self-center disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Collections</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Apps Card */}
        <div
          onClick={() => onNavigateTab('APPS')}
          className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-[#6750A4]/40 transition-all cursor-pointer shadow-sm space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            {pendingApps > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingApps} Pending
              </span>
            )}
          </div>
          <div>
            <div className="text-2xl font-black text-[#1D1B20] dark:text-white">
              {appsList.length}
            </div>
            <div className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
              Catalog Applications
            </div>
          </div>
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            <span>{publishedApps} Published</span>
            <span className="text-rose-500 font-bold">{suspendedApps} Suspended</span>
          </div>
        </div>

        {/* Verifications Card */}
        <div
          onClick={() => onNavigateTab('VERIFICATIONS')}
          className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            {totalPendingVerifications > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {totalPendingVerifications} Needs Review
              </span>
            )}
          </div>
          <div>
            <div className="text-2xl font-black text-[#1D1B20] dark:text-white">
              {requests.length}
            </div>
            <div className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
              Verification Queue
            </div>
          </div>
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            <span>{pendingDevRequests} Devs Queued</span>
            <span>{pendingStudentRequests} Students Queued</span>
          </div>
        </div>

        {/* Users Card */}
        <div
          onClick={() => onNavigateTab('USERS')}
          className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-blue-500/40 transition-all cursor-pointer shadow-sm space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
              RBAC Live
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1D1B20] dark:text-white">
              {usersList.length}
            </div>
            <div className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
              Registered Profiles
            </div>
          </div>
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            <span>{verifiedDevs} Devs</span>
            <span>{verifiedStudents} Students</span>
          </div>
        </div>

        {/* Categories Card */}
        <div
          onClick={() => onNavigateTab('CATEGORIES')}
          className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Firestore Store
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1D1B20] dark:text-white">
              {categoriesList.length}
            </div>
            <div className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
              Active Store Categories
            </div>
          </div>
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            <span>Dynamic Engine</span>
            <span className="text-emerald-500 font-bold">100% Live</span>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
            Administrative Workflows
          </h3>
          <span className="text-xs text-[#49454F] dark:text-[#CAC4D0]">Direct Access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab('APPS')}
            className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] transition-all text-left space-y-1.5 border border-black/5 dark:border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#6750A4] dark:text-[#D0BCFF]">
              <Package className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1D1B20] dark:text-white">Moderate Apps</div>
              <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">Review pending APK releases</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('VERIFICATIONS')}
            className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] transition-all text-left space-y-1.5 border border-black/5 dark:border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <Terminal className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1D1B20] dark:text-white">Verification Queue</div>
              <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">Review dev & student credentials</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('PROMOTIONS')}
            className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] transition-all text-left space-y-1.5 border border-black/5 dark:border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-amber-500">
              <Sparkles className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1D1B20] dark:text-white">Promotions Manager</div>
              <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">Configure featured banners</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('CATEGORIES')}
            className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] transition-all text-left space-y-1.5 border border-black/5 dark:border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-blue-500">
              <FolderPlus className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1D1B20] dark:text-white">Manage Categories</div>
              <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">Add, edit, or reorder store tags</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Audit Trail Preview */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
            <h3 className="text-sm font-black text-[#1D1B20] dark:text-white">
              Recent Administrative Audit Events
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('AUDIT')}
            className="text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] hover:underline flex items-center gap-1"
          >
            <span>View Full Trail ({auditLogs.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#49454F] dark:text-[#CAC4D0] border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
            No recent audit events recorded in Firestore.
          </div>
        ) : (
          <div className="space-y-2">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF]">
                      {log.action}
                    </span>
                    <span className="font-bold text-[#1D1B20] dark:text-white">{log.targetName || log.targetId}</span>
                  </div>
                  <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                    {log.details || 'Administrative policy executed'}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[#49454F] dark:text-[#CAC4D0] whitespace-nowrap">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
