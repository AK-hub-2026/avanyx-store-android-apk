import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreApp, PromotionRequest, PromotionType } from '../../types';
import {
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
  Tag,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Award,
  ShieldCheck,
  Zap,
  ShoppingBag
} from 'lucide-react';
import {
  submitPromotionRequest,
  subscribeToPromotionRequests
} from '../../services/firestoreService';

interface StudentPromotionCenterProps {
  studentApps: StoreApp[];
}

interface PromotionTier {
  id: string;
  type: PromotionType;
  title: string;
  categoryTag: string;
  price: number;
  durationDays: number;
  description: string;
  benefits: string[];
  isFestival?: boolean;
}

const PROMOTION_TIERS: PromotionTier[] = [
  {
    id: 'promo_banner',
    type: 'HERO_BANNER',
    title: 'Banner Promotion',
    categoryTag: 'HERO_SPOTLIGHT',
    price: 499,
    durationDays: 7,
    description: 'Prominent carousel banner right at the top of AVANYX Store home feed.',
    benefits: ['Top of Home Page spotlight', 'High-visibility 1200x500 banner', 'Up to 5,000+ daily impressions']
  },
  {
    id: 'promo_featured',
    type: 'FEATURED_APP',
    title: 'Featured App Promotion',
    categoryTag: 'FEATURED_GRID',
    price: 299,
    durationDays: 7,
    description: 'Special badge and pinned position in the Featured Spotlight grid.',
    benefits: ['Pinned in Featured grid', 'Exclusive "Promoted Creator" badge', 'Direct one-tap installs']
  },
  {
    id: 'promo_category',
    type: 'CATEGORY_SPOTLIGHT',
    title: 'Category Spotlight',
    categoryTag: 'CATEGORY_HEADER',
    price: 199,
    durationDays: 7,
    description: 'Pinned top placement within your specific app/game category section.',
    benefits: ['Header banner in category', 'Targeted subject-matter traffic', 'Enhanced search priority']
  },
  {
    id: 'promo_festival',
    type: 'FESTIVAL_SPECIAL',
    title: 'Festival Promotion',
    categoryTag: 'FESTIVAL_SPECIAL',
    price: 399,
    durationDays: 14,
    description: 'Special seasonal feature during Diwali, Durga Puja, and New Year holidays.',
    benefits: ['Diwali, Durga Puja & New Year theme', 'Extended 14-day duration', 'Special Festival Rewards boost'],
    isFestival: true
  }
];

