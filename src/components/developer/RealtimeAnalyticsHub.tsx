import React, { useState } from 'react';
import { StoreApp } from '../../types';
import { DeveloperRealtimeAnalyticsData } from './developerTypes';
import { DownloadAnalyticsTab } from './DownloadAnalyticsTab';
import { ReviewsAnalyticsTab } from './ReviewsAnalyticsTab';
import { RatingsAnalyticsTab } from './RatingsAnalyticsTab';
import { ViewsAnalyticsTab } from './ViewsAnalyticsTab';
import { exportAnalyticsToCSV, exportAnalyticsToPDF } from '../../utils/analyticsExport';
import {
  Download,
  MessageSquare,
  Star,
  Eye,
  Activity,
  Trophy,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  FileText,
  FileSpreadsheet
} from 'lucide-react';

export type AnalyticsSubTab = 'DOWNLOADS' | 'REVIEWS' | 'RATINGS' | 'VIEWS';

interface RealtimeAnalyticsHubProps {
  developerApps: StoreApp[];
  activeApp?: StoreApp;
  selectedAppId: string;
  analyticsData?: DeveloperRealtimeAnalyticsData;
  activeUid: string;
  initialSubTab?: AnalyticsSubTab;
  onSelectApp?: (appId: string) => void;
  openAppDetails?: (app: StoreApp) => void;
  downloadEvents?: any[];
  viewEvents?: any[];
}

