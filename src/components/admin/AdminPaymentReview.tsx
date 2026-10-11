import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Eye,
  Tag,
  ShieldCheck,
  FileCheck2,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';
import {
  fetchPayments,
  subscribeToPayments,
  adminReviewPayment
} from '../../services/firestoreService';
import { PaymentRecord, PaymentStatus } from '../../types';

interface AdminPaymentReviewProps {
  adminUid: string;
  adminEmail: string;
}

export const AdminPaymentReview: React.FC<AdminPaymentReviewProps> = ({
  adminUid,
  adminEmail
}) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Action Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [actionType, setActionType] = useState<'VERIFY' | 'REJECT' | 'REQUEST_PROOF' | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Screenshot Preview Modal
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToPayments((data) => {
      setPayments(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleExecuteAction = async () => {
    if (!selectedPayment || !actionType) return;
    setIsProcessing(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      await adminReviewPayment(
        selectedPayment.id,
        actionType,
        adminUid,
        adminEmail,
        reviewerNotes
      );

      const actionLabel =
        actionType === 'VERIFY'
          ? 'verified successfully'
          : actionType === 'REJECT'
          ? 'rejected'
          : 'requested new payment proof';

      setActionSuccess(`Payment for ${selectedPayment.applicantName} (${selectedPayment.utr}) has been ${actionLabel}.`);
      setSelectedPayment(null);
      setActionType(null);
      setReviewerNotes('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to review payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && p.verificationType !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.applicantName || '').toLowerCase().includes(q);
      const matchEmail = (p.userEmail || '').toLowerCase().includes(q);
      const matchToken = (p.applicationToken || '').toLowerCase().includes(q);
      const matchUtr = (p.utr || '').toLowerCase().includes(q);
      const matchType = (p.paymentType || '').toLowerCase().includes(q);
      const matchOrg = (p.studioOrSchool || '').toLowerCase().includes(q);

      if (!matchName && !matchEmail && !matchToken && !matchUtr && !matchType && !matchOrg) {
        return false;
      }
    }

    return true;
  });

  const pendingCount = payments.filter(
    (p) => p.status === 'PAYMENT_SUBMITTED' || p.status === 'PAYMENT_PENDING'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Pending Counter */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
                <span>Admin Payment Review Queue</span>
              </h2>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-xs animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Review applicant UPI transfer receipts, match 12-digit UTR against store bank statements, and approve or reject submissions.
            </p>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name, Email, Token, UTR, Studio..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
          >
            <option value="ALL">All Statuses ({payments.length})</option>
            <option value="PAYMENT_SUBMITTED">Pending Verification ({pendingCount})</option>
            <option value="PAYMENT_VERIFIED">Verified</option>
            <option value="PAYMENT_REJECTED">Rejected</option>
            <option value="REQUEST_PROOF">Proof Requested</option>
          </select>

          {/* Verification Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
          >
            <option value="ALL">All Verification Types</option>
            <option value="DEVELOPER">Developer (₹1,626)</option>
            <option value="STUDENT">Student (₹50)</option>
            <option value="PROMOTION">Promotions</option>
          </select>
        </div>
      </div>

      {/* Payment Queue Cards / Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading payments from live Firestore...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
            No Payments Match the Current Filter
          </h3>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
            All submitted payments have been processed or no matching records were found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((p) => {
            const isPending = p.status === 'PAYMENT_SUBMITTED' || p.status === 'PAYMENT_PENDING';
            const isVerified = p.status === 'PAYMENT_VERIFIED' || p.status === 'APPROVED';
            const isRejected = p.status === 'PAYMENT_REJECTED' || p.status === 'REJECTED';
            const isProofRequested = p.status === 'REQUEST_PROOF';

            return (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-4 transition-all hover:border-black/15 dark:hover:border-white/15"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isVerified
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : isRejected
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : isProofRequested
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 animate-pulse'
                      }`}
                    >
                      {p.status.replace('_', ' ')}
                    </span>

                    <span className="text-xs font-black text-[#1D1B20] dark:text-[#E6E1E5]">
                      {p.applicantName || 'Anonymous Applicant'}
                    </span>

                    <span className="text-[11px] text-zinc-500">
                      • {p.studioOrSchool || 'Individual'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-zinc-500">
                      Token: <strong className="text-[#6750A4] dark:text-[#D0BCFF]">{p.applicationToken}</strong>
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="text-zinc-500">
                      {new Date(p.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Verification Type</span>
                    <p className="font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
                      {p.verificationType}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Amount Paid</span>
                    <p className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                      ₹{p.finalAmount}
                    </p>
                    {p.discountAmount > 0 && (
                      <p className="text-[10px] text-zinc-400 line-through">
                        ₹{p.originalAmount} (-₹{p.discountAmount})
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Coupon Used</span>
                    <p className="font-mono font-bold text-[#6750A4] dark:text-[#D0BCFF]">
                      {p.couponUsed || 'None'}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">UTR / Ref Number</span>
                    <code className="font-mono font-black text-xs text-[#1D1B20] dark:text-[#E6E1E5] block">
                      {p.utr}
                    </code>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Store UPI ID</span>
                    <p className="font-mono text-zinc-600 dark:text-zinc-400">
                      {p.upiId || 'avanyx@upi'}
                    </p>
                  </div>

                  {/* Screenshot Thumbnail Preview */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Proof Screenshot</span>
                    {p.paymentScreenshotUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewScreenshotUrl(p.paymentScreenshotUrl)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 text-[#6750A4] dark:text-[#D0BCFF] font-bold text-[11px] hover:bg-purple-500/20 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Receipt</span>
                      </button>
                    ) : (
                      <span className="text-zinc-400 italic">No Screenshot</span>
                    )}
                  </div>
                </div>

                {p.reviewerNotes && (
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-[11px] text-[#49454F] dark:text-[#CAC4D0] space-y-0.5">
                    <span className="font-bold block">Reviewer Notes ({p.reviewedBy || 'Admin'}):</span>
                    <p>{p.reviewerNotes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayment(p);
                      setActionType('REQUEST_PROOF');
                      setReviewerNotes('');
                    }}
                    className="px-4 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs transition"
                  >
                    Request New Payment Proof
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayment(p);
                      setActionType('REJECT');
                      setReviewerNotes('');
                    }}
                    className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition"
                  >
                    Reject Payment
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayment(p);
                      setActionType('VERIFY');
                      setReviewerNotes('Payment verified against UPI statement.');
                    }}
                    className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Payment</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Inspection Modal */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#6750A4]" /> Payment Proof Screenshot Inspection
              </h3>
              <button
                onClick={() => setPreviewScreenshotUrl(null)}
                className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-black/5 dark:bg-black/40 p-2 flex items-center justify-center">
              <img
                src={previewScreenshotUrl}
                alt="Payment Proof Receipt"
                className="max-h-[60vh] object-contain rounded-xl shadow"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <a
                href={previewScreenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#6750A4] dark:text-[#D0BCFF] underline font-bold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open full image in new tab
              </a>
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Action Modal (Verify / Reject / Request Proof) */}
      {selectedPayment && actionType && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1D1B20] dark:text-[#E6E1E5]">
                {actionType === 'VERIFY'
                  ? 'Confirm Payment Verification'
                  : actionType === 'REJECT'
                  ? 'Reject Payment'
                  : 'Request New Payment Proof'}
              </h3>
              <button
                onClick={() => {
                  setSelectedPayment(null);
                  setActionType(null);
                }}
                className="p-1 rounded-xl hover:bg-black/5 text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs">
              <div className="flex justify-between">
                <span>Applicant:</span>
                <strong className="text-[#1D1B20] dark:text-[#E6E1E5]">{selectedPayment.applicantName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">₹{selectedPayment.finalAmount}</strong>
              </div>
              <div className="flex justify-between">
                <span>UTR / Transaction ID:</span>
                <code className="font-mono font-bold text-purple-600">{selectedPayment.utr}</code>
              </div>
              <div className="flex justify-between">
                <span>Application Token:</span>
                <strong className="font-mono">{selectedPayment.applicationToken}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
                {actionType === 'VERIFY'
                  ? 'Verification Notes (Optional)'
                  : actionType === 'REJECT'
                  ? 'Rejection Reason (Visible to Applicant)'
                  : 'Instructions for Applicant (Visible in Notification)'}
              </label>
              <textarea
                rows={3}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder={
                  actionType === 'VERIFY'
                    ? 'e.g. Verified on live UPI statement reference'
                    : actionType === 'REJECT'
                    ? 'e.g. UTR number not found on bank statement or incorrect amount'
                    : 'e.g. Screenshot blurry; please re-upload clear transaction receipt'
                }
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
              />
            </div>

            {actionError && (
              <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPayment(null);
                  setActionType(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 font-bold text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteAction}
                className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 ${
                  actionType === 'VERIFY'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionType === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {actionType === 'VERIFY'
                      ? 'Confirm & Verify Payment'
                      : actionType === 'REJECT'
                      ? 'Confirm Rejection'
                      : 'Send Proof Request'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
