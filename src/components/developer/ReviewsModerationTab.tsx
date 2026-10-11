import React, { useState } from 'react';
import { AppReview, StoreApp } from '../../types';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Send,
  Reply,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';
import { developerReplyToReview, reportAppReview } from '../../services/firestoreService';

interface ReviewsModerationTabProps {
  reviews: AppReview[];
  developerApps: StoreApp[];
  activeUid: string;
}

export const ReviewsModerationTab: React.FC<ReviewsModerationTabProps> = ({
  reviews,
  developerApps,
  activeUid
}) => {
  const [filterRating, setFilterRating] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    const matchesRating = filterRating === 'ALL' || Math.round(r.rating) === filterRating;
    const matchesSearch =
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRating && matchesSearch;
  });

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await developerReplyToReview(reviewId, activeUid, replyText.trim());
      setActionSuccessMsg('Developer reply posted successfully!');
      setReplyingReviewId(null);
      setReplyText('');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Error posting reply: ${err.message}`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleFlagReview = async (reviewId: string) => {
    const reason = prompt('Please enter the violation reason (e.g. Spam, Abusive, Inappropriate):');
    if (!reason) return;
    try {
      await reportAppReview(reviewId, activeUid, reason);
      setActionSuccessMsg('Review reported to Store Safety team for moderation review.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Error reporting review: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Community Trust & Quality</span>
          </div>
          <h1 className="text-2xl font-black text-white">Review & Ratings Moderation</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Monitor verified user feedback, reply directly to community reviews, and report spam or policy-violating ratings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-[#0F1015] border border-white/10 text-center">
            <span className="text-[10px] text-zinc-400 font-bold block">Total Reviews</span>
            <span className="text-xl font-black text-white">{reviews.length}</span>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#161722] border border-white/10">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search review comments or user names..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400">Stars:</span>
          {(['ALL', 5, 4, 3, 2, 1] as const).map((starVal) => (
            <button
              key={String(starVal)}
              onClick={() => setFilterRating(starVal)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                filterRating === starVal
                  ? 'bg-[#9333EA] text-white shadow-md'
                  : 'bg-[#0F1015] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {starVal === 'ALL' ? 'All' : `${starVal} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#161722] border border-white/10 space-y-3">
            <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Reviews Found</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              No user reviews match your current search and filter criteria.
            </p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4 hover:border-white/20 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.userAvatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(rev.userName)}`}
                    alt={rev.userName}
                    className="w-10 h-10 rounded-full object-cover bg-black/30 border border-white/10"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">{rev.userName}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setReplyingReviewId(replyingReviewId === rev.id ? null : rev.id);
                      setReplyText(rev.developerReply?.text || '');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                  >
                    <Reply className="w-3.5 h-3.5 text-[#C084FC]" />
                    <span>{rev.developerReply ? 'Edit Reply' : 'Reply'}</span>
                  </button>

                  <button
                    onClick={() => handleFlagReview(rev.id)}
                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                    title="Report review to store moderation"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Review Comment Body */}
              <p className="text-xs text-zinc-200 leading-relaxed bg-[#0F1015] p-4 rounded-2xl border border-white/5">
                {rev.comment}
              </p>

              {/* Existing Developer Reply Display */}
              {rev.developerReply && replyingReviewId !== rev.id && (
                <div className="p-4 rounded-2xl bg-[#9333EA]/10 border border-[#9333EA]/30 ml-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#C084FC]">
                      Developer Response • {rev.developerReply.repliedAt ? new Date(rev.developerReply.repliedAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{rev.developerReply.text}</p>
                </div>
              )}

              {/* Reply Input Form */}
              {replyingReviewId === rev.id && (
                <div className="space-y-3 pt-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your official developer response..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setReplyingReviewId(null)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendReply(rev.id)}
                      disabled={isSubmittingReply || !replyText.trim()}
                      className="px-4 py-1.5 rounded-xl bg-[#9333EA] hover:bg-[#A855F7] text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingReply ? 'Posting...' : 'Post Response'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
