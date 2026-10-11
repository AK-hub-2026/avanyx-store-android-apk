import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Download,
  Pause,
  Play,
  X,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Clock,
  Zap,
  RotateCcw,
  AlertCircle,
  FileCode2,
  Check
} from 'lucide-react';

export const DownloadsScreen: React.FC = () => {
  const {
    downloads,
    apps,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    uninstallApp,
    downloadApp,
    openAppDetails
  } = useStore();

  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'INSTALLED'>('ALL');

  const activeDownloads = downloads.filter(
    (d) => d.status === 'DOWNLOADING' || d.status === 'PREPARING' || d.status === 'PAUSED'
  );
  const completedDownloads = downloads.filter((d) => d.status === 'COMPLETED' || d.status === 'INSTALLED');
  const installedApps = apps.filter((a) => a.isInstalled);

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Title & Stats */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
            <Download className="w-7 h-7 text-[#6750A4] dark:text-[#D0BCFF]" />
            <span>Native Download & App Manager</span>
          </h1>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-1">
            Real-time background APK package transfers, SHA-256 integrity verification, and local application manager.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterTab === 'ALL'
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            All Transfers ({downloads.length})
          </button>
          <button
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterTab === 'ACTIVE'
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Active ({activeDownloads.length})
          </button>
          <button
            onClick={() => setFilterTab('INSTALLED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterTab === 'INSTALLED'
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Installed ({installedApps.length})
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Active Transfers</span>
          <span className="text-xl font-black text-[#1D1B20] dark:text-white mt-1 block">
            {activeDownloads.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Installed Packages</span>
          <span className="text-xl font-black text-emerald-500 mt-1 block">
            {installedApps.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Security Scans</span>
          <span className="text-xl font-black text-[#6750A4] dark:text-[#D0BCFF] mt-1 block">
            100% Clean
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Transfer Protocol</span>
          <span className="text-xl font-black text-blue-500 mt-1 block">
            Background Native
          </span>
        </div>
      </div>

      {/* Active Downloads Section */}
      {(filterTab === 'ALL' || filterTab === 'ACTIVE') && (
        <section className="space-y-4">
          <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#6750A4]" />
            <span>Active & Queued Downloads ({activeDownloads.length})</span>
          </h2>

          {activeDownloads.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
              <Download className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]">
                No downloads actively running. Browse the store to install apps or games.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDownloads.map((task) => (
                <div
                  key={task.appId}
                  className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={task.iconUrl}
                        alt={task.appName}
                        className="w-14 h-14 rounded-2xl object-cover ring-1 ring-black/5 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5] truncate">
                            {task.appName}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              task.status === 'PREPARING'
                                ? 'bg-blue-500/10 text-blue-600'
                                : task.status === 'PAUSED'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF]'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#49454F] dark:text-[#CAC4D0] mt-1 flex-wrap">
                          <span className="font-bold text-amber-500 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> {task.speed}
                          </span>
                          <span>•</span>
                          <span>{task.totalSize}</span>
                          {task.remainingTime && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-zinc-500">
                                <Clock className="w-3 h-3" /> {task.remainingTime}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {task.status === 'DOWNLOADING' || task.status === 'PREPARING' ? (
                        <button
                          onClick={() => pauseDownload(task.appId)}
                          className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-1.5 transition"
                          title="Pause transfer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => resumeDownload(task.appId)}
                          className="px-3.5 py-2 rounded-xl bg-[#6750A4] hover:bg-[#573F94] text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm"
                          title="Resume transfer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                      )}

                      <button
                        onClick={() => cancelDownload(task.appId)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-500 flex items-center gap-1.5 transition"
                        title="Cancel download"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
                      <span className="flex items-center gap-1">
                        {task.status === 'PREPARING' && 'Preparing package headers and security stream...'}
                        {task.status === 'DOWNLOADING' && 'Transferring APK binary in background...'}
                        {task.status === 'PAUSED' && 'Download paused by user.'}
                        {task.status === 'FAILED' && `Failed: ${task.errorReason || 'Network error'}`}
                      </span>
                      <span className="font-mono text-[#6750A4] dark:text-[#D0BCFF] text-sm">
                        {task.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6750A4] via-[#9A82DB] to-[#D0BCFF] transition-all duration-300 shadow-sm"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Installed Applications */}
      {(filterTab === 'ALL' || filterTab === 'INSTALLED') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Installed Applications ({installedApps.length})</span>
            </h2>
            <span className="text-xs text-zinc-400">Ready to launch</span>
          </div>

          {installedApps.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
              <p className="text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]">
                No applications installed yet. Download apps from the store to manage them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {installedApps.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition"
                >
                  <div
                    onClick={() => openAppDetails(app.id)}
                    className="flex items-center gap-3.5 cursor-pointer min-w-0"
                  >
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-13 h-13 rounded-2xl object-cover shrink-0 ring-1 ring-black/5"
                    />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5] truncate">
                        {app.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Clean
                        </span>
                        <span>•</span>
                        <span>v{app.version}</span>
                        <span>•</span>
                        <span>{app.apkSize}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openAppDetails(app.id)}
                      className="px-4 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold hover:bg-[#573F94] shadow-sm transition"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => uninstallApp(app.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition"
                      title="Uninstall Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