export const StudentPromotionCenter: React.FC<StudentPromotionCenterProps> = ({ studentApps }) => {
  const { user, openBillingPurchase } = useStore();
  const studentUid = user?.id || '';

  const [campaigns, setCampaigns] = useState<PromotionRequest[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Selected booking state
  const [selectedTier, setSelectedTier] = useState<PromotionTier>(PROMOTION_TIERS[0]);
  const [selectedAppId, setSelectedAppId] = useState<string>(studentApps[0]?.id || '');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [bannerAssetUrl, setBannerAssetUrl] = useState('');
  const [festivalEvent, setFestivalEvent] = useState<'DIWALI' | 'DURGA_PUJA' | 'NEW_YEAR'>('DIWALI');

  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Live subscribe to promotions
  useEffect(() => {
    if (!studentUid) return;
    setLoadingCampaigns(true);
    const unsub = subscribeToPromotionRequests((list) => {
      setCampaigns(list);
      setLoadingCampaigns(false);
    }, studentUid);
    return () => unsub();
  }, [studentUid]);

  const selectedApp = studentApps.find((a) => a.id === selectedAppId) || studentApps[0];

  const handleLaunchCampaign = () => {
    if (!selectedApp) {
      alert('Please upload or select an application first to run a promotion campaign.');
      return;
    }

    const campaignTitle = selectedTier.isFestival
      ? `${festivalEvent} Festival Promotion: ${selectedApp.name}`
      : `${selectedTier.title}: ${selectedApp.name}`;

    // Open AVANYX Billing Popup to pay for promotion campaign
    openBillingPurchase({
      productId: `promo_${selectedTier.id}_${selectedApp.id}`,
      productName: campaignTitle,
      price: selectedTier.price,
      type: 'IN_APP',
      appId: selectedApp.id,
      appName: selectedApp.name,
      developerUid: studentUid,
      developerName: user?.name || 'Student Creator',
      description: selectedTier.description,
      iconUrl: selectedApp.iconUrl,
      onCallback: async (res) => {
        if (res.status === 'SUCCESS' || res.status === 'PENDING_VERIFICATION') {
          try {
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date(Date.now() + selectedTier.durationDays * 86400000)
              .toISOString()
              .split('T')[0];

            await submitPromotionRequest({
              developerUid: studentUid,
              developerName: user?.name || 'Student Creator Pro',
              appId: selectedApp.id,
              appName: selectedApp.name,
              appIcon: selectedApp.iconUrl,
              promotionType: selectedTier.type,
              targetCategory: selectedApp.category || 'EDUCATION',
              headline: headline.trim() || `${selectedTier.title} - ${selectedApp.name}`,
              subheadline: subheadline.trim() || selectedApp.description,
              bannerAssetUrl: bannerAssetUrl.trim() || selectedApp.bannerUrl || selectedApp.iconUrl,
              startDate,
              endDate,
              budgetBid: selectedTier.price,
              priority: selectedTier.isFestival ? 10 : 8
            });

            setBookingSuccess(
              `Promotion order placed! Verification token: ${res.purchaseToken || 'AVX-PROMO'}. Campaign active after editorial sync.`
            );
          } catch (err: any) {
            console.error('Failed to submit promotion request to Firestore:', err);
          }
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn text-[#1D1B20] dark:text-zinc-100">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#6750A4] via-[#5A409A] to-[#422D77] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>PART B — Student Promotion Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Amplify Your App to Campus & Community
          </h1>
          <p className="text-xs md:text-sm text-white/80">
            Promote your student projects across hero banners, category spotlights, and festival specials with AVANYX Billing Popup integration.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0 w-full md:w-auto">
          <span className="text-[10px] uppercase font-bold text-white/70 block">Active Student Campaigns</span>
          <span className="text-2xl font-black text-amber-300 block mt-0.5">
            {campaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'APPROVED').length}
          </span>
          <span className="text-[11px] text-emerald-300 font-semibold mt-1 inline-block">
            {campaigns.length} Total Booked
          </span>
        </div>
      </div>

      {bookingSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* Promotion Packages Grid (PART B) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
            <span>Select Promotion Campaign Tier</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            All campaigns use the official AVANYX Billing Popup with real UPI, QR codes, and student coupon support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROMOTION_TIERS.map((tier) => {
            const isSelected = selectedTier.id === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-[#6750A4]/10 dark:bg-cyan-500/10 border-[#6750A4] dark:border-cyan-400 shadow-md ring-2 ring-[#6750A4]/30'
                    : 'bg-white dark:bg-[#131926] border-black/10 dark:border-cyan-500/15 hover:border-[#6750A4]/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        tier.isFestival
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-[#6750A4]/15 dark:bg-cyan-500/20 text-[#6750A4] dark:text-cyan-300'
                      }`}
                    >
                      {tier.isFestival ? 'Festival Season' : `${tier.durationDays} Days`}
                    </span>
                    <span className="text-base font-black text-[#1D1B20] dark:text-white">
                      ₹{tier.price}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#1D1B20] dark:text-white flex items-center gap-1.5">
                      {tier.isFestival && <Flame className="w-4 h-4 text-amber-500" />}
                      <span>{tier.title}</span>
                    </h4>
                    <p className="text-xs text-[#49454F] dark:text-zinc-400 mt-1 line-clamp-2">
                      {tier.description}
                    </p>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-zinc-600 dark:text-zinc-300">
                    {tier.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isSelected
                      ? 'bg-[#6750A4] text-white dark:bg-cyan-500 dark:text-slate-950 shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-white hover:bg-black/10'
                  }`}
                >
                  {isSelected ? 'Selected Package' : 'Choose Package'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Form Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
              <span>Configure & Launch Campaign: {selectedTier.title}</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Review banner parameters before launching the AVANYX Billing Popup.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 block font-semibold">Total Package Price</span>
            <span className="text-xl font-black text-[#6750A4] dark:text-cyan-400">₹{selectedTier.price}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Select Project to Promote *
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs font-bold text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
            >
              {studentApps.length === 0 ? (
                <option value="">No published apps available</option>
              ) : (
                studentApps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.packageName})
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedTier.isFestival && (
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Festival Theme Season *
              </label>
              <select
                value={festivalEvent}
                onChange={(e) => setFestivalEvent(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs font-bold text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
              >
                <option value="DIWALI">Diwali Mega Festival Promotion</option>
                <option value="DURGA_PUJA">Durga Puja Festive Spotlight</option>
                <option value="NEW_YEAR">New Year Campus Kickoff Special</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Campaign Headline (Catchy Title)
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={selectedApp ? `Try ${selectedApp.name} on AVANYX!` : 'Explore Next-Gen Student Innovation'}
              className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Custom Banner Asset URL (Optional)
            </label>
            <input
              type="url"
              value={bannerAssetUrl}
              onChange={(e) => setBannerAssetUrl(e.target.value)}
              placeholder={selectedApp?.bannerUrl || 'https://images.unsplash.com/...'}
              className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Payment supported via PhonePe, Google Pay, Paytm, BHIM, and student coupon codes.
          </span>
          <button
            onClick={handleLaunchCampaign}
            disabled={studentApps.length === 0}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6750A4] to-[#5A409A] hover:from-[#5A409A] hover:to-[#422D77] text-white font-extrabold text-xs shadow-lg shadow-[#6750A4]/25 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Launch with AVANYX Billing (₹{selectedTier.price})</span>
          </button>
        </div>
      </div>

      {/* Campaign History Table */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
            <span>Student Campaign History ({campaigns.length})</span>
          </h3>
          <span className="text-xs text-zinc-400">Synced live from Firestore</span>
        </div>

        {loadingCampaigns ? (
          <div className="p-8 text-center text-xs text-zinc-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-black/5 dark:bg-[#0B0F17] text-xs text-zinc-500">
            No promotion campaigns booked yet. Select a promotion package above to boost your app's downloads!
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-black/[0.02] dark:bg-[#0B0F17] border border-black/5 dark:border-white/5 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={req.appIcon}
                    alt={req.appName}
                    className="w-10 h-10 rounded-xl object-cover border border-black/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[#1D1B20] dark:text-white truncate">
                        {req.appName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#6750A4]/10 text-[#6750A4] dark:text-cyan-400">
                        {req.promotionType}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">{req.headline}</p>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {req.startDate} → {req.endDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-[#1D1B20] dark:text-white block">
                      ₹{req.budgetBid}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        req.status === 'ACTIVE' || req.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
