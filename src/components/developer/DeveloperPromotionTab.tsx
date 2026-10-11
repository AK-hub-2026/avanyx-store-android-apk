import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { StoreApp, PromotionRequest, PromotionType } from '../../types';
import {
  submitPromotionRequest,
  subscribeToPromotionRequests
} from '../../services/firestoreService';

interface DeveloperPromotionTabProps {
  developerUid: string;
  developerApps: StoreApp[];
  onNavigateToApp?: (appId: string) => void;
}

export const DeveloperPromotionTab: React.FC<DeveloperPromotionTabProps> = ({
  developerUid,
  developerApps,
  onNavigateToApp
}) => {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [selectedAppId, setSelectedAppId] = useState<string>(developerApps[0]?.id || '');
  const [promotionType, setPromotionType] = useState<PromotionType>('HERO_BANNER');
  const [targetCategory, setTargetCategory] = useState<string>('GAMES');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [bannerAssetUrl, setBannerAssetUrl] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [budgetBid, setBudgetBid] = useState<number>(50);

  // Live subscription to promotion requests
  useEffect(() => {
    if (!developerUid) return;
    setLoading(true);
    const unsub = subscribeToPromotionRequests((list) => {
      setRequests(list);
      setLoading(false);
    }, developerUid);
    return () => unsub();
  }, [developerUid]);

  const selectedApp = developerApps.find((a) => a.id === selectedAppId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) {
      setFeedback({ message: 'Please select an application to promote', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await submitPromotionRequest({
        developerUid,
        developerName: selectedApp.developer || 'Studio Developer',
        appId: selectedApp.id,
        appName: selectedApp.name,
        appIcon: selectedApp.iconUrl,
        promotionType,
        targetCategory,
        headline: headline.trim() || selectedApp.name,
        subheadline: subheadline.trim() || selectedApp.description,
        bannerAssetUrl: bannerAssetUrl.trim() || selectedApp.bannerUrl || selectedApp.iconUrl,
        startDate,
        endDate,
        budgetBid: Number(budgetBid) || 0,
        priority: 5
      });
      setFeedback({ message: 'Promotion campaign submitted for editorial review!', type: 'success' });
      setIsModalOpen(false);
      // Reset form fields
      setHeadline('');
      setSubheadline('');
      setBannerAssetUrl('');
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to submit campaign request', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const activeCount = requests.filter((r) => r.status === 'APPROVED' && r.isActive).length;
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div id="developer-promotion-tab" className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-[#12131C] p-6 lg:p-8 border border-purple-800/30 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Promotion & Growth Manager
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              Amplify Your App Reach
            </h1>
            <p className="text-sm text-zinc-300">
              Submit placement bids for Store Home Hero Banners, Trending Spotlight, and Category Featured Cards. Real-time telemetry tracks impressions and download conversion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-new-promotion-request"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#9333EA] hover:bg-[#8025d4] text-white text-xs font-black transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Feedback notice */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#1E1F2C] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Active Placements</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeCount}</div>
          <p className="text-[11px] text-zinc-500">Live across AVANYX Store</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#1E1F2C] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{pendingCount}</div>
          <p className="text-[11px] text-zinc-500">Awaiting editorial check</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#1E1F2C] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Campaigns</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{requests.length}</div>
          <p className="text-[11px] text-zinc-500">Historical & present submissions</p>
        </div>
      </div>

      {/* Campaign List */}
      <div className="rounded-3xl bg-[#1E1F2C] border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Your Promotion Campaigns
          </h2>
          <span className="text-xs text-zinc-400">{requests.length} Submissions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-xs animate-pulse">
            Loading promotion telemetry...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 text-zinc-500 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-zinc-300">No campaigns launched yet</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Boost downloads by requesting a Featured Hero Banner or Trending spotlight for your apps.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-bold transition-all"
            >
              Create First Campaign
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {requests.map((req) => (
              <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-black/40 overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                    {req.appIcon ? (
                      <img src={req.appIcon} alt={`${req.appName || 'Campaign'} App Icon - AVANYX Store`} className="w-full h-full object-cover" />
                    ) : (
                      <Layers className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{req.appName}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : req.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {req.status}
                      </span>
                      {req.isActive && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Type: <span className="font-bold text-zinc-300">{req.promotionType}</span> • Target: <span className="text-zinc-300">{req.targetCategory || 'Home'}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Schedule: {req.startDate} to {req.endDate} • Bid: ${req.budgetBid || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  {req.reviewerNotes && (
                    <span className="text-[11px] text-zinc-400 italic max-w-xs truncate">
                      "{req.reviewerNotes}"
                    </span>
                  )}
                  {onNavigateToApp && (
                    <button
                      onClick={() => onNavigateToApp(req.appId)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-all"
                      title="View App Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#1E1F2C] border border-white/10 p-6 lg:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Create Promotion Campaign</h3>
                <p className="text-xs text-zinc-400">Request high-impact editorial placement on AVANYX Store</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* App Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Target Application</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-purple-500"
                  required
                >
                  {developerApps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} ({app.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Promotion Type */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPromotionType('HERO_BANNER')}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    promotionType === 'HERO_BANNER'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-black">Hero Banner</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Store Home Carousel</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPromotionType('TRENDING')}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    promotionType === 'TRENDING'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-black">Trending Boost</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Sponsored row top badge</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPromotionType('CATEGORY_SPOTLIGHT')}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    promotionType === 'CATEGORY_SPOTLIGHT'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-black">Category Spotlight</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Top of category feed</div>
                </button>
              </div>

              {/* Target Category */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Target Category</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-purple-500"
                >
                  <option value="GAMES">Games</option>
                  <option value="TOOLS">Tools & Utilities</option>
                  <option value="AI">AI & Machine Learning</option>
                  <option value="PRODUCTIVITY">Productivity</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="FINANCE">Finance</option>
                  <option value="SOCIAL">Social</option>
                  <option value="SECURITY">Security</option>
                </select>
              </div>

              {/* Headline & Subheadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">Campaign Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder={selectedApp?.name || 'e.g. Next-Gen Experience'}
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">Campaign Subheadline</label>
                  <input
                    type="text"
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    placeholder="e.g. Download today with exclusive features"
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Banner Asset URL */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  High-Res Banner Asset URL (1920x1080 or 1200x630)
                </label>
                <input
                  type="url"
                  value={bannerAssetUrl}
                  onChange={(e) => setBannerAssetUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Schedule and Bid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">Placement Bid ($)</label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={budgetBid}
                    onChange={(e) => setBudgetBid(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-[#9333EA] hover:bg-[#8025d4] disabled:opacity-50 text-white text-xs font-black transition-all shadow-md flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