export const RealtimeAnalyticsHub: React.FC<RealtimeAnalyticsHubProps> = ({
  developerApps,
  activeApp,
  selectedAppId,
  analyticsData,
  activeUid,
  initialSubTab = 'DOWNLOADS',
  onSelectApp,
  openAppDetails,
  downloadEvents = [],
  viewEvents = []
}) => {
  const [subTab, setSubTab] = useState<AnalyticsSubTab>(initialSubTab);

  const tabsConfig = [
    {
      id: 'DOWNLOADS' as const,
      label: 'Downloads Analytics',
      icon: Download,
      count: analyticsData?.downloads?.totalDownloads ?? (activeApp?.downloadCount || 0),
      color: 'text-emerald-400',
      activeBg: 'bg-[#9333EA] text-white shadow-lg shadow-[#9333EA]/30'
    },
    {
      id: 'REVIEWS' as const,
      label: 'Reviews Analytics',
      icon: MessageSquare,
      count: analyticsData?.reviews?.totalReviews || 0,
      color: 'text-blue-400',
      activeBg: 'bg-[#9333EA] text-white shadow-lg shadow-[#9333EA]/30'
    },
    {
      id: 'RATINGS' as const,
      label: 'Ratings Analytics',
      icon: Star,
      count: `${(analyticsData?.ratings?.totalRatingsCount ? analyticsData.ratings.averageRating : (activeApp?.rating || 0)).toFixed(1)} ★`,
      color: 'text-amber-400',
      activeBg: 'bg-[#9333EA] text-white shadow-lg shadow-[#9333EA]/30'
    },
    {
      id: 'VIEWS' as const,
      label: 'Views Analytics',
      icon: Eye,
      count: analyticsData?.views?.totalViews ?? (typeof activeApp?.viewCount === 'number' ? activeApp.viewCount : 0),
      color: 'text-cyan-400',
      activeBg: 'bg-[#9333EA] text-white shadow-lg shadow-[#9333EA]/30'
    }
  ];

  const appRankings = analyticsData?.appRankings || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Sub-Tab Switcher Bar (Google Play Console / AVANYX Purple Themed) */}
      <div className="p-2 rounded-3xl bg-[#161722] border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {tabsConfig.map((t) => {
            const Icon = t.icon;
            const isActive = subTab === t.id;
            return (
              <button
                key={t.id}
                id={`tab-analytics-${t.id.toLowerCase()}`}
                onClick={() => setSubTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  isActive
                    ? t.activeBg
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{t.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#0F1015] text-zinc-400'
                  }`}
                >
                  {typeof t.count === 'number' ? t.count.toLocaleString() : t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected App Scope & Export Actions */}
        <div className="flex items-center gap-2">
          {analyticsData && (
            <div className="flex items-center gap-1.5 bg-[#0F1015] p-1 rounded-2xl border border-white/10">
              <button
                id="btn-export-pdf-report"
                onClick={() =>
                  exportAnalyticsToPDF(
                    analyticsData,
                    selectedAppId === 'ALL' ? 'All Applications' : (activeApp?.name || 'Selected Application'),
                    selectedAppId
                  )
                }
                title="Generate & print branded PDF Analytics Report"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#9333EA] text-zinc-300 hover:text-white text-xs font-bold transition shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-[#C084FC]" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>

              <button
                id="btn-export-csv-report"
                onClick={() =>
                  exportAnalyticsToCSV(
                    analyticsData,
                    selectedAppId === 'ALL' ? 'All Applications' : (activeApp?.name || 'Selected Application'),
                    selectedAppId
                  )
                }
                title="Download raw metrics dataset as CSV"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-600 text-zinc-300 hover:text-white text-xs font-bold transition shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0F1015] border border-white/10 text-xs font-bold text-zinc-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Scope:</span>
            <strong className="text-white truncate max-w-[140px]">
              {selectedAppId === 'ALL' ? 'All Applications' : (activeApp?.name || 'Selected App')}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Top Performing Apps Leaderboard (shown when ALL Apps is selected) */}
      {selectedAppId === 'ALL' && appRankings.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base md:text-lg font-black text-white">Top Performing Apps Leaderboard</h3>
                <p className="text-xs text-zinc-400">Ranked by total real-time downloads and conversion rate</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              {appRankings.length} Apps Tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Rank & App</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Downloads</th>
                  <th className="pb-3">Views</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Conversion (CTR)</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appRankings.map((app, index) => (
                  <tr key={app.appId} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          index === 0
                            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                            : index === 1
                            ? 'bg-zinc-300 text-black'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/5 text-zinc-400'
                        }`}>
                          {index + 1}
                        </span>
                        <img
                          src={app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                          alt={app.appName}
                          className="w-10 h-10 rounded-xl object-cover border border-white/10"
                        />
                        <div>
                          <div className="font-black text-white group-hover:text-[#C084FC] transition text-sm">
                            {app.appName}
                          </div>
                          <div className="font-mono text-zinc-500 text-[10px] truncate max-w-[180px]">
                            {app.packageName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-bold text-[11px]">
                        {app.category}
                      </span>
                    </td>

                    <td className="py-3.5 font-black text-white text-sm">
                      {app.downloads.toLocaleString()}
                    </td>

                    <td className="py-3.5 text-zinc-300 font-mono">
                      {app.views.toLocaleString()}
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{app.rating.toFixed(1)}</span>
                        <span className="text-zinc-500 text-[10px] font-normal">({app.reviewsCount})</span>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-[#0F1015] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#9333EA] to-[#C084FC]"
                            style={{ width: `${Math.min(app.ctr * 2, 100)}%` }}
                          />
                        </div>
                        <span className="font-black text-emerald-400 text-xs">{app.ctr}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => onSelectApp?.(app.appId)}
                        className="px-3 py-1.5 rounded-xl bg-[#9333EA]/20 hover:bg-[#9333EA] text-[#C084FC] hover:text-white text-xs font-bold transition inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Sub-Tab Active View */}
      {subTab === 'DOWNLOADS' && (
        <DownloadAnalyticsTab
          developerApps={developerApps}
          activeApp={activeApp}
          selectedAppId={selectedAppId}
          analyticsData={analyticsData}
          onSelectApp={onSelectApp}
          liveDownloadEvents={downloadEvents}
        />
      )}

      {subTab === 'REVIEWS' && (
        <ReviewsAnalyticsTab
          developerApps={developerApps}
          activeApp={activeApp}
          selectedAppId={selectedAppId}
          analyticsData={analyticsData}
          activeUid={activeUid}
        />
      )}

      {subTab === 'RATINGS' && (
        <RatingsAnalyticsTab
          developerApps={developerApps}
          activeApp={activeApp}
          selectedAppId={selectedAppId}
          analyticsData={analyticsData}
        />
      )}

      {subTab === 'VIEWS' && (
        <ViewsAnalyticsTab
          developerApps={developerApps}
          activeApp={activeApp}
          selectedAppId={selectedAppId}
          analyticsData={analyticsData}
          liveViewEvents={viewEvents}
        />
      )}
    </div>
  );
};
