import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  BillingPurchase,
  BillingSubscription,
  RewardHistoryItem,
  UserCoupon,
  StoreApp
} from '../../types';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Tag,
  Gift,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Receipt,
  Users,
  Percent,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import {
  getUserPurchases,
  getUserSubscriptions,
  getDeveloperBillingAnalytics
} from '../../services/billingService';
import {
  getUserRewardHistory,
  getUserCouponBalance,
  getUserRewardAccount
} from '../../services/firestoreService';

interface StudentBillingCenterProps {
  studentApps: StoreApp[];
}

export const StudentBillingCenter: React.FC<StudentBillingCenterProps> = ({ studentApps }) => {
  const { user } = useStore();
  const studentUid = user?.id || '';

  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'SUBSCRIPTIONS' | 'REWARDS' | 'COUPONS' | 'ANALYTICS'>('PURCHASES');

  // Live state
  const [purchases, setPurchases] = useState<BillingPurchase[]>([]);
  const [subscriptions, setSubscriptions] = useState<BillingSubscription[]>([]);
  const [rewardHistory, setRewardHistory] = useState<RewardHistoryItem[]>([]);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [analytics, setAnalytics] = useState<{
    totalRevenue: number;
    totalPurchases: number;
    pendingRevenue: number;
  }>({
    totalRevenue: 0,
    totalPurchases: 0,
    pendingRevenue: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentUid) return;
    setLoading(true);

    const loadBillingData = async () => {
      try {
        const [userPurchases, userSubs, hist, userCoupons, acc, devAnalytics] = await Promise.all([
          getUserPurchases(studentUid),
          getUserSubscriptions(studentUid),
          getUserRewardHistory(studentUid),
          getUserCouponBalance(studentUid),
          getUserRewardAccount(studentUid),
          getDeveloperBillingAnalytics(studentUid)
        ]);

        setPurchases(userPurchases);
        setSubscriptions(userSubs);
        setRewardHistory(hist);
        setCoupons(userCoupons);
        setRewardPoints(acc?.points || 250);
        setAnalytics({
          totalRevenue: devAnalytics.totalRevenue || 0,
          totalPurchases: devAnalytics.totalPurchases || 0,
          pendingRevenue: devAnalytics.pendingRevenue || 0
        });
      } catch (err) {
        console.warn('Error fetching student billing center data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, [studentUid]);

  // Compute estimated gross and net revenue
  const grossEstimate = analytics.totalRevenue;
  const platformFee = Math.round(grossEstimate * 0.1); // 10% standard commission
  const netEstimate = Math.max(0, grossEstimate - platformFee);

  return (
    <div className="space-y-6 animate-fadeIn text-[#1D1B20] dark:text-zinc-100">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#6750A4] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-emerald-200" />
            <span>PART C — Student Billing & Financial Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Billing, Transactions & Revenue Estimates
          </h1>
          <p className="text-xs md:text-sm text-white/90">
            View live purchase history, active coupons, and peer-to-peer transaction statements synced directly with Firestore.
          </p>
        </div>

        {/* Locked Payout Indicator Card (PART C & PART F) */}
        <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 space-y-1.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
            <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Payouts Locked (Student Tier)</span>
          </div>
          <p className="text-[11px] text-white/80 max-w-xs leading-relaxed">
            Direct bank/UPI withdrawals require 18+ Commercial Developer Verification. Your earnings accrue safely.
          </p>
          <div className="pt-1 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
              Accruing in Escrow
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Estimate & Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/15 space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Gross Sales Estimate</span>
          <div className="text-2xl font-black text-[#1D1B20] dark:text-white">₹{grossEstimate}</div>
          <span className="text-[11px] text-zinc-500">From in-app items & plans</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/15 space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Platform Commission (10%)</span>
          <div className="text-2xl font-black text-rose-500">₹{platformFee}</div>
          <span className="text-[11px] text-zinc-500">Standard ecosystem rate</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/15 space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Net Accrued Revenue</span>
          <div className="text-2xl font-black text-emerald-500">₹{netEstimate}</div>
          <span className="text-[11px] text-zinc-500">Ready upon developer verification</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/15 space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Reward Balance</span>
          <div className="text-2xl font-black text-amber-500">{rewardPoints} pts</div>
          <span className="text-[11px] text-zinc-500">Redeemable for coupons</span>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-black/10 dark:border-cyan-500/20 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PURCHASES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'PURCHASES'
              ? 'bg-[#6750A4] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
              : 'text-[#49454F] dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          Purchase History ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('SUBSCRIPTIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'SUBSCRIPTIONS'
              ? 'bg-[#6750A4] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
              : 'text-[#49454F] dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          Subscription History ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('REWARDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'REWARDS'
              ? 'bg-[#6750A4] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
              : 'text-[#49454F] dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          Rewards History ({rewardHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('COUPONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'COUPONS'
              ? 'bg-[#6750A4] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
              : 'text-[#49454F] dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          Coupon History ({coupons.length})
        </button>
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'ANALYTICS'
              ? 'bg-[#6750A4] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
              : 'text-[#49454F] dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          Payment Analytics & Escrow
        </button>
      </div>

      {/* TAB 1: Purchase History */}
      {activeTab === 'PURCHASES' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
              <span>Verified Purchases ({purchases.length})</span>
            </h3>
            <span className="text-xs text-zinc-400">Live from Firestore purchases collection</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading purchase records...</div>
          ) : purchases.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-black/5 dark:bg-[#0B0F17] text-xs text-zinc-500">
              No purchase history found for this account.
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-black/[0.02] dark:bg-[#0B0F17] border border-black/5 dark:border-white/5 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                      ₹
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#1D1B20] dark:text-white truncate">
                          {p.productName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#6750A4]/10 text-[#6750A4] dark:text-cyan-400">
                          {p.productType}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500">
                        Token: {p.purchaseToken.substring(0, 16)}... • UTR: {p.utr || 'Direct Verified'}
                      </p>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-[#1D1B20] dark:text-white block">
                      ₹{p.amount}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        p.paymentStatus === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {p.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1B: Subscription History */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
              <span>Subscription History ({subscriptions.length})</span>
            </h3>
            <span className="text-xs text-zinc-400">Live recurring subscription memberships</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading subscription records...</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-black/5 dark:bg-[#0B0F17] text-xs text-zinc-500">
              No active or previous subscription memberships found.
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-black/[0.02] dark:bg-[#0B0F17] border border-black/5 dark:border-white/5 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#1D1B20] dark:text-white truncate">
                          {s.productName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          {s.billingCycle}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500">
                        Token: {s.lastPurchaseToken ? `${s.lastPurchaseToken.substring(0, 16)}...` : 'AVX-SUB'} • Next renew: {s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString() : 'Active'}
                      </p>
                      <span className="text-[10px] text-zinc-400">
                        Started: {new Date(s.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-[#1D1B20] dark:text-white block">
                      ₹{s.amount}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : s.status === 'PENDING_VERIFICATION'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-zinc-500/10 text-zinc-500'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Rewards History */}
      {activeTab === 'REWARDS' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
              <span>Rewards Audit Trail ({rewardHistory.length})</span>
            </h3>
            <span className="text-xs text-zinc-400">Live reward_history ledger</span>
          </div>

          {rewardHistory.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-black/5 dark:bg-[#0B0F17] text-xs text-zinc-500">
              No rewards events recorded yet. Complete festival challenges or download apps to earn points.
            </div>
          ) : (
            <div className="space-y-3">
              {rewardHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-black/[0.02] dark:bg-[#0B0F17] border border-black/5 dark:border-white/5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#1D1B20] dark:text-white truncate">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">{item.description}</p>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-amber-500">+{item.amount} pts</span>
                    <span className="text-[10px] block font-mono text-zinc-400 uppercase">
                      {item.rewardType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Coupon History */}
      {activeTab === 'COUPONS' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
              <span>Assigned Coupon Balance ({coupons.length})</span>
            </h3>
            <span className="text-xs text-zinc-400">Usable in AVANYX Billing Popup</span>
          </div>

          {coupons.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-black/5 dark:bg-[#0B0F17] text-xs text-zinc-500">
              No personal coupons found. Use code <strong className="text-amber-500">STUDENT100</strong> for ₹100 discount.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                      {c.couponCode}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                      {c.status}
                    </span>
                  </div>
                  <div className="text-lg font-black text-[#1D1B20] dark:text-white">
                    ₹{c.discountAmount} Off
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Expires: {new Date(c.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Payment Analytics & Escrow */}
      {activeTab === 'ANALYTICS' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
                <span>Financial Analytics & Escrow Statement</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Real-time breakdown of gross sales, platform commission deductions, and accrued net balances.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-[#0B0F17] flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#1D1B20] dark:text-white block">Gross In-App & Subscription Revenue</span>
                <span className="text-[11px] text-zinc-500">Total payments submitted and verified</span>
              </div>
              <span className="text-base font-black text-[#1D1B20] dark:text-white">₹{grossEstimate}</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-[#0B0F17] flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-rose-500 block">Platform Commission Fee (10%)</span>
                <span className="text-[11px] text-zinc-500">Automated deduction per commission_settings collection</span>
              </div>
              <span className="text-base font-black text-rose-500">-₹{platformFee}</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block">
                  Net Developer Earnings Accruing in Escrow
                </span>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                  Secured for payout upon verified 18+ commercial onboarding
                </span>
              </div>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{netEstimate}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
