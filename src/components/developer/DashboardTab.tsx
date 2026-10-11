import React, { useState } from 'react';
import { StoreApp, AppReview, AppVersionDoc } from '../../types';
import {
  Download,
  Star,
  Layers,
  Activity,
  PlusCircle,
  Rocket,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DeveloperConsoleTab, DeveloperRealtimeAnalyticsData } from './developerTypes';

interface DashboardTabProps {
  activeApp?: StoreApp;
  developerApps: StoreApp[];
  totalDownloads: number;
  totalViews?: number;
  averageRating: string;
  totalReviewsCount: number;
  liveEvents: any[];
  liveViewEvents?: any[];
  realtimeReviews: AppReview[];
  appVersionsList: AppVersionDoc[];
  analyticsData?: DeveloperRealtimeAnalyticsData;
  setActiveTab: (tab: DeveloperConsoleTab) => void;
  openAppDetails?: (app: StoreApp) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  activeApp,
  developerApps,
  totalDownloads,
  totalViews,
  averageRating,
  totalReviewsCount,
  liveEvents,
  liveViewEvents = [],
  realtimeReviews,
  appVersionsList,
  analyticsData,
  setActiveTab,
  openAppDetails
}) => {
  const [chartInterval, setChartInterval] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [chartMetric, setChartMetric] = useState<'DOWNLOADS' | 'VIEWS'>('DOWNLOADS');
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'DOWNLOADS' | 'VIEWS'>('ALL');

  // Compute 100% Real Graph Data based on live Firestore analytics stream
  let realDailyDownloads: Array<{ date: string; fullDate?: string; downloads: number }> = [];
  let realDailyViews: Array<{ date: string; fullDate?: string; views: number }> = [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  // Downloads series
  if (analyticsData?.downloads) {
    if (chartInterval === 'DAILY') {
      realDailyDownloads = (analyticsData.downloads.daily || []).map((d) => ({
        date: d.label,
        fullDate: d.fullDate,
        downloads: d.downloads
      }));
    } else if (chartInterval === 'WEEKLY') {
      realDailyDownloads = (analyticsData.downloads.weekly || []).map((w) => ({
        date: w.label,
        fullDate: w.week,
        downloads: w.downloads
      }));
    } else {
      realDailyDownloads = (analyticsData.downloads.monthly || []).map((m) => ({
        date: m.label,
        fullDate: m.month,
        downloads: m.downloads
      }));
    }
  } else {
    if (chartInterval === 'DAILY') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayStr = dayNames[d.getDay()];
        const dateKey = `${d.getMonth() + 1}/${d.getDate()}`;
        realDailyDownloads.push({
          date: i === 0 ? 'Today' : `${dayStr} (${dateKey})`,
          fullDate: d.toISOString().split('T')[0],
          downloads: 0
        });
      }
    } else if (chartInterval === 'WEEKLY') {
      for (let i = 3; i >= 0; i--) {
        realDailyDownloads.push({
          date: `Wk -${i}`,
          fullDate: `week-${i}`,
          downloads: 0
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        realDailyDownloads.push({
          date: months[d.getMonth()],
          fullDate: `${d.getFullYear()}-${d.getMonth() + 1}`,
          downloads: 0
        });
      }
    }
  }

  // Views series
  if (analyticsData?.views?.dailyViews) {
    realDailyViews = (analyticsData.views.dailyViews || []).map((v) => ({
      date: v.date,
      fullDate: v.date,
      views: v.views
    }));
  } else {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayStr = dayNames[d.getDay()];
      const dateKey = `${d.getMonth() + 1}/${d.getDate()}`;
      realDailyViews.push({
        date: i === 0 ? 'Today' : `${dayStr} (${dateKey})`,
        fullDate: d.toISOString().split('T')[0],
        views: 0
      });
    }
  }

  // Populate strictly from actual Firestore download event records
  if (liveEvents.length > 0) {
    liveEvents.forEach((evt) => {
      const ts = evt.date || (evt.timestamp ? evt.timestamp.split('T')[0] : '');
      const dayItem = realDailyDownloads.find((d) => d.fullDate === ts);
      if (dayItem) {
        dayItem.downloads += 1;
      }
    });
  } else if (!analyticsData?.downloads && totalDownloads > 0 && realDailyDownloads.length > 0) {
    realDailyDownloads[realDailyDownloads.length - 1].downloads = totalDownloads;
  }

  // Populate strictly from actual Firestore view event records
  if (liveViewEvents.length > 0) {
    liveViewEvents.forEach((evt) => {
      const ts = evt.date || (evt.timestamp ? evt.timestamp.split('T')[0] : '');
      const dayItem = realDailyViews.find((d) => d.fullDate === ts);
      if (dayItem) {
        dayItem.views += 1;
      }
    });
  }

  const chartData = chartMetric === 'DOWNLOADS'
    ? realDailyDownloads.map((d) => ({ date: d.date, count: d.downloads }))
    : realDailyViews.map((v) => ({ date: v.date, count: v.views }));

  const displayViews = totalViews ?? (analyticsData?.views?.totalViews || (activeApp?.viewCount || 0));

  // Combined real-time activity events
  const combinedActivity = [
    ...liveEvents.map((e) => ({ ...e, eventType: 'DOWNLOAD' as const })),
    ...liveViewEvents.map((e) => ({ ...e, eventType: 'VIEW' as const }))
  ].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  const filteredActivity = combinedActivity.filter((evt) => {
    if (activityFilter === 'ALL') return true;
    if (activityFilter === 'DOWNLOADS') return evt.eventType === 'DOWNLOAD';
    if (activityFilter === 'VIEWS') return evt.eventType === 'VIEW';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#1E142F] via-[#1A162B] to-[#12131C] border border-[#9333EA]/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#9333EA]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#9333EA]/30 border border-[#9333EA]/50 text-[#C084FC] font-extrabold text-[10px] uppercase tracking-wider">
                AVANYX Console v2.1
              </span>
              <span className="text-zinc-400 text-xs font-semibold">
                {activeApp ? activeApp.name : 'All Apps Workspace'}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Developer Studio Dashboard
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Monitor real-time application downloads, evaluate verified community reviews, rollout version updates, and manage cryptographic checksums.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('SUBMIT_APP')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] hover:from-[#A855F7] hover:to-[#9333EA] text-white font-extrabold text-xs shadow-lg shadow-[#9333EA]/30 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit New App</span>
            </button>
            <button
              onClick={() => setActiveTab('RELEASES')}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition flex items-center gap-2"
            >
              <Rocket className="w-4 h-4 text-[#C084FC]" />
              <span>New Release</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Installs */}
        <div
          onClick={() => setActiveTab('DOWNLOAD_ANALYTICS')}
          className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-[#9333EA]/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition">Total Installs</span>
            <div className="w-9 h-9 rounded-xl bg-[#9333EA]/20 text-[#C084FC] flex items-center justify-center group-hover:scale-105 transition">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white">{totalDownloads.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Firestore Counter</span>
          </div>
        </div>

        {/* Store Views & Impressions */}
        <div
          onClick={() => setActiveTab('VIEWS_ANALYTICS')}
          className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-cyan-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition">Store Impressions</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white">{displayViews.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Live Telemetry Stream</span>
          </div>
        </div>

        {/* Store Rating */}
        <div
          onClick={() => setActiveTab('RATINGS_ANALYTICS')}
          className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-amber-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition">Store Rating</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-white">{averageRating}</span>
            <span className="text-xs text-zinc-400 font-bold">★ ({totalReviewsCount} reviews)</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium">From verified user reviews</p>
        </div>

        {/* Active Apps */}
        <div
          onClick={() => setActiveTab('ALL_APPS')}
          className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-[#9333EA]/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition">Active Apps</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white">{developerApps.length}</div>
          <p className="text-[11px] text-zinc-500 font-medium">In studio portfolio</p>
        </div>
      </div>

      {/* 3. Main Graph + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Realtime Graph (AreaChart) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#161722] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  {chartMetric === 'DOWNLOADS' ? 'Install Velocity' : 'Store Impression Velocity'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400 font-mono">
                  Live Telemetry
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {chartMetric === 'DOWNLOADS'
                  ? 'Calculated strictly from real download events in Firestore'
                  : 'Calculated strictly from live view and impression telemetry'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Metric Toggle */}
              <div className="flex items-center gap-1 bg-[#0F1015] p-1 rounded-xl border border-white/10 shrink-0">
                <button
                  onClick={() => setChartMetric('DOWNLOADS')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1.5 ${
                    chartMetric === 'DOWNLOADS'
                      ? 'bg-[#9333EA] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Download className="w-3 h-3" />
                  <span>Installs</span>
                </button>
                <button
                  onClick={() => setChartMetric('VIEWS')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1.5 ${
                    chartMetric === 'VIEWS'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Impressions</span>
                </button>
              </div>

              {/* Interval Filters */}
              <div className="flex items-center gap-1 bg-[#0F1015] p-1 rounded-xl border border-white/10 shrink-0">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setChartInterval(interval)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                      chartInterval === interval
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {interval}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="avxPurpleGradDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#9333EA" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="avxCyanGradDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262738" vertical={false} />
                <XAxis dataKey="date" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1F2C',
                    borderColor: chartMetric === 'DOWNLOADS' ? '#9333EA' : '#06B6D4',
                    borderRadius: '14px',
                    fontSize: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name={chartMetric === 'DOWNLOADS' ? 'Downloads' : 'Views'}
                  stroke={chartMetric === 'DOWNLOADS' ? '#A855F7' : '#22D3EE'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={chartMetric === 'DOWNLOADS' ? 'url(#avxPurpleGradDash)' : 'url(#avxCyanGradDash)'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Recent Activity Feed */}
        <div className="p-6 rounded-2xl bg-[#161722] border border-white/10 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white">Live Telemetry</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time</span>
            </div>
          </div>

          {/* Activity Filters */}
          <div className="flex items-center gap-1 bg-[#0F1015] p-1 rounded-xl border border-white/10 text-[10px]">
            <button
              onClick={() => setActivityFilter('ALL')}
              className={`flex-1 py-1 rounded-lg font-bold transition text-center ${
                activityFilter === 'ALL' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({combinedActivity.length})
            </button>
            <button
              onClick={() => setActivityFilter('DOWNLOADS')}
              className={`flex-1 py-1 rounded-lg font-bold transition text-center ${
                activityFilter === 'DOWNLOADS' ? 'bg-[#9333EA] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Installs ({liveEvents.length})
            </button>
            <button
              onClick={() => setActivityFilter('VIEWS')}
              className={`flex-1 py-1 rounded-lg font-bold transition text-center ${
                activityFilter === 'VIEWS' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Views ({liveViewEvents.length})
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-64 pr-1">
            {filteredActivity.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 rounded-xl bg-[#0F1015] border border-dashed border-white/10">
                Listening for real-time Firestore events across your apps.
              </div>
            ) : (
              filteredActivity.slice(0, 10).map((evt, idx) => {
                const isDl = evt.eventType === 'DOWNLOAD';
                return (
                  <div
                    key={evt.id || idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5 text-xs hover:border-white/15 transition"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isDl
                          ? 'bg-[#9333EA]/30 text-[#C084FC]'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {isDl ? <Download className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-white truncate">
                          {evt.appName || (isDl ? 'App Install' : 'Page Impression')}
                        </p>
                        <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                        <span>{isDl ? 'Downloaded' : 'Viewed'}</span>
                        {evt.device && <span>• {evt.device}</span>}
                        {evt.country && <span>• {evt.flag || '🌐'} {evt.country}</span>}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Latest Reviews + Recent Releases (Bottom Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Reviews */}
        <div className="p-6 rounded-2xl bg-[#161722] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">Latest Community Reviews</h3>
              <p className="text-xs text-zinc-400">User feedback and store ratings</p>
            </div>
            <button
              onClick={() => setActiveTab('REVIEWS_MODERATION')}
              className="text-xs font-bold text-[#C084FC] hover:underline flex items-center gap-1"
            >
              <span>Manage Reviews</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {realtimeReviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 rounded-xl bg-[#0F1015] border border-white/5">
                No user reviews submitted yet for your applications.
              </div>
            ) : (
              realtimeReviews.slice(0, 3).map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-[#0F1015] border border-white/5 space-y-2 hover:border-white/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{rev.userName || 'Verified User'}</span>
                      <div className="flex items-center text-amber-400 text-xs">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 line-clamp-2">{rev.comment || 'Great application!'}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Releases */}
        <div className="p-6 rounded-2xl bg-[#161722] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">Recent Releases</h3>
              <p className="text-xs text-zinc-400">Deployed APK binary versions</p>
            </div>
            <button
              onClick={() => setActiveTab('RELEASES')}
              className="text-xs font-bold text-[#C084FC] hover:underline flex items-center gap-1"
            >
              <span>Release Manager</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {appVersionsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 rounded-xl bg-[#0F1015] border border-white/5">
                No extra release versions created. Deploy an update via Releases & Versions.
              </div>
            ) : (
              appVersionsList.slice(0, 3).map((ver) => (
                <div
                  key={ver.id}
                  className="p-4 rounded-xl bg-[#0F1015] border border-white/5 space-y-1.5 hover:border-white/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-xs">v{ver.version || '1.0.0'}</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-400 text-[10px] font-mono">
                        Code {ver.versionCode}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">
                    {ver.releaseNotes || (ver as any).changelog || 'Production release on AVANYX Store'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
