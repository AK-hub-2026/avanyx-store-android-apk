import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles,
  GraduationCap,
  Terminal,
  Activity,
  ArrowUpRight,
  Download,
  AlertCircle
} from 'lucide-react';
import {
  fetchPayments,
  subscribeToPayments,
  fetchPaymentAnalytics
} from '../../services/firestoreService';
import { PaymentRecord, PaymentAnalyticsSummary } from '../../types';

export const AdminPaymentAnalytics: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [analytics, setAnalytics] = useState<PaymentAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allPayments, stats] = await Promise.all([
        fetchPayments(),
        fetchPaymentAnalytics()
      ]);
      setPayments(allPayments);
      setAnalytics(stats);
    } catch (err) {
      console.warn('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToPayments(() => {
      fetchPaymentAnalytics().then(setAnalytics);
      fetchPayments().then(setPayments);
    });
    return () => unsub();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (typeFilter !== 'ALL' && p.paymentType !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.applicantName || '').toLowerCase().includes(q);
      const matchEmail = (p.userEmail || '').toLowerCase().includes(q);
      const matchToken = (p.applicationToken || '').toLowerCase().includes(q);
      const matchUtr = (p.utr || '').toLowerCase().includes(q);
      const matchType = (p.paymentType || '').toLowerCase().includes(q);

      if (!matchName && !matchEmail && !matchToken && !matchUtr && !matchType) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
              <span>Revenue & Payment Analytics</span>
            </h2>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Real-time revenue, verified transaction metrics, coupon discount totals, and breakdown across Developer, Student, and Promotion payments.
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Metrics
          </button>
        </div>
      </div>

      {/* Main Revenue Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#6750A4] to-[#4F378B] text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-2xl bg-white/20">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-black">
            ₹{analytics?.totalRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-white/80">
            Across all verified payments
          </p>
        </div>

        {/* Daily Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Daily Revenue</span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
            ₹{analytics?.dailyRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-zinc-500">Collected today</p>
        </div>

        {/* Monthly Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Monthly Revenue</span>
            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
            ₹{analytics?.monthlyRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-zinc-500">Current calendar month</p>
        </div>

        {/* Lifetime Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Lifetime Revenue</span>
            <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
            ₹{analytics?.lifetimeRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-zinc-500">All-time verified payments</p>
        </div>

        {/* Developer Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Developer Revenue</span>
            <div className="p-2 rounded-2xl bg-purple-500/10 text-[#6750A4]">
              <Terminal className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
            ₹{analytics?.developerRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-zinc-500">Developer Verification (₹1,626)</p>
        </div>

        {/* Student Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Student Revenue</span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
            ₹{analytics?.studentRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-zinc-500">Student Publishers (₹50)</p>
        </div>

        {/* Promotion Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Promotion Revenue</span>
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
            ₹{analytics?.promotionRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-zinc-500">Banners, Spotlights & Ads</p>
        </div>

        {/* Pending Payments */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pending Payments</span>
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600">
            {analytics?.pendingPaymentsCount || 0} (₹{analytics?.pendingPaymentsAmount || 0})
          </div>
          <p className="text-[11px] text-zinc-500">Awaiting Admin Verification</p>
        </div>

        {/* Verified Payments Count */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Verified Payments</span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600">
            {analytics?.verifiedPaymentsCount || 0}
          </div>
          <p className="text-[11px] text-zinc-500">Confirmed on UPI</p>
        </div>

        {/* Rejected Payments Count */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Rejected Payments</span>
            <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600">
            {analytics?.rejectedPaymentsCount || 0}
          </div>
          <p className="text-[11px] text-zinc-500">Failed / Invalid UTRs</p>
        </div>

        {/* Coupons Used */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Coupons Used</span>
            <div className="p-2 rounded-2xl bg-purple-500/10 text-[#6750A4]">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
            {analytics?.couponsUsedCount || 0}
          </div>
          <p className="text-[11px] text-zinc-500">AVX coupon redemptions</p>
        </div>

        {/* Total Discounts Given */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Discounts Given</span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600">
            ₹{analytics?.totalDiscountsGiven?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-zinc-500">₹200 developer promotional credits</p>
        </div>
      </div>

      {/* Transactions Search & List Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
            Transaction Records ({filteredPayments.length})
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Name, Email, Token, UTR..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
            >
              <option value="ALL">All Payment Types</option>
              <option value="DEVELOPER_VERIFICATION">Developer Verification</option>
              <option value="STUDENT_VERIFICATION">Student Verification</option>
              <option value="BANNER_PROMOTION">Banner Promotion</option>
              <option value="FEATURED_APP_PROMOTION">Featured App</option>
              <option value="CATEGORY_SPOTLIGHT_PROMOTION">Category Spotlight</option>
              <option value="STORE_ADVERTISEMENT_PROMOTION">Store Ad</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 text-zinc-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Applicant / Token</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">UTR Reference</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Coupon</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No transactions match the criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.slice(0, 50).map((p) => (
                  <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-3 text-zinc-500 whitespace-nowrap">
                      {new Date(p.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
                        {p.applicantName}
                      </div>
                      <div className="font-mono text-[10px] text-purple-600 dark:text-purple-400">
                        {p.applicationToken}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-zinc-600 dark:text-zinc-300">
                      {p.verificationType}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-zinc-700 dark:text-zinc-200">
                      {p.utr}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{p.finalAmount}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-purple-700 dark:text-purple-300">
                      {p.couponUsed || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.status === 'PAYMENT_VERIFIED' || p.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : p.status === 'PAYMENT_REJECTED' || p.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-600'
                            : p.status === 'REQUEST_PROOF'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-purple-500/10 text-purple-600 animate-pulse'
                        }`}
                      >
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
