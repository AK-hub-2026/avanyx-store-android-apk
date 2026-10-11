import React, { useState, useEffect } from 'react';
import {
  FeaturedBanner,
  StoreApp,
  PromotionRequest
} from '../../types';
import {
  subscribeToAllFeaturedBanners,
  adminSaveFeaturedBanner,
  adminDeleteFeaturedBanner,
  adminToggleBannerStatus,
  adminToggleAppPromotionFlag,
  subscribeToPromotionRequests,
  adminReviewPromotionRequest
} from '../../services/firestoreService';
import {
  Sparkles,
  TrendingUp,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Flame,
  Cpu,
  BarChart3,
  Calendar,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';

interface AdminPromotionManagerProps {
  appsList: StoreApp[];
  onRefreshApps?: () => void;
}

type PromoSubTab = 'REQUESTS' | 'ANALYST' | 'BANNERS' | 'TRENDING' | 'AI_SPOTLIGHT' | 'STUDENT_SPOTLIGHT';

export const AdminPromotionManager: React.FC<AdminPromotionManagerProps> = ({
  appsList,
  onRefreshApps
}) => {
  const [subTab, setSubTab] = useState<PromoSubTab>('REQUESTS');
  const [banners, setBanners] = useState<FeaturedBanner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [promoRequests, setPromoRequests] = useState<PromotionRequest[]>([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const [selectedPromoReq, setSelectedPromoReq] = useState<PromotionRequest | null>(null);
  const [promoActionType, setPromoActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [promoReviewerNotes, setPromoReviewerNotes] = useState('');
  const [promoPriority, setPromoPriority] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal for creating/editing banners
  const [editingBanner, setEditingBanner] = useState<Partial<FeaturedBanner> | null>(null);
  const [isNewBanner, setIsNewBanner] = useState(false);

  // Subscribe to all banners in real-time
  useEffect(() => {
    setBannersLoading(true);
    const unsubscribe = subscribeToAllFeaturedBanners(
      (data) => {
        setBanners(data || []);
        setBannersLoading(false);
      },
      (err) => {
        console.warn('[AdminPromotionManager] Banners listener notice:', err);
        setBannersLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to promotion requests
  useEffect(() => {
    setPromoLoading(true);
    const unsubscribe = subscribeToPromotionRequests(
      (data) => {
        setPromoRequests(data || []);
        setPromoLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Toggle banner active status
  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    setIsProcessing(true);
    try {
      await adminToggleBannerStatus(bannerId, !currentStatus);
      showFeedback(`Banner status updated to ${!currentStatus ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      showFeedback(`Failed to update banner: ${err.message || err}`, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete banner
  const handleDeleteBanner = async (bannerId: string) => {
    if (!window.confirm('Are you sure you want to delete this featured banner?')) return;
    setIsProcessing(true);
    try {
      await adminDeleteFeaturedBanner(bannerId);
      showFeedback('Banner deleted successfully.');
    } catch (err: any) {
      showFeedback(`Failed to delete banner: ${err.message || err}`, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save banner modal
  const handleSaveBannerModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.title?.trim()) {
      showFeedback('Please provide a banner title.', true);
      return;
    }
    setIsProcessing(true);
    try {
      await adminSaveFeaturedBanner({
        ...editingBanner,
        title: editingBanner.title.trim(),
        order: Number(editingBanner.order || editingBanner.displayOrder || 1)
      });
      showFeedback(`Banner "${editingBanner.title}" saved successfully to Firestore.`);
      setEditingBanner(null);
    } catch (err: any) {
      showFeedback(`Failed to save banner: ${err.message || err}`, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle App Promotion flag
  const handleToggleAppFlag = async (
    appId: string,
    flag: 'isTrending' | 'isAiSpotlight' | 'isStudentSpotlight' | 'isFeatured',
    currentVal: boolean
  ) => {
    setIsProcessing(true);
    try {
      await adminToggleAppPromotionFlag(appId, flag, !currentVal);
      showFeedback(`App ${flag} flag toggled to ${!currentVal}.`);
      if (onRefreshApps) onRefreshApps();
    } catch (err: any) {
      showFeedback(`Failed to toggle app promotion flag: ${err.message || err}`, true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewPromoSubmit = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedPromoReq) return;
    setIsProcessing(true);
    try {
      await adminReviewPromotionRequest(
        selectedPromoReq.id,
        status,
        'admin-root',
        promoReviewerNotes,
        Number(promoPriority) || 5
      );
      showFeedback(`Promotion campaign ${status.toLowerCase()} and synchronized with Store Home.`);
      setSelectedPromoReq(null);
      setPromoActionType(null);
      setPromoReviewerNotes('');
    } catch (err: any) {
      showFeedback(`Failed to review promotion campaign: ${err.message || err}`, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered lists
  const pendingPromoCount = promoRequests.filter((r) => r.status === 'PENDING').length;
  const activeBannersCount = banners.filter((b) => b.isActive !== false).length;
  const trendingAppsCount = appsList.filter((a) => a.isTrending).length;
  const aiSpotlightCount = appsList.filter((a) => a.isAiSpotlight || a.category === 'AI_AGENTS').length;
  const studentSpotlightCount = appsList.filter((a) => a.isStudentSpotlight).length;

  const filteredApps = appsList.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      (a.developer || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Feedback Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab('REQUESTS')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shrink-0 ${
            subTab === 'REQUESTS'
              ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/25'
              : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Campaign Submissions ({pendingPromoCount})</span>
        </button>

        <button
          onClick={() => setSubTab('ANALYST')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shrink-0 ${
            subTab === 'ANALYST'
              ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/25'
              : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analyst & Overview</span>
        </button>

        <button
          onClick={() => setSubTab('BANNERS')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shrink-0 ${
            subTab === 'BANNERS'
              ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/25'
              : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Featured Banners ({banners.length})</span>
        </button>

        <button
          onClick={() => setSubTab('TRENDING')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shrink-0 ${
            subTab === 'TRENDING'
              ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/25'
              : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trending Apps ({trendingAppsCount})</span>
        </button>

        <button
          onClick={() => setSubTab('AI_SPOTLIGHT')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shrink-0 ${
            subTab === 'AI_SPOTLIGHT'
              ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/25'
              : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>AI Spotlight ({aiSpotlightCount})</span>
        </button>

        <button
          onClick={() => setSubTab('STUDENT_SPOTLIGHT')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shrink-0 ${
            subTab === 'STUDENT_SPOTLIGHT'
              ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/25'
              : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-cyan-400" />
          <span>Student Spotlight ({studentSpotlightCount})</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 0. DEVELOPER CAMPAIGN SUBMISSIONS QUEUE */}
      {/* ───────────────────────────────────────────────────────────── */}
      {subTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Developer Campaign Submissions Queue
              </h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Review developer requests for Hero Banners, Trending Spotlight, and Category Spotlights. Approvals automatically push live to Store Home.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <span>{promoRequests.length} Total</span>
              <span>•</span>
              <span className="text-amber-500">{pendingPromoCount} Pending</span>
            </div>
          </div>

          {promoLoading ? (
            <div className="py-12 text-center text-xs text-[#49454F] dark:text-[#CAC4D0] animate-pulse">
              Loading campaign requests from Firestore...
            </div>
          ) : promoRequests.length === 0 ? (
            <div className="py-12 text-center rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-2">
              <Sparkles className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm font-bold text-[#1D1B20] dark:text-white">No campaign requests pending</p>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">Developers will submit promotion bids from their console.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {promoRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 overflow-hidden shrink-0 border border-black/10 dark:border-white/10 flex items-center justify-center">
                      {req.appIcon ? (
                        <img src={req.appIcon} alt={`${req.appName || 'Promoted'} App Icon - AVANYX Store`} className="w-full h-full object-cover" />
                      ) : (
                        <Layers className="w-6 h-6 text-zinc-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-[#1D1B20] dark:text-[#E6E1E5]">
                          {req.appName}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : req.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF]">
                          {req.promotionType}
                        </span>
                        {req.isActive && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                            LIVE ON STORE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                        Headline: <span className="font-semibold text-zinc-900 dark:text-white">"{req.headline || req.appName}"</span> • Sub: "{req.subheadline || 'N/A'}"
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Category: {req.targetCategory || 'All'} • Schedule: {req.startDate} to {req.endDate} • Bid: ${req.budgetBid || 0} • Developer: {req.developerName || req.developerUid}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {req.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPromoReq(req);
                            setPromoActionType('APPROVE');
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPromoReq(req);
                            setPromoActionType('REJECT');
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">
                        {req.status === 'APPROVED' ? 'Approved & Deployed' : 'Rejected'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Review Modal */}
          {selectedPromoReq && promoActionType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 p-6 shadow-2xl space-y-4">
                <h4 className="text-base font-black text-[#1D1B20] dark:text-white">
                  {promoActionType === 'APPROVE' ? 'Approve & Push to Store' : 'Reject Campaign'}
                </h4>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  {promoActionType === 'APPROVE'
                    ? `This will approve "${selectedPromoReq.appName}" for ${selectedPromoReq.promotionType} placement and push it live to Store Home immediately.`
                    : `Provide feedback on why "${selectedPromoReq.appName}" promotion campaign is rejected.`}
                </p>

                {promoActionType === 'APPROVE' && (
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                      Display Priority (1 = standard, 10 = top carousel)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={promoPriority}
                      onChange={(e) => setPromoPriority(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                    Editorial Reviewer Notes (Visible to Developer)
                  </label>
                  <textarea
                    rows={3}
                    value={promoReviewerNotes}
                    onChange={(e) => setPromoReviewerNotes(e.target.value)}
                    placeholder={
                      promoActionType === 'APPROVE'
                        ? 'Campaign verified and slotted into top rotation.'
                        : 'Creative asset resolution below guidelines. Please resubmit.'
                    }
                    className="w-full p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedPromoReq(null);
                      setPromoActionType(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={() => handleReviewPromoSubmit(promoActionType === 'APPROVE' ? 'APPROVED' : 'REJECTED')}
                    className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md ${
                      promoActionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : promoActionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. ANALYST & PROMOTION OVERVIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {subTab === 'ANALYST' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
                <span className="text-xs font-bold">Active Hero Banners</span>
                <Layers className="w-4 h-4 text-[#6750A4]" />
              </div>
              <p className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
                {activeBannersCount} / {banners.length}
              </p>
              <span className="text-[10px] text-emerald-500 font-bold">
                Live on AVANYX Home Carousel
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
                <span className="text-xs font-bold">Trending Apps</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
                {trendingAppsCount} Apps
              </p>
              <span className="text-[10px] text-amber-500 font-bold">
                Featured on Store Home & Search
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
                <span className="text-xs font-bold">AI Spotlight Apps</span>
                <Cpu className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
                {aiSpotlightCount} Apps
              </p>
              <span className="text-[10px] text-purple-500 font-bold">
                Curated Autonomous AI Agents
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0]">
                <span className="text-xs font-bold">Student Spotlight</span>
                <GraduationCap className="w-4 h-4 text-cyan-500" />
              </div>
              <p className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
                {studentSpotlightCount} Projects
              </p>
              <span className="text-[10px] text-cyan-500 font-bold">
                Academic & Campus Showcase
              </span>
            </div>
          </div>

          {/* Promotion Policy & Strategy Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#6750A4]/10 via-[#6750A4]/5 to-transparent border border-[#6750A4]/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#6750A4] text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white">
                  AVANYX Store Promotion Governance Engine
                </h3>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  Real-time synchronization with Firestore collections without catalog modification.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-[#18191D]/60 border border-black/5 dark:border-white/5 space-y-1.5">
                <div className="font-black text-[#1D1B20] dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#6750A4]" />
                  <span>Featured Carousel</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
                  Banners stored in <code className="text-[#6750A4]">featured_banners</code> Firestore collection. Displayed in exact order index on Home Screen.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 dark:bg-[#18191D]/60 border border-black/5 dark:border-white/5 space-y-1.5">
                <div className="font-black text-[#1D1B20] dark:text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Dynamic Trending</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
                  Toggling trending modifies only the non-destructive <code className="text-amber-500">isTrending</code> flag on verified Firestore apps.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 dark:bg-[#18191D]/60 border border-black/5 dark:border-white/5 space-y-1.5">
                <div className="font-black text-[#1D1B20] dark:text-white flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-cyan-500" />
                  <span>Student Incubator</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
                  Spotlight verified student projects to university communities and tech recruiters worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. FEATURED BANNERS MANAGEMENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {subTab === 'BANNERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white">
                Homepage Hero Banners ({banners.length})
              </h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Manage active carousel slides, badge annotations, and deep-link destinations.
              </p>
            </div>

            <button
              onClick={() => {
                setIsNewBanner(true);
                setEditingBanner({
                  id: `banner_${Date.now()}`,
                  title: '',
                  subtitle: '',
                  bannerImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
                  badgeText: 'Spotlight',
                  ctaText: 'Explore',
                  isActive: true,
                  displayOrder: banners.length + 1
                });
              }}
              className="px-4 py-2 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-[#6750A4]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Banner</span>
            </button>
          </div>

          {bannersLoading ? (
            <div className="p-8 text-center text-xs text-zinc-400">Loading live Firestore banners...</div>
          ) : banners.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#1E1F23] rounded-2xl border border-black/5 dark:border-white/5 text-zinc-400 text-xs">
              No featured banners found in Firestore. Click "Add Banner" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 overflow-hidden flex flex-col justify-between shadow-sm"
                >
                  {/* Banner Image Preview */}
                  <div className="relative h-36 bg-zinc-800 overflow-hidden">
                    <img
                      src={banner.bannerImageUrl || banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-wider">
                      {banner.badgeText || 'Featured'}
                    </span>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <h4 className="text-sm font-extrabold text-white truncate">{banner.title}</h4>
                      {banner.subtitle && (
                        <p className="text-[11px] text-zinc-300 truncate">{banner.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Details & Actions */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Order: #{banner.displayOrder || banner.order || 1}</span>
                      <span className={banner.isActive !== false ? 'text-emerald-500 font-bold' : 'text-zinc-500 font-bold'}>
                        {banner.isActive !== false ? '● Live' : '○ Disabled'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-black/5 dark:border-white/5">
                      <button
                        onClick={() => handleToggleBanner(banner.id, banner.isActive !== false)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          banner.isActive !== false
                            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                        }`}
                        title={banner.isActive !== false ? 'Hide from homepage' : 'Show on homepage'}
                      >
                        {banner.isActive !== false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{banner.isActive !== false ? 'Disable' : 'Enable'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsNewBanner(false);
                          setEditingBanner({ ...banner });
                        }}
                        className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. TRENDING APPS MANAGEMENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {subTab === 'TRENDING' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white">
                Trending Applications ({trendingAppsCount} active)
              </h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Toggle which applications display under the "Trending Apps" section on Home Screen.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps by name..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 text-xs text-[#1D1B20] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="w-10 h-10 rounded-xl object-cover border border-black/5 dark:border-white/5 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-[#1D1B20] dark:text-white truncate">
                      {app.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {app.category} • {app.developer}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAppFlag(app.id, 'isTrending', !!app.isTrending)}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shrink-0 ${
                    app.isTrending
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{app.isTrending ? 'Trending' : 'Add'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. AI SPOTLIGHT MANAGEMENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {subTab === 'AI_SPOTLIGHT' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white">
                AI Spotlight & Autonomous Copilots ({aiSpotlightCount} active)
              </h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Curate intelligent assistants, models, and neural productivity tools featured in the AI Spotlight.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 text-xs text-[#1D1B20] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredApps.map((app) => {
              const isAi = app.isAiSpotlight || app.category === 'AI_AGENTS';
              return (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-10 h-10 rounded-xl object-cover border border-black/5 dark:border-white/5 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-[#1D1B20] dark:text-white truncate">
                        {app.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {app.category} • {app.developer}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAppFlag(app.id, 'isAiSpotlight', !!app.isAiSpotlight)}
                    disabled={isProcessing}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shrink-0 ${
                      app.isAiSpotlight
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                        : 'bg-black/5 dark:bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{app.isAiSpotlight ? 'Spotlight' : 'Add'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. STUDENT SPOTLIGHT MANAGEMENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {subTab === 'STUDENT_SPOTLIGHT' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white">
                Student Spotlight Incubator ({studentSpotlightCount} active)
              </h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Promote verified student developer builds and academic campus tools for community testing.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 text-xs text-[#1D1B20] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="w-10 h-10 rounded-xl object-cover border border-black/5 dark:border-white/5 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-[#1D1B20] dark:text-white truncate">
                      {app.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {app.category} • {app.developer}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAppFlag(app.id, 'isStudentSpotlight', !!app.isStudentSpotlight)}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shrink-0 ${
                    app.isStudentSpotlight
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{app.isStudentSpotlight ? 'Featured' : 'Feature'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* BANNER EDIT / CREATE MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#18191D] border border-black/10 dark:border-white/10 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white">
                {isNewBanner ? 'Create Homepage Featured Banner' : 'Edit Featured Banner'}
              </h3>
              <button
                onClick={() => setEditingBanner(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBannerModal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-400 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={editingBanner.title || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  placeholder="e.g. AVANYX Store v3.0 Release"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 mb-1">Subtitle / Slogan</label>
                <input
                  type="text"
                  value={editingBanner.subtitle || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  placeholder="e.g. Next-Gen Android Ecosystem"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 mb-1">Banner Image URL *</label>
                <input
                  type="url"
                  required
                  value={editingBanner.bannerImageUrl || editingBanner.imageUrl || ''}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      bannerImageUrl: e.target.value,
                      imageUrl: e.target.value
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Badge Annotation</label>
                  <input
                    type="text"
                    value={editingBanner.badgeText || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badgeText: e.target.value })}
                    placeholder="e.g. Official, Trending, AI"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Button Call to Action</label>
                  <input
                    type="text"
                    value={editingBanner.ctaText || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                    placeholder="e.g. Get Started, Install"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Target App ID (Optional)</label>
                  <select
                    value={editingBanner.targetAppId || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, targetAppId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-white focus:outline-none"
                  >
                    <option value="">None (Custom Link)</option>
                    {appsList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={editingBanner.displayOrder || editingBanner.order || 1}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        displayOrder: parseInt(e.target.value, 10) || 1,
                        order: parseInt(e.target.value, 10) || 1
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="pt-2">
                <label className="block font-bold text-zinc-400 mb-1">Live Card Preview</label>
                <div className="relative h-28 rounded-2xl bg-zinc-800 overflow-hidden border border-white/10">
                  <img
                    src={editingBanner.bannerImageUrl || editingBanner.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white/20 text-[9px] font-bold text-white uppercase">
                    {editingBanner.badgeText || 'Badge'}
                  </span>
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">{editingBanner.title || 'Banner Title'}</h5>
                      <p className="text-[10px] text-zinc-300">{editingBanner.subtitle || 'Subtitle preview'}</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-[#6750A4] text-[10px] font-extrabold text-white">
                      {editingBanner.ctaText || 'Open'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-extrabold shadow-md shadow-[#6750A4]/25 flex items-center gap-1.5"
                >
                  {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save to Firestore</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
