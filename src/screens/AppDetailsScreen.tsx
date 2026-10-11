import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Download,
  Check,
  Share2,
  Lock,
  Trash2,
  ExternalLink,
  Copy,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Layers,
  Sparkles,
  MessageSquare,
  CornerDownRight,
  Flag,
  Edit3,
  Send,
  Calendar,
  Code,
  HardDrive,
  Info,
  Loader2
} from 'lucide-react';
import { AppReview, BillingProduct } from '../types';
import { AvanyxIdentityAvatar } from '../components/identity';
import { AVANYX } from '../sdk/avanyxBillingSdk';
import { getBillingProductsByApp } from '../services/billingService';
import {
  fetchAppReviews,
  submitAppReview,
  deleteAppReview,
  reportAppReview,
  recordAppView
} from '../services/firestoreService';

export const AppDetailsScreen: React.FC = () => {
  const {
    selectedApp,
    closeAppDetails,
    openDeveloperProfile,
    downloadApp,
    uninstallApp,
    downloads,
    user,
    isAuthenticated,
    setCurrentTab,
    appsLoading
  } = useStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Reviews & Rating State
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [appProducts, setAppProducts] = useState<BillingProduct[]>([]);
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [reportedReviews, setReportedReviews] = useState<{ [id: string]: boolean }>({});

  // Touch swipe state for lightbox
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Fetch reviews for this app
  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      if (!selectedApp?.id) return;
      setReviewsLoading(true);
      try {
        const fetched = await fetchAppReviews(selectedApp.id);
        if (isMounted) {
          setReviews(fetched);
          // Check if current user already reviewed
          if (user?.id) {
            const myReview = fetched.find((r) => r.userId === user.id);
            if (myReview) {
              setUserRating(myReview.rating);
              setReviewTitle(myReview.title || '');
              setReviewComment(myReview.comment || '');
            }
          }
        }
      } catch (err) {
        console.warn('[AppDetailsScreen] Error loading reviews:', err);
      } finally {
        if (isMounted) setReviewsLoading(false);
      }
    }

    loadReviews();

    // Load In-App Products & Subscriptions for this App
    if (selectedApp?.id) {
      getBillingProductsByApp(selectedApp.id)
        .then((prods) => {
          if (isMounted) setAppProducts(prods);
        })
        .catch((e) => console.warn('Products load notice:', e));
    }

    return () => {
      isMounted = false;
    };
  }, [selectedApp?.id, user?.id]);

  // Requirement 5: Every app page open writes an app_view event
  useEffect(() => {
    if (selectedApp?.id) {
      recordAppView(selectedApp.id, selectedApp.name, selectedApp.developerUid, user?.id);
    }
  }, [selectedApp?.id, selectedApp?.name, selectedApp?.developerUid, user?.id]);

  // Resolve screenshot list (ensure at least 1 image or fallback)
  const resolvedScreenshots: string[] =
    selectedApp?.screenshots && selectedApp.screenshots.length > 0
      ? selectedApp.screenshots
      : (selectedApp ? [selectedApp.bannerUrl || selectedApp.iconUrl] : []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = selectedApp
        ? `https://store-avanyx.pages.dev/app/${selectedApp.id}`
        : window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyHash = () => {
    if (selectedApp?.sha256Checksum) {
      navigator.clipboard.writeText(selectedApp.sha256Checksum);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2500);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (!user?.id) {
      alert('Please sign in or use an active session to submit a review.');
      return;
    }
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const newReview = await submitAppReview({
        appId: selectedApp.id,
        userId: user.id,
        userName: user.name || user.email.split('@')[0] || 'Store User',
        userAvatarUrl: user.avatarUrl,
        rating: userRating,
        title: reviewTitle,
        comment: reviewComment
      });

      setReviews((prev) => [newReview, ...prev.filter((r) => r.userId !== user.id)]);
      setReviewSuccess(true);
      setEditingReview(false);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteMyReview = async () => {
    if (!selectedApp || !user?.id || !window.confirm('Are you sure you want to remove your review?')) return;
    try {
      await deleteAppReview(selectedApp.id, user.id);
      setReviews((prev) => prev.filter((r) => r.userId !== user.id));
      setReviewComment('');
      setReviewTitle('');
      setUserRating(5);
      setEditingReview(false);
    } catch (err) {
      console.warn('Error deleting review:', err);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    try {
      await reportAppReview(reviewId, user?.id, 'Flagged by community user');
      setReportedReviews((prev) => ({ ...prev, [reviewId]: true }));
    } catch (err) {
      console.warn('Error reporting review:', err);
    }
  };

  const activeDownload = selectedApp ? downloads.find((d) => d.appId === selectedApp.id) : undefined;
  const isDownloading = activeDownload && activeDownload.status === 'DOWNLOADING';
  const myExistingReview = user?.id ? reviews.find((r) => r.userId === user.id) : undefined;

  // Compute rating breakdown
  const totalReviewsCount = reviews.length;
  const ratingCounts: { [star: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.max(1, Math.min(5, Math.round(r.rating)));
    ratingCounts[star] = (ratingCounts[star] || 0) + 1;
  });

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null || resolvedScreenshots.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev === 0 ? resolvedScreenshots.length - 1 : prev - 1) : 0
        );
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev === resolvedScreenshots.length - 1 ? 0 : prev + 1) : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, resolvedScreenshots.length]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      setLightboxIndex((prev) =>
        prev !== null ? (prev === resolvedScreenshots.length - 1 ? 0 : prev + 1) : 0
      );
    } else if (distance < -minSwipeDistance) {
      setLightboxIndex((prev) =>
        prev !== null ? (prev === 0 ? resolvedScreenshots.length - 1 : prev - 1) : 0
      );
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!selectedApp) {
    if (appsLoading) {
      return (
        <div className="w-full min-h-[40vh] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#18191D] rounded-3xl border border-black/10 dark:border-white/10 my-6 space-y-3">
          <Loader2 className="w-8 h-8 text-[#6750A4] dark:text-[#D0BCFF] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#1D1B20] dark:text-white">Loading Application Details...</p>
        </div>
      );
    }
    return (
      <div className="w-full min-h-[40vh] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#18191D] rounded-3xl border border-black/10 dark:border-white/10 my-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF] flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#1D1B20] dark:text-white">
          No published apps available
        </h3>
        <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-sm">
          The requested application is not available or has not been published to the store.
        </p>
        <button
          onClick={closeAppDetails}
          className="mt-2 px-4 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold"
        >
          Return to Store
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Back Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          id="btn-back-to-store"
          onClick={closeAppDetails}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </button>

        <div className="flex items-center gap-2">
          {copiedLink && (
            <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1 animate-fadeIn">
              <Check className="w-3.5 h-3.5" /> Link copied
            </span>
          )}
          <button
            id="btn-share-app"
            onClick={handleCopyLink}
            className="p-2 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white transition-colors"
            title="Share Application Link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Banner — Matched to Home Featured Layout with 1024:500 ratio and cover */}
      <div className="relative w-full aspect-[1024/500] max-h-[380px] rounded-[24px] overflow-hidden shadow-xl bg-[#1E1F23] border border-black/5 dark:border-white/5 group">
        <img
          src={selectedApp.bannerUrl || selectedApp.iconUrl}
          alt={`${selectedApp.name} Feature Banner - AVANYX Store`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Security badge overlay */}
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>AVANYX Verified</span>
        </div>
      </div>

      {/* App Header Info & Unified Download Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10 sm:-mt-14 px-4 relative z-10">
        <div className="flex items-end gap-4">
          <img
            src={selectedApp.iconUrl}
            alt={`${selectedApp.name} Application Icon - AVANYX Store`}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-white dark:ring-[#121316] shadow-2xl bg-white dark:bg-[#1E1F23]"
            referrerPolicy="no-referrer"
          />
          <div className="pb-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
              {selectedApp.name}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-xs text-[#49454F] dark:text-[#CAC4D0] font-medium">
                Developer:
              </span>
              <button
                onClick={() => openDeveloperProfile(selectedApp.developerUid || selectedApp.developer)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] hover:underline bg-[#6750A4]/10 dark:bg-[#D0BCFF]/10 px-2.5 py-0.5 rounded-lg transition"
                title="View Public Developer Profile"
              >
                <span>{selectedApp.developer}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#6750A4] dark:text-[#D0BCFF]" />
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-[11px] font-mono text-[#49454F] dark:text-[#CAC4D0]">
                {selectedApp.packageName} • v{selectedApp.version || '1.0.0'}
              </p>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                (selectedApp.appType === 'PAID' || selectedApp.price > 0)
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : selectedApp.appType === 'IN_APP_PURCHASE'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  : selectedApp.appType === 'SUBSCRIPTION'
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                  : selectedApp.appType === 'FREE_WITH_PREMIUM'
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {(selectedApp.appType === 'PAID' || selectedApp.price > 0) ? `PAID ₹${selectedApp.price || 99}` : (selectedApp.appType || 'FREE')}
              </span>
            </div>
          </div>
        </div>

        {/* Unified Download APK Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedApp.isInstalled ? (
            <>
              <button
                id="btn-open-installed-app"
                className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-[#6750A4] text-white font-bold text-xs shadow-md hover:bg-[#573F94] transition"
              >
                Open Application
              </button>
              <button
                id="btn-uninstall-app"
                onClick={() => uninstallApp(selectedApp.id)}
                className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition"
                title="Uninstall Application"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              id="btn-download-apk"
              onClick={() => downloadApp(selectedApp)}
              disabled={isDownloading}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                isDownloading
                  ? 'bg-amber-500 text-white animate-pulse'
                  : (selectedApp.appType === 'PAID' || selectedApp.price > 0)
                  ? 'bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white'
                  : 'bg-[#6750A4] hover:bg-[#573F94] active:scale-[0.98] text-white'
              }`}
              title="Download APK package safely via native background manager"
            >
              {isDownloading ? (
                `Downloading ${activeDownload?.progress}% • ${activeDownload?.speed || ''}`
              ) : (
                <>
                  <Download className="w-4 h-4" /> Install / Get ({selectedApp.apkSize})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 text-center">
        <div>
          <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold block">Rating</span>
          <span className="text-sm font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center justify-center gap-1 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {selectedApp.rating}
            <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-normal">({reviews.length || selectedApp.reviewCount})</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold block">Downloads</span>
          <span className="text-sm font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] mt-0.5 block">
            {selectedApp.downloads}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold block">APK Size</span>
          <span className="text-sm font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] mt-0.5 block">
            {selectedApp.apkSize}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold block">Security Scan</span>
          <span className="text-sm font-extrabold text-emerald-500 flex items-center justify-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5" /> {selectedApp.securityScore}% Clean
          </span>
        </div>
      </div>

      {/* App Screenshots Gallery (Horizontal Scroll + Lightbox Modal) */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
            <h3 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
              Screenshots & Interface Preview
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0]">
            {resolvedScreenshots.length} Preview{resolvedScreenshots.length > 1 ? 's' : ''} • Tap to expand
          </span>
        </div>

        {/* Horizontal Scroll Gallery */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-[#6750A4]/20 hover:scrollbar-thumb-[#6750A4]/40 scrollbar-track-transparent">
          {resolvedScreenshots.map((imgUrl, idx) => (
            <div
              key={idx}
              onClick={() => setLightboxIndex(idx)}
              className="relative flex-shrink-0 w-40 sm:w-48 h-64 sm:h-72 rounded-2xl overflow-hidden bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
            >
              <img
                src={imgUrl}
                alt={`${selectedApp.name} screenshot ${idx + 1}`}
                className="w-full h-full object-contain p-1.5 bg-[#0E0F12]"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="p-2 rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                #{idx + 1}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fullscreen Lightbox Image Viewer */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between z-20 text-white">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold font-mono">
                {lightboxIndex + 1} / {resolvedScreenshots.length}
              </span>
              <span className="text-xs font-bold text-white/80 hidden sm:inline">
                {selectedApp.name} Screenshots
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close Fullscreen Viewer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Stage Image & Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center w-full max-h-[78vh] py-2">
            {resolvedScreenshots.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev === 0 ? resolvedScreenshots.length - 1 : prev - 1) : 0
                  );
                }}
                className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition shadow-lg"
                title="Previous Screenshot (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden rounded-2xl">
              <img
                src={resolvedScreenshots[lightboxIndex]}
                alt={`${selectedApp.name} expanded screenshot ${lightboxIndex + 1}`}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            </div>

            {resolvedScreenshots.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev === resolvedScreenshots.length - 1 ? 0 : prev + 1) : 0
                  );
                }}
                className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition shadow-lg"
                title="Next Screenshot (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Selector Strip */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-20 scrollbar-none">
            {resolvedScreenshots.map((thumb, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className={`relative w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden transition-all shrink-0 border-2 ${
                  lightboxIndex === idx
                    ? 'border-[#D0BCFF] scale-105 shadow-lg opacity-100 ring-2 ring-[#D0BCFF]/50'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img
                  src={thumb}
                  alt={`${selectedApp.name} screenshot thumbnail ${idx + 1} - AVANYX Store`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Security Verification & Hash Certificate */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
        <div className="flex items-center justify-between gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" /> AVANYX Cryptographic Signature Certificate
          </div>
          {copiedHash && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-300 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" /> Checksum Copied!
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 bg-black/5 dark:bg-black/30 p-2.5 rounded-xl">
          <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] font-mono break-all flex-1">
            SHA-256: {selectedApp.sha256Checksum}
          </p>
          <button
            onClick={handleCopyHash}
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-emerald-600 dark:text-emerald-400 shrink-0 transition-colors"
            title="Copy SHA-256 Checksum"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description & Features */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-3">
        <h3 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">About this App</h3>
        <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed whitespace-pre-line">
          {selectedApp.fullDescription || selectedApp.description}
        </p>

        {selectedApp.features && selectedApp.features.length > 0 && (
          <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
            <h4 className="font-bold text-xs text-[#1D1B20] dark:text-[#E6E1E5]">Key Features:</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#49454F] dark:text-[#CAC4D0]">
              {selectedApp.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-3 flex flex-wrap gap-2 border-t border-black/5 dark:border-white/5">
          {selectedApp.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-[#F3EDF7] dark:bg-[#121316] text-[#6750A4] dark:text-[#D0BCFF] text-[10px] font-bold"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Ratings & Real Reviews Section */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-[#E6E1E5]">
              Ratings & Reviews
            </h3>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Verified feedback from genuine AVANYX Store users.
            </p>
          </div>
        </div>

        {/* Rating Breakdown Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center p-4 rounded-2xl bg-black/5 dark:bg-black/20">
          <div className="sm:col-span-4 text-center sm:text-left flex flex-col items-center sm:items-start justify-center">
            <span className="text-4xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
              {selectedApp.rating}
            </span>
            <div className="flex items-center gap-1 my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(selectedApp.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#49454F] dark:text-[#CAC4D0] font-medium">
              {totalReviewsCount || selectedApp.reviewCount} verified reviews
            </span>
          </div>

          <div className="sm:col-span-8 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingCounts[star] || 0;
              const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : star === 5 ? 85 : 5;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-3 text-right font-bold text-[#49454F] dark:text-[#CAC4D0]">{star}</span>
                  <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Review Submission / Edit Box */}
        {!isAuthenticated || !user?.id ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1E1B26] to-[#121118] border border-[#6750A4]/30 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#6750A4]/20 border border-[#6750A4]/40 flex items-center justify-center text-[#D0BCFF]">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>Sign In to Leave a Review</span>
                </h4>
                <p className="text-[11px] text-[#CAC4D0]">
                  User reviews, star ratings, and verified developer feedback are saved to your account via Firebase Authentication.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                closeAppDetails();
                setCurrentTab('LOGIN');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/login');
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] hover:from-[#A855F7] text-white text-xs font-black shadow-md shadow-purple-500/20 transition-all shrink-0 cursor-pointer"
            >
              Sign In to Review &rarr;
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#F3EDF7]/50 dark:bg-[#121316]/50 border border-[#6750A4]/20 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-[#1D1B20] dark:text-[#E6E1E5]">
                {myExistingReview && !editingReview ? 'Your Published Review' : 'Rate & Write a Review'}
              </h4>
              {myExistingReview && !editingReview && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingReview(true)}
                    className="text-xs text-[#6750A4] dark:text-[#D0BCFF] font-bold hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={handleDeleteMyReview}
                    className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>

            {myExistingReview && !editingReview ? (
              <div className="p-3 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-1.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= myExistingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                  {myExistingReview.title && (
                    <span className="text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] ml-2">
                      {myExistingReview.title}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">{myExistingReview.comment}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                {/* Interactive Star Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#49454F] dark:text-[#CAC4D0] font-medium">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating !== null ? hoverRating : userRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 hover:scale-125 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF]">
                    {userRating} Star{userRating > 1 ? 's' : ''}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Review Headline / Summary (Optional)"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />

                <textarea
                  placeholder="Tell others what you like or how this app can improve..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />

                <div className="flex items-center justify-between pt-1">
                  {editingReview && (
                    <button
                      type="button"
                      onClick={() => setEditingReview(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  )}
                  {reviewSuccess && (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Review published to Firestore!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    className="ml-auto px-5 py-2 rounded-xl bg-[#6750A4] hover:bg-[#573F94] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4 pt-2">
          {reviewsLoading ? (
            <div className="text-center py-6 text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Loading verified reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 rounded-2xl bg-black/5 dark:bg-white/5 text-xs text-[#49454F] dark:text-[#CAC4D0] space-y-1">
              <MessageSquare className="w-6 h-6 mx-auto opacity-40 mb-2" />
              <p className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">Be the first to review this application!</p>
              <p>Download and share your thoughts to help other users and developers.</p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-2.5 transition shadow-sm hover:shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.userAvatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(rev.userName)}`}
                      alt={`${rev.userName} - AVANYX Verified Reviewer Avatar`}
                      className="w-8 h-8 rounded-full object-cover bg-black/5"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
                          {rev.userName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                          Verified User
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReportReview(rev.id)}
                    className="text-[#49454F] dark:text-[#CAC4D0] hover:text-rose-500 p-1 transition"
                    title="Report spam or inappropriate content"
                  >
                    {reportedReviews[rev.id] ? (
                      <span className="text-[10px] text-rose-500 font-bold">Reported</span>
                    ) : (
                      <Flag className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {rev.title && (
                  <h5 className="text-xs font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] pt-0.5">
                    {rev.title}
                  </h5>
                )}

                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                  {rev.comment}
                </p>

                {/* Developer Official Reply Box */}
                {rev.developerReply && (
                  <div className="mt-2.5 p-3 rounded-xl bg-[#F3EDF7] dark:bg-[#121316] border border-[#6750A4]/15 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#6750A4] dark:text-[#D0BCFF]">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Developer Response ({selectedApp.developer})</span>
                      <span className="text-[10px] font-normal opacity-70 ml-auto">
                        {new Date(rev.developerReply.repliedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] pl-5 leading-relaxed">
                      {rev.developerReply.text}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
