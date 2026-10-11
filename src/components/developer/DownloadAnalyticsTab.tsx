import React, { useState } from 'react';
import { StoreApp } from '../../types';
import {
  DeveloperRealtimeAnalyticsData
} from './developerTypes';
import {
  Download,
  Globe,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Smartphone,
  Flame,
  Activity,
  Users,
  Compass
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DownloadAnalyticsTabProps {
  developerApps: StoreApp[];
  activeApp?: StoreApp;
  selectedAppId: string;
  analyticsData?: DeveloperRealtimeAnalyticsData;
  onSelectApp?: (appId: string) => void;
  liveDownloadEvents?: any[];
}

export const DownloadAnalyticsTab: React.FC<DownloadAnalyticsTabProps> = ({
  developerApps,
  activeApp,
  selectedAppId,
  analyticsData,
  onSelectApp,
  liveDownloadEvents = []
}) => {
  const [timeRange, setTimeRange] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [viewMode, setViewMode] = useState<'TOTAL' | 'SPLIT'>('TOTAL');

  const downloads = analyticsData?.downloads;
  const totalDownloads = downloads?.totalDownloads ?? (activeApp?.downloadCount || 0);
  const growthRate = downloads?.growthRate ?? 0;
  const isPositiveGrowth = growthRate >= 0;

  // Select dataset based on time range
  let chartData: any[] = [];
  if (timeRange === 'DAILY') {
    chartData = downloads?.daily || [];
  } else if (timeRange === 'WEEKLY') {
    chartData = downloads?.weekly || [];
  } else {
    chartData = downloads?.monthly || [];
  }

  const countries = analyticsData?.countries?.list || [];
  const devices = analyticsData?.devices?.brands || [];
  const androidVersions = analyticsData?.devices?.androidVersions || [];
  const hourlyHeatmap = analyticsData?.hourlyHeatmap || [];
  const activityCalendar = analyticsData?.activityCalendar || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Hero Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#161722] via-[#1A1B28] to-[#12131C] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#9333EA]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Download className="w-4 h-4" />
            <span>Real-time Telemetry & Acquisitions</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Downloads & Acquisition Analytics
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
            Live telemetry stream from Firestore. Tracking organic store discovery, direct APK installations, version upgrades, and global geographic metrics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <div className="flex items-center gap-1 bg-[#0F1015] p-1.5 rounded-2xl border border-white/10">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((r) => (
              <button
                key={r}
                id={`btn-timerange-${r.toLowerCase()}`}
                onClick={() => setTimeRange(r)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  timeRange === r
                    ? 'bg-[#9333EA] text-white shadow-lg shadow-[#9333EA]/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            id="btn-split-toggle"
            onClick={() => setViewMode((prev) => (prev === 'TOTAL' ? 'SPLIT' : 'TOTAL'))}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'SPLIT'
                ? 'bg-[#C084FC]/20 border-[#C084FC]/40 text-[#C084FC]'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{viewMode === 'SPLIT' ? 'Split by Source' : 'Combined Total'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Core Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Installs */}
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-[#9333EA]/40 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Total Installs</span>
            <div className="w-8 h-8 rounded-xl bg-[#9333EA]/20 flex items-center justify-center text-[#C084FC]">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalDownloads.toLocaleString()}</div>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${isPositiveGrowth ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositiveGrowth ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{isPositiveGrowth ? `+${growthRate}%` : `${growthRate}%`} vs prev period</span>
          </div>
        </div>

        {/* KPI 2: Direct Binary / GitHub */}
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-blue-500/40 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Direct Installs</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {downloads?.daily ? downloads.daily.reduce((sum, d) => sum + (d.direct || 0), 0).toLocaleString() : Math.round(totalDownloads * 0.5).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">Direct APK & release mirrors</p>
        </div>

        {/* KPI 3: Store Organic Discovery */}
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-purple-500/40 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Organic Discovery</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-[#C084FC]">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#C084FC]">
            {downloads?.daily ? downloads.daily.reduce((sum, d) => sum + (d.store || 0), 0).toLocaleString() : Math.round(totalDownloads * 0.5).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">AVANYX Store search & featured discovery</p>
        </div>

        {/* KPI 4: Active Devices */}
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-emerald-500/40 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Active Devices</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {devices.length > 0 ? devices.reduce((sum, d) => sum + d.count, 0).toLocaleString() : totalDownloads.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400/80 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified hardware telemetry</span>
          </div>
        </div>
      </div>

      {/* 3. Main Acquisition Velocity Chart */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C084FC]" />
              <h3 className="text-lg font-black text-white">Acquisition Velocity & Trajectory</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Showing {timeRange.toLowerCase()} install progression ({chartData.length} data points)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#A855F7]" />
              <span className="text-zinc-300">Total Installs</span>
            </div>
            {viewMode === 'SPLIT' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-zinc-300">Direct</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300">Store</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'TOTAL' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#9333EA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262738" vertical={false} />
                <XAxis
                  dataKey={timeRange === 'DAILY' ? 'label' : (timeRange === 'WEEKLY' ? 'week' : 'month')}
                  stroke="#71717A"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1F2C',
                    borderColor: '#9333EA',
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  stroke="#C084FC"
                  strokeWidth={3}
                  fill="url(#purpleAreaGrad)"
                  animationDuration={1200}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262738" vertical={false} />
                <XAxis
                  dataKey={timeRange === 'DAILY' ? 'label' : (timeRange === 'WEEKLY' ? 'week' : 'month')}
                  stroke="#71717A"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1F2C',
                    borderColor: '#9333EA',
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="direct" name="Direct Installs" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="store" name="Store Discovery" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Geography & Device Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geographic Installs */}
        <div className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#C084FC]" />
              <h3 className="text-base font-black text-white">Top Geographies</h3>
            </div>
            <span className="text-[11px] font-bold text-zinc-400">{countries.length} regions</span>
          </div>

          <div className="space-y-3 pt-2">
            {countries.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No geographic downloads recorded yet
              </div>
            ) : (
              countries.slice(0, 6).map((c) => (
                <div key={c.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-zinc-200">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-400 text-[11px]">{c.count}</span>
                      <span className="font-bold text-[#C084FC] text-xs">{c.share}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0F1015] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#9333EA] to-[#C084FC]"
                      style={{ width: `${Math.max(c.share, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Device Brand Distribution */}
        <div className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-black text-white">Device OEM Distribution</h3>
            </div>
            <span className="text-[11px] font-bold text-zinc-400">Android hardware</span>
          </div>

          <div className="space-y-3 pt-2">
            {devices.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No device hardware telemetry recorded yet
              </div>
            ) : (
              devices.slice(0, 5).map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200">{d.name}</span>
                    <span className="font-bold text-blue-400 text-xs">{d.share}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0F1015] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                      style={{ width: `${Math.max(d.share, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Android OS Version Adoption */}
        <div className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-black text-white">Android OS Versions</h3>
            </div>
            <span className="text-[11px] font-bold text-zinc-400">API levels</span>
          </div>

          <div className="space-y-3 pt-2">
            {androidVersions.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No Android OS versions recorded yet
              </div>
            ) : (
              androidVersions.slice(0, 5).map((v) => (
                <div key={v.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200">{v.name}</span>
                    <span className="font-bold text-emerald-400 text-xs">{v.share}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0F1015] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400"
                      style={{ width: `${Math.max(v.share, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. 24-Hour Peak Activity Heatmap & 30-Day Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Heatmap */}
        <div className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-black text-white">24-Hour Peak Install Activity</h3>
            </div>
            <span className="text-[11px] font-bold text-zinc-400">UTC / Local Time</span>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyHeatmap}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262738" vertical={false} />
                <XAxis dataKey="label" stroke="#71717A" fontSize={9} tickLine={false} interval={3} />
                <YAxis stroke="#71717A" fontSize={9} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1F2C',
                    borderColor: '#F59E0B',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" name="Installs" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30-Day Activity Calendar */}
        <div className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C084FC]" />
              <h3 className="text-base font-black text-white">30-Day Install Heatmatrix</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-white/5" />
                <span className="w-2.5 h-2.5 rounded bg-[#9333EA]/30" />
                <span className="w-2.5 h-2.5 rounded bg-[#9333EA]/60" />
                <span className="w-2.5 h-2.5 rounded bg-[#9333EA]" />
                <span className="w-2.5 h-2.5 rounded bg-[#C084FC]" />
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-2 pt-3">
            {activityCalendar.map((day) => {
              const bgColors = [
                'bg-white/5 hover:bg-white/10',
                'bg-[#9333EA]/30 hover:bg-[#9333EA]/40',
                'bg-[#9333EA]/60 hover:bg-[#9333EA]/70',
                'bg-[#9333EA] hover:bg-[#A855F7]',
                'bg-[#C084FC] hover:bg-white'
              ];
              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} downloads`}
                  className={`h-7 rounded-lg ${bgColors[day.level]} transition-all cursor-pointer flex items-center justify-center text-[10px] font-bold text-white/90 border border-white/5`}
                >
                  {day.count > 0 ? day.count : ''}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-400 text-center font-medium">
            Daily download frequency heatmap across the last 30 calendar days.
          </p>
        </div>
      </div>

      {/* Live Installs & Downloads Telemetry Feed */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-lg font-black text-white">Live App Downloads Stream</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time telemetry captured via Firestore <code className="font-mono text-emerald-400">downloads</code> onSnapshot listener
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
              {liveDownloadEvents.length} Real-Time Events
            </span>
          </div>
        </div>

        {liveDownloadEvents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0F1015] border border-dashed border-white/10 text-center space-y-2">
            <Download className="w-8 h-8 text-emerald-400/40 mx-auto" />
            <p className="text-sm font-bold text-zinc-300">Real-Time Download Listener Active</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              No recent install events in this session yet. When users install or download published apps, telemetry events stream live directly from Firestore.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {liveDownloadEvents.slice(0, 20).map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="p-3.5 rounded-2xl bg-[#0F1015] border border-white/5 hover:border-emerald-500/30 transition flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">
                      {evt.appName || 'Application Install'}
                    </div>
                    <div className="text-zinc-500 text-[11px] font-mono flex items-center gap-2 truncate">
                      <span>{evt.device || 'Android Device'}</span>
                      {evt.country && (
                        <>
                          <span>•</span>
                          <span>{evt.flag || '🌐'} {evt.country}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
