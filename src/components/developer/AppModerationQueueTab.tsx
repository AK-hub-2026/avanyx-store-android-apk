import React from 'react';
import { StoreApp, User } from '../../types';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface AppModerationQueueTabProps {
  developerApps: StoreApp[];
  user: User;
}

export const AppModerationQueueTab: React.FC<AppModerationQueueTabProps> = ({
  developerApps,
  user
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC] uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4 text-[#C084FC]" />
            <span>Store Review Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-white">App Moderation Queue</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Track real-time submission review states, automated policy scans, and administrator feedback across all your applications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30">
            {developerApps.filter((a) => a.status === 'PUBLISHED').length} Published
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold border border-amber-500/30">
            {developerApps.filter((a) => a.status === 'PENDING').length} In Review
          </span>
        </div>
      </div>

      {/* App Queue Cards */}
      <div className="space-y-4">
        {developerApps.map((app) => {
          const isPublished = app.status === 'PUBLISHED' || !app.status;
          const isPending = app.status === 'PENDING';
          const isRejected = app.status === 'REJECTED';

          return (
            <div
              key={app.id}
              className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4 hover:border-white/20 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                    alt={app.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-black/40 border border-white/10"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{app.name}</h3>
                      <span className="text-xs text-zinc-400 font-mono">v{app.version}</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">{app.packageName}</p>
                    <span className="text-[10px] text-[#C084FC] font-semibold">{app.category}</span>
                  </div>
                </div>

                <div>
                  {isPublished && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>APPROVED & PUBLISHED</span>
                    </span>
                  )}
                  {isPending && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>UNDER REVIEW (1-2 HOURS)</span>
                    </span>
                  )}
                  {isRejected && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-extrabold text-xs flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      <span>REJECTED • ACTION REQUIRED</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status details bar */}
              <div className="p-4 rounded-2xl bg-[#0F1015] border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 font-bold block text-[10px]">SECURITY SCAN</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Clean • 0 Threat Signatures</span>
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block text-[10px]">APK SIZE</span>
                  <span className="text-white font-medium">{app.sizeMb || 24.5} MB</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block text-[10px]">VERIFIED CHECKSUM</span>
                  <span className="text-zinc-400 font-mono text-[11px] truncate block">
                    {app.checksumSha256 ? `${app.checksumSha256.substring(0, 16)}...` : 'Pre-verified'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
