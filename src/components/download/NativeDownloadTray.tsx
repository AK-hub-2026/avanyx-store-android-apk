import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Download,
  Pause,
  Play,
  X,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const NativeDownloadTray: React.FC = () => {
  const {
    downloads,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    setCurrentTab
  } = useStore();

  const [isMinimized, setIsMinimized] = useState(false);

  // If there are no downloads at all, hide tray
  if (!downloads || downloads.length === 0) return null;

  const activeCount = downloads.filter((d) => d.status === 'DOWNLOADING' || d.status === 'PREPARING').length;
  const pausedCount = downloads.filter((d) => d.status === 'PAUSED').length;
  const completedCount = downloads.filter((d) => d.status === 'COMPLETED' || d.status === 'INSTALLED').length;

  return (
    <aside
      aria-label="Active Download Manager"
      className="fixed bottom-4 right-4 z-50 w-full max-w-sm sm:max-w-md bg-white dark:bg-[#1E1F23] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden transition-all duration-300 animate-slideUp"
    >
      {/* Header Bar */}
      <div
        onClick={() => setIsMinimized(!isMinimized)}
        className="px-5 py-3.5 bg-gradient-to-r from-[#6750A4] to-[#573F94] text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Download className={`w-4 h-4 ${activeCount > 0 ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-wide flex items-center gap-1.5">
              <span>AVANYX Native Download Manager</span>
              {activeCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </h4>
            <p className="text-[10px] text-white/80">
              {activeCount > 0
                ? `${activeCount} downloading in background`
                : pausedCount > 0
                ? `${pausedCount} paused`
                : `${completedCount} completed`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTab('DOWNLOADS');
            }}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold flex items-center gap-1 transition"
            title="Open Full Download Manager"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Open Hub</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1.5 rounded-lg hover:bg-white/20 transition"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body: List of Downloads */}
      {!isMinimized && (
        <div className="p-4 max-h-80 overflow-y-auto space-y-3 divide-y divide-black/5 dark:divide-white/5">
          {downloads.slice(0, 4).map((task) => (
            <div key={task.appId} className="pt-3 first:pt-0 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={task.iconUrl}
                    alt={task.appName}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-black/5 shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] truncate">
                      {task.appName}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <span className="font-semibold text-[#6750A4] dark:text-[#D0BCFF]">
                        {task.speed}
                      </span>
                      <span>•</span>
                      <span>{task.totalSize}</span>
                      {task.remainingTime && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-400">{task.remainingTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {task.status === 'DOWNLOADING' && (
                    <button
                      onClick={() => pauseDownload(task.appId)}
                      className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-zinc-700 dark:text-zinc-300"
                      title="Pause Download"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {task.status === 'PAUSED' && (
                    <button
                      onClick={() => resumeDownload(task.appId)}
                      className="p-1.5 rounded-lg bg-[#6750A4] hover:bg-[#573F94] text-white"
                      title="Resume Download"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => cancelDownload(task.appId)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status & Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      task.status === 'COMPLETED' || task.status === 'INSTALLED'
                        ? 'text-emerald-500'
                        : task.status === 'FAILED'
                        ? 'text-rose-500'
                        : task.status === 'PAUSED'
                        ? 'text-amber-500'
                        : 'text-[#6750A4] dark:text-[#D0BCFF]'
                    }`}
                  >
                    {task.status === 'COMPLETED' || task.status === 'INSTALLED' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed & Verified</span>
                      </>
                    ) : task.status === 'FAILED' ? (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed: {task.errorReason || 'Download Error'}</span>
                      </>
                    ) : task.status === 'PAUSED' ? (
                      'Paused'
                    ) : task.status === 'PREPARING' ? (
                      'Preparing transfer...'
                    ) : (
                      'Downloading APK from source...'
                    )}
                  </span>
                  <span className="text-zinc-500 font-mono">{task.progress}%</span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      task.status === 'COMPLETED' || task.status === 'INSTALLED'
                        ? 'bg-emerald-500'
                        : task.status === 'FAILED'
                        ? 'bg-rose-500'
                        : task.status === 'PAUSED'
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-[#6750A4] to-[#D0BCFF]'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
