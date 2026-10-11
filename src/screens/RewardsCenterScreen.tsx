import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Sparkles,
  Gift,
  Tag,
  Copy,
  Check,
  Award,
  Users,
  TrendingUp,
  Download,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Star,
  ChevronRight,
  Flame
} from 'lucide-react';
import {
  getUserRewardAccount,
  getUserRewardHistory,
  getUserCouponBalance,
  claimReward
} from '../services/firestoreService';
import { RewardAccount, RewardHistoryItem, UserCoupon, RewardType } from '../types';

export const RewardsCenterScreen: React.FC = () => {
  const { user, openBillingPurchase, setCurrentTab } = useStore();

  const [account, setAccount] = useState<RewardAccount | null>(null);
  const [history, setHistory] = useState<RewardHistoryItem[]>([]);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FESTIVAL' | 'REFERRAL' | 'COUPONS' | 'DOWNLOADS' | 'DEVELOPER'>('OVERVIEW');

  const userId = user?.id || '';

  const loadRewardsData = async () => {
    setIsLoading(true);
    try {
      const [acc, hist, cps] = await Promise.all([
        getUserRewardAccount(userId),
        getUserRewardHistory(userId),
        getUserCouponBalance(userId)
      ]);
      setAccount(acc);
      setHistory(hist);
      setCoupons(cps);
    } catch (err) {
      console.warn('[RewardsCenter] Data load notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRewardsData();
  }, [userId]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const handleClaim = async (type: RewardType, amount: number, title: string, description: string) => {
    if (!userId) {
      alert('Please sign in to claim rewards.');
      return;
    }

    setIsClaiming(true);
    setClaimMessage(null);
    try {
      await claimReward(userId, type, amount, title, description);
      setClaimMessage(`Successfully claimed +${amount} points for "${title}"!`);
      await loadRewardsData();
    } catch (err: any) {
      alert(err.message || 'Failed to claim reward');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#6750A4] via-[#573F94] to-[#3B296A] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wide uppercase">
            <Gift className="w-3.5 h-3.5 text-amber-300" />
            <span>AVANYX Rewards Center (No Wallet)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Earn Points, Coupons & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-white/80">
            Participate in festival events, reach download milestones, refer creators, and redeem exclusive billing coupons.
          </p>
        </div>

        {/* Live Reward Account Card */}
        <div className="w-full md:w-auto p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between md:flex-col md:items-start gap-4">
          <div>
            <span className="text-[11px] font-bold text-white/70 uppercase">Reward Points Balance</span>
            <div className="text-3xl font-black text-amber-300 flex items-center gap-2 mt-0.5">
              <span>{account?.points?.toLocaleString() || 250}</span>
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <p className="text-[11px] text-white/80 mt-1">
              Tier: <strong className="text-white">{account?.tier || 'EXPLORER'}</strong>
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            Active Member
          </span>
        </div>
      </div>

      {claimMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{claimMessage}</span>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-3 overflow-x-auto">
        {(
          [
            { key: 'OVERVIEW', label: 'Overview & History' },
            { key: 'FESTIVAL', label: 'Festival Rewards' },
            { key: 'REFERRAL', label: 'Referral Rewards' },
            { key: 'COUPONS', label: `Coupon Balance (${coupons.length})` },
            { key: 'DOWNLOADS', label: 'Download Rewards' },
            { key: 'DEVELOPER', label: 'Developer Rewards' }
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB: OVERVIEW & HISTORY */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase">Lifetime Points Earned</span>
              <h3 className="text-2xl font-black text-[#1D1B20] dark:text-white">
                {account?.totalEarned?.toLocaleString() || 250}
              </h3>
              <p className="text-[11px] text-zinc-500">Across all platform activities</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase">Available Coupons</span>
              <h3 className="text-2xl font-black text-[#6750A4] dark:text-[#D0BCFF]">
                {coupons.filter((c) => c.status === 'ACTIVE').length} Active
              </h3>
              <p className="text-[11px] text-zinc-500">Usable in billing checkout</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase">Reward Account Status</span>
              <h3 className="text-2xl font-black text-emerald-500">
                Verified
              </h3>
              <p className="text-[11px] text-zinc-500">Syncing with Firestore</p>
            </div>
          </div>

          {/* Recent History Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6750A4]" />
              <span>Reward Activity & Claim History</span>
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">
                No activity yet. Claim a festival bonus or referral reward above!
              </p>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {history.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF]">
                          {item.rewardType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {item.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-emerald-500">
                        +{item.amount} pts
                      </span>
                      <p className="text-[10px] text-zinc-400">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: FESTIVAL REWARDS */}
      {activeTab === 'FESTIVAL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1D1B20] dark:text-white">
                Diwali Creator Boost 2026
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Seasonal ecosystem celebration grant for active student builders and verified developers.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-extrabold text-amber-500">+250 Points + 50% Coupon</span>
              <button
                onClick={() =>
                  handleClaim('FESTIVAL_REWARD', 250, 'Diwali Creator Boost 2026', 'Festival seasonal bonus')
                }
                disabled={isClaiming}
                className="px-5 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#573F94] text-white text-xs font-bold transition shadow-sm"
              >
                Claim Festival Bonus
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1D1B20] dark:text-white">
                TechFest Campus Grant
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Collegiate innovation grant available for verified students releasing educational open-source projects.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-extrabold text-emerald-500">+150 Points</span>
              <button
                onClick={() =>
                  handleClaim('FESTIVAL_REWARD', 150, 'TechFest Campus Grant', 'Academic community reward')
                }
                disabled={isClaiming}
                className="px-5 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#573F94] text-white text-xs font-bold transition shadow-sm"
              >
                Claim Campus Grant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: REFERRAL REWARDS */}
      {activeTab === 'REFERRAL' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-6 shadow-sm">
          <div>
            <h3 className="text-lg font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6750A4]" />
              <span>Invite Creators & Earn Coupons</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Share your custom invite link with developers and student creators. When they register and publish an app, you both receive 100 points and a ₹50 billing voucher.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase">Your Referral Code</span>
              <div className="font-mono font-black text-lg text-[#6750A4] dark:text-[#D0BCFF]">
                AVX-REF-{userId ? userId.substring(0, 6).toUpperCase() : 'CREATOR'}
              </div>
            </div>

            <button
              onClick={() => handleCopyCode(`AVX-REF-${userId ? userId.substring(0, 6).toUpperCase() : 'CREATOR'}`)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#573F94] text-white text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              {copiedCoupon ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCoupon ? 'Copied Link' : 'Copy Referral Code'}</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() =>
                handleClaim('REFERRAL_REWARD', 100, 'Friend Referral Milestone', 'Earned from active creator invite')
              }
              disabled={isClaiming}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md"
            >
              Simulate Claim Referral Bonus (+100 pts)
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB: COUPON BALANCE */}
      {activeTab === 'COUPONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#6750A4]" />
              <span>Active Billing Coupons ({coupons.length})</span>
            </h3>
            <span className="text-xs text-zinc-400">1-Click Apply in Billing Modal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 text-[10px] font-black uppercase">
                      {coupon.discountPercent ? `${coupon.discountPercent}% OFF` : `₹${coupon.discountAmount} OFF`}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-[#1D1B20] dark:text-white">
                    {coupon.title}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Applicable to paid applications, in-app purchases, and verified developer promotions.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-dashed border-purple-500/30 flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-[#6750A4] dark:text-[#D0BCFF]">
                    {coupon.couponCode}
                  </span>

                  <button
                    onClick={() => handleCopyCode(coupon.couponCode)}
                    className="px-3 py-1.5 rounded-xl bg-[#6750A4] text-white text-xs font-bold hover:bg-[#573F94] flex items-center gap-1.5 transition"
                  >
                    {copiedCoupon === coupon.couponCode ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB: DOWNLOAD REWARDS */}
      {activeTab === 'DOWNLOADS' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#1D1B20] dark:text-white">100 Downloads</h4>
            <p className="text-xs text-zinc-500">Milestone unlocked when your apps reach 100 verified downloads.</p>
            <span className="text-xs font-black text-blue-600 block">+100 Points</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#1D1B20] dark:text-white">1,000 Downloads</h4>
            <p className="text-xs text-zinc-500">Milestone unlocked when your apps reach 1,000 verified downloads.</p>
            <span className="text-xs font-black text-purple-600 block">+500 Points</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#1D1B20] dark:text-white">10,000 Downloads</h4>
            <p className="text-xs text-zinc-500">Elite tier milestone for trending platform applications.</p>
            <span className="text-xs font-black text-amber-600 block">+2,000 Points + Zero-Commission Pass</span>
          </div>
        </div>
      )}

      {/* SUBTAB: DEVELOPER REWARDS */}
      {activeTab === 'DEVELOPER' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#6750A4]" />
            <span>Developer Quality & Integrity Rewards</span>
          </h3>
          <p className="text-xs text-zinc-500">
            Publishers maintaining 4.5+ star ratings, 99%+ security scores, and zero crash reports receive quarterly commission fee discounts and featured spotlight bonuses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>4.8+ High Quality Tier</span>
              </div>
              <p className="text-xs font-semibold text-[#1D1B20] dark:text-white">Platform Fee Rebate: -2%</p>
              <p className="text-[11px] text-zinc-500">Automatically applies to verified publishers</p>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Security Flags</span>
              </div>
              <p className="text-xs font-semibold text-[#1D1B20] dark:text-white">Featured Priority + Free Spotlight</p>
              <p className="text-[11px] text-zinc-500">Rewarded upon 30 consecutive clean days</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
