import React, { useState, useEffect } from 'react';
import { User, DeveloperProfile, DeveloperApplication } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Share2,
  Sparkles,
  BadgeCheck,
  FileText,
  KeyRound,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  subscribeToDeveloperVerification,
  fetchDraftVerificationByUserId
} from '../../services/firestoreService';
import { useStore } from '../../context/StoreContext';

interface VerificationQueueTabProps {
  user: User;
  activeUid: string;
  developerProfile?: DeveloperProfile | null;
}

export const VerificationQueueTab: React.FC<VerificationQueueTabProps> = ({
  user,
  activeUid,
  developerProfile
}) => {
  const { setCurrentTab } = useStore();
  const [liveApp, setLiveApp] = useState<DeveloperApplication | null>(null);
  const [draftData, setDraftData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (!activeUid) {
      setLoading(false);
      return;
    }

    // 1. Subscribe to live developer verification application
    const unsub = subscribeToDeveloperVerification(activeUid, (app) => {
      setLiveApp(app);
      setLoading(false);
    });

    // 2. Also check if there is a draft
    fetchDraftVerificationByUserId(activeUid, 'DEVELOPER')
      .then((draft) => {
        if (draft) {
          setDraftData(draft);
        }
      })
      .catch((e) => {
        console.warn('Draft check error:', e);
      });

    return () => unsub();
  }, [activeUid]);

  const appToken =
    liveApp?.caseId ||
    liveApp?.applicationToken ||
    draftData?.applicationToken ||
    (user.developerDetails as any)?.applicationToken ||
    '';

  const rawStatus = (
    liveApp?.status ||
    (user.developerStatus as string) ||
    (draftData ? 'DRAFT' : 'NOT_APPLIED')
  ).toUpperCase();

  const isApproved =
    rawStatus === 'APPROVED' ||
    (user as any).isDeveloperVerified ||
    user.developerStatus === 'APPROVED' ||
    user.role === 'DEVELOPER' ||
    user.role === 'VERIFIED_DEVELOPER';
  const isPending = rawStatus === 'PENDING_REVIEW' || rawStatus === 'PENDING';
  const isRejected = rawStatus === 'REJECTED';
  const isDraft = !isApproved && !isPending && !isRejected && !!draftData;

  const submittedDate = liveApp?.submittedAt
    ? new Date(liveApp.submittedAt).toLocaleString()
    : (user.developerDetails as any)?.requestedAt
    ? new Date((user.developerDetails as any).requestedAt).toLocaleString()
    : 'N/A';

  const lastUpdatedDate = liveApp?.updatedAt
    ? new Date(liveApp.updatedAt).toLocaleString()
    : draftData?.savedAt
    ? new Date(draftData.savedAt).toLocaleString()
    : 'N/A';

  const rejectionReason =
    (liveApp as any)?.rejectionReason ||
    (liveApp as any)?.adminNotes ||
    (liveApp as any)?.reviewerNotes ||
    (user.developerDetails as any)?.rejectionReason ||
    '';

  const handleCopyToken = () => {
    if (!appToken) return;
    navigator.clipboard.writeText(appToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleShareToken = async () => {
    if (!appToken) return;
    const shareData = {
      title: 'AVANYX Store Developer Application Token',
      text: `My AVANYX Developer Application Token: ${appToken}\nCheck status at https://avanyx.store`,
      url: typeof window !== 'undefined' ? window.location.origin : 'https://avanyx.store'
    };
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        // cancelled
      }
    }
    navigator.clipboard.writeText(`AVANYX Developer Application Token: ${appToken}`);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-[#C084FC]" />
            <span>AVANYX Developer Verification Console</span>
          </div>
          <h1 className="text-2xl font-black text-white">Verification Status & Credentials</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Track your publisher application lifecycle, verify cryptographic developer badges, and inspect review feedback.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#9333EA]/20 border border-[#9333EA]/40 text-[#C084FC] font-extrabold text-xs shrink-0">
          <Sparkles className="w-4 h-4" />
          <span>
            {isApproved
              ? 'VERIFIED DEVELOPER'
              : isPending
              ? 'PENDING REVIEW'
              : isRejected
              ? 'NEEDS REVISION'
              : isDraft
              ? 'DRAFT IN PROGRESS'
              : 'APPLICATION READY'}
          </span>
        </div>
      </div>

      {/* Main Status Display Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6">
        {/* Token and Current Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section: Application Token */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#C084FC]" />
                <span>Application Token</span>
              </span>
              {appToken && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition text-xs flex items-center gap-1 font-bold"
                    title="Copy Token"
                  >
                    {copiedToken ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleShareToken}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition text-xs"
                    title="Share Token"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="font-mono text-base font-black text-[#D0BCFF] tracking-wider">
              {appToken || 'No Token Assigned'}
            </div>
            <p className="text-[11px] text-zinc-500">
              Unique identifier for your verification request and status check.
            </p>
          </div>

          {/* Section: Live Verification Status */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <span className="text-xs font-bold text-zinc-400 block">Current Status</span>
            <div className="flex items-center gap-2">
              {isApproved && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black">
                  <BadgeCheck className="w-4 h-4" />
                  <span>Approved (Verified Developer)</span>
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Pending Review</span>
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-black">
                  <XCircle className="w-4 h-4" />
                  <span>Rejected</span>
                </span>
              )}
              {isDraft && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-black">
                  <FileText className="w-4 h-4" />
                  <span>Draft Saved</span>
                </span>
              )}
              {!isApproved && !isPending && !isRejected && !isDraft && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-500/20 text-zinc-300 text-xs font-black">
                  <span>Not Submitted</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              {isApproved
                ? 'Your verification is active. Full publishing access enabled.'
                : isPending
                ? 'Application is in the review queue. Moderation staff will review within 24-48 hours.'
                : isRejected
                ? 'Please check the rejection reason below and submit an updated application.'
                : isDraft
                ? 'Your draft is safely saved and can be resumed at any time.'
                : 'Complete the verification application to publish native Android apps.'}
            </p>
          </div>
        </div>

        {/* Timestamps Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 text-xs">
            <span className="text-zinc-400">Submitted Date:</span>
            <span className="font-mono text-zinc-200 font-bold">{submittedDate}</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 text-xs">
            <span className="text-zinc-400">Last Updated:</span>
            <span className="font-mono text-zinc-200 font-bold">{lastUpdatedDate}</span>
          </div>
        </div>

        {/* Section: Rejection Reason (if rejected) */}
        {isRejected && rejectionReason && (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-black">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Review Reason / Feedback from Moderation Team</span>
            </div>
            <p className="text-xs text-rose-200 leading-relaxed font-medium bg-black/30 p-3 rounded-xl border border-rose-500/20">
              {rejectionReason}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentTab('DEVELOPER_APPLY')}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
              >
                Re-apply for Developer Verification
              </button>
            </div>
          </div>
        )}

        {/* Section: Approved State - Verified Developer Badge & Features */}
        {isApproved && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <BadgeCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Verified Developer</h3>
              <p className="text-xs text-emerald-200/80 max-w-md mx-auto mt-1">
                Developer Badge enabled across all your store apps and public profile. You have full APK publishing access.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Developer Badge Active: {liveApp?.developerName || user.name || 'Verified Publisher'}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {!isApproved && (
            <button
              type="button"
              onClick={() => setCurrentTab('DEVELOPER_APPLY')}
              className="px-5 py-2.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-bold text-xs shadow-md shadow-[#6750A4]/25 transition flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isDraft ? 'Resume Application' : 'Open Application Form'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
