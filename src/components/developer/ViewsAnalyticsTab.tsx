import React from 'react';
import { StoreApp } from '../../types';
import { DeveloperRealtimeAnalyticsData } from './developerTypes';
import {
  Eye,
  Users,
  MousePointerClick,
  Percent,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  Compass,
  Repeat
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ViewsAnalyticsTabProps {
  developerApps: StoreApp[];
  activeApp?: StoreApp;
  selectedAppId: string;
  analyticsData?: DeveloperRealtimeAnalyticsData;
  liveViewEvents?: any[];
}

export const ViewsAnalyticsTab: React.FC<ViewsAnalyticsTabProps> = ({
  developerApps,
  activeApp,
  selectedAppId,
  analyticsData,
  liveViewEvents = []
}) => {
  const views = analyticsData?.views;
  const totalViews = views?.totalViews ?? (typeof activeApp?.viewCount === 'number' ? activeApp.viewCount : 0);
  const uniqueVisitors = views?.uniqueVisitors ?? (totalViews > 0 ? 1 : 0);
  const repeatVisitors = views?.repeatVisitors ?? Math.max(0, totalViews - uniqueVisitors);
  const ctr = views?.ctr ?? 0;
  const dailyViews = views?.dailyViews || [];

  const downloads = analyticsData?.downloads?.totalDownloads ?? (activeApp?.downloadCount || 0);
  const funnelSteps = [
    { name: 'App Detail Page Views', count: totalViews, percent: '100%', color: 'from-blue-500 to-indigo-600' },
    { name: 'Unique Visitors', count: uniqueVisitors, percent: totalViews > 0 ? `${Math.min(100, Math.round((uniqueVisitors / totalViews) * 100))}%` : '0%', color: 'from-[#9333EA] to-purple-600' },
    { name: 'Active Installs Completed', count: downloads, percent: `${ctr}%`, color: 'from-emerald-500 to-teal-400' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Hero Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#161722] via-[#1A1B28] to-[#12131C] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider mb-2">
            <Eye className="w-4 h-4" />
            <span>Store Impressions & Traffic Telemetry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            App Views & Conversion Analytics
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
            Real-time page view counts, unique visitors, repeat traffic, and listing conversion funnel rates across AVANYX Store clients.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black relative z-10">
          <MousePointerClick className="w-4 h-4" />
          <span>Conversion CTR: {ctr}%</span>
        </div>
      </div>

      {/* 2. Top 4 Traffic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Views */}
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-cyan-500/40 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Total Page Views</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalViews.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-xs text-cyan-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Store listing traffic</span>
          </div>
        </div>

        {/* KPI 2: Unique Visitors */}
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-blue-500/40 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Unique Visitors</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-400">{uniqueVisitors.toLocaleString()}</div>
          <p className="text-[11px] text-zinc-400 font-medium">Distinct user accounts</p>
        </div>

        {/* KPI 3: Repeat Visitors */}
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-purple-500/40 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Repeat Visitors</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-[#C084FC]">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#C084FC]">{repeatVisitors.toLocaleString()}</div>
          <p className="text-[11px] text-zinc-400 font-medium">Returning users browsing updates</p>
        </div>

        {/* KPI 4: Conversion Rate (CTR) */}
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2 hover:border-emerald-500/40 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Install Conversion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{ctr}%</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400/90 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>High conversion efficiency</span>
          </div>
        </div>
      </div>

      {/* 3. Daily Views & Impressions Trajectory */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="text-lg font-black text-white">Daily Traffic & Visitor Volume</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Total page impressions vs unique user accounts</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-zinc-300">Total Views</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-zinc-300">Unique Visitors</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyViews}>
              <defs>
                <linearGradient id="cyanViewsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="blueUniqueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262738" vertical={false} />
              <XAxis dataKey="label" stroke="#71717A" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E1F2C',
                  borderColor: '#06B6D4',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#fff'
                }}
              />
              <Area type="monotone" dataKey="views" name="Page Views" stroke="#06B6D4" strokeWidth={3} fill="url(#cyanViewsArea)" />
              <Area type="monotone" dataKey="uniqueVisitors" name="Unique Visitors" stroke="#3B82F6" strokeWidth={2} fill="url(#blueUniqueArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Conversion Funnel Visualizer */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C084FC]" />
            <h3 className="text-lg font-black text-white">Full Store Acquisition Funnel</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Tracking customer journey from initial search impression to completed installation
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {funnelSteps.map((step, index) => (
            <div
              key={step.name}
              className="p-5 rounded-2xl bg-[#0F1015] border border-white/10 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Step {index + 1}</span>
                <span className="font-mono text-white text-xs">{step.percent}</span>
              </div>

              <div className="text-2xl font-black text-white">{step.count.toLocaleString()}</div>
              
              <div className="text-xs font-bold text-zinc-300 truncate">{step.name}</div>

              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${step.color}`}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Live View & Impression Telemetry Feed */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <h3 className="text-lg font-black text-white">Live Store Impression Stream</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time telemetry captured via Firestore <code className="font-mono text-cyan-300">app_views</code> onSnapshot listener
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold font-mono">
              {liveViewEvents.length} Real-Time Events
            </span>
          </div>
        </div>

        {liveViewEvents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0F1015] border border-dashed border-white/10 text-center space-y-2">
            <Eye className="w-8 h-8 text-cyan-400/40 mx-auto" />
            <p className="text-sm font-bold text-zinc-300">Real-Time Impression Listener Active</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              No recent view events in this session yet. As visitors browse published store listings, impressions stream live directly from Firestore.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {liveViewEvents.slice(0, 20).map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="p-3.5 rounded-2xl bg-[#0F1015] border border-white/5 hover:border-cyan-500/30 transition flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">
                      {evt.appName || 'Store Application Page'}
                    </div>
                    <div className="text-zinc-500 text-[11px] font-mono flex items-center gap-2 truncate">
                      <span>{evt.device || 'Web / Android Client'}</span>
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
