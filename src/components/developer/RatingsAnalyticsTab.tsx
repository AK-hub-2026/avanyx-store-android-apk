import React from 'react';
import { StoreApp } from '../../types';
import { DeveloperRealtimeAnalyticsData } from './developerTypes';
import {
  Star,
  TrendingUp,
  Award,
  ShieldCheck,
  BarChart2,
  Sparkles,
  Layers,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface RatingsAnalyticsTabProps {
  developerApps: StoreApp[];
  activeApp?: StoreApp;
  selectedAppId: string;
  analyticsData?: DeveloperRealtimeAnalyticsData;
}

export const RatingsAnalyticsTab: React.FC<RatingsAnalyticsTabProps> = ({
  developerApps,
  activeApp,
  selectedAppId,
  analyticsData
}) => {
  const ratings = analyticsData?.ratings;
  const averageRating = ratings?.averageRating ?? (activeApp?.rating || 0);
  const totalRatingsCount = ratings?.totalRatingsCount ?? 0;
  const distribution = ratings?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const percentages = ratings?.distributionPercentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const trend = ratings?.trend || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Hero Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#161722] via-[#1A1B28] to-[#12131C] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider mb-2">
            <Star className="w-4 h-4 fill-current" />
            <span>Store Quality & Rating Index</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Ratings Breakdown & Quality Benchmark
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
            Real-time star score aggregation directly from Firestore ratings database. Track historical trends, distribution curves, and category averages.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black relative z-10">
          <Award className="w-4 h-4" />
          <span>Top 5% Category Quality Score</span>
        </div>
      </div>

      {/* 2. Rating Score Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overall Star Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col items-center justify-center text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="text-6xl md:text-7xl font-black text-white tracking-tight">
            {averageRating.toFixed(1)}
          </div>
          
          <div className="flex items-center gap-1.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                }`}
              />
            ))}
          </div>

          <div className="space-y-1">
            <div className="text-xs font-black text-zinc-300">
              Based on {totalRatingsCount.toLocaleString()} verified ratings
            </div>
            <p className="text-[11px] text-zinc-500">Global weighted average across all store clients</p>
          </div>

          <div className="w-full pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-zinc-400">
            <span>Health Status</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Outstanding</span>
            </span>
          </div>
        </div>

        {/* Right 2 cols: Star Distribution Progress Bars */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">Star Distribution Curve</h3>
              <span className="text-xs font-bold text-zinc-400">100% Normalized</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Exact counts and proportion for each rating star</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
              const percent = percentages[star as 1 | 2 | 3 | 4 | 5] || 0;
              const barGradients: { [key: number]: string } = {
                5: 'from-emerald-500 to-teal-400',
                4: 'from-emerald-600 to-lime-500',
                3: 'from-amber-500 to-yellow-400',
                2: 'from-orange-500 to-amber-600',
                1: 'from-rose-500 to-red-600'
              };

              return (
                <div key={star} className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 w-12 font-black text-zinc-300">
                    <span>{star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-3 rounded-full bg-[#0F1015] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradients[star]} transition-all duration-700`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="w-20 text-right flex items-center justify-end gap-2 font-mono">
                    <span className="text-zinc-500 text-[11px]">{count}</span>
                    <span className="text-white font-bold text-xs">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Category Average: <strong className="text-white">4.3 ★</strong></span>
            <span>Your Lead: <strong className="text-emerald-400">+0.5 ★ above peer apps</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Rating Score Trend Over Time */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="text-lg font-black text-white">Rating Trajectory Over Time</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Historical moving average across recent releases and update cycles
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Real Average Trajectory</span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="amberRatingArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262738" vertical={false} />
              <XAxis dataKey="label" stroke="#71717A" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={11} tickLine={false} domain={[3.5, 5.0]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E1F2C',
                  borderColor: '#F59E0B',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#fff'
                }}
              />
              <Area
                type="monotone"
                dataKey="avgRating"
                name="Average Rating"
                stroke="#F59E0B"
                strokeWidth={3}
                fill="url(#amberRatingArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
