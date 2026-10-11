import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Layers,
  ArrowUpRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { DeveloperPayout, DeveloperPayoutSetting, PayoutStatus } from '../../types';
import {
  fetchCreatorPayouts,
  requestCreatorPayout
} from '../../services/firestoreService';
import {
  getDeveloperPayoutSettings,
  saveDeveloperPayoutSettings,
  getDeveloperPayoutBalance,
  DeveloperPayoutBalance
} from '../../services/billingService';

interface PayoutCenterTabProps {
  creatorUid: string;
  creatorName: string;
  creatorEmail?: string;
  creatorType: 'DEVELOPER' | 'STUDENT';
}

export const PayoutCenterTab: React.FC<PayoutCenterTabProps> = ({
  creatorUid,
  creatorName,
  creatorEmail = '',
  creatorType
}) => {
  const [balanceData, setBalanceData] = useState<DeveloperPayoutBalance | null>(null);
  const [payouts, setPayouts] = useState<DeveloperPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Payout Destination Settings Form
  const [upiId, setUpiId] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK_TRANSFER'>('UPI');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Request Payout Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [bal, history, sett] = await Promise.all([
        getDeveloperPayoutBalance(creatorUid),
        fetchCreatorPayouts(creatorUid),
        getDeveloperPayoutSettings(creatorUid)
      ]);

      setBalanceData(bal);
      setPayouts(history);
      if (sett) {
        setUpiId(sett.upiId || '');
        setPanNumber(sett.panNumber || '');
        setBankAccountNumber(sett.bankAccountNumber || '');
        setBankIfsc(sett.bankIfsc || '');
        setBankName(sett.bankName || '');
        setAccountHolderName(sett.accountHolderName || '');
        setPayoutMethod(sett.payoutMethod || 'UPI');
      }
    } catch (err) {
      console.warn('Payout Center load notice:', err);
    } finally {
      setLoading(false);
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [creatorUid]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim() && payoutMethod === 'UPI') {
      setSettingsError('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
      return;
    }
    if (payoutMethod === 'BANK_TRANSFER' && (!bankAccountNumber.trim() || !bankIfsc.trim())) {
      setSettingsError('Please provide Bank Account Number and IFSC Code');
      return;
    }

    setIsSavingSettings(true);
    setSettingsSuccess(null);
    setSettingsError(null);
    try {
      await saveDeveloperPayoutSettings({
        id: creatorUid,
        developerUid: creatorUid,
        payoutMethod,
        upiId: upiId.trim(),
        panNumber: panNumber.trim().toUpperCase(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim() || creatorName,
        updatedAt: new Date().toISOString()
      });
      setSettingsSuccess('Payout settings saved to live Firestore!');
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save payout destination');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSubmitPayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(requestAmount);
    const available = balanceData?.availableForPayout || 0;

    if (!amountNum || amountNum < 100) {
      setPayoutError('Minimum payout request amount is ₹100.');
      return;
    }
    if (amountNum > available) {
      setPayoutError(`Amount exceeds withdrawable balance of ₹${available}.`);
      return;
    }
    if (payoutMethod === 'UPI' && !upiId.trim()) {
      setPayoutError('Please configure your UPI ID before requesting a payout.');
      return;
    }

    setIsSubmittingPayout(true);
    setPayoutSuccess(null);
    setPayoutError(null);

    try {
      const newPayout = await requestCreatorPayout({
        developerUid: creatorUid,
        developerName: creatorName,
        developerEmail: creatorEmail,
        creatorType,
        amount: amountNum,
        payoutMethod,
        upiId: upiId.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim() || creatorName,
        notes: payoutNotes.trim()
      });

      setPayouts((prev) => [newPayout, ...prev]);
      setPayoutSuccess(`Payout request ${newPayout.payoutId} submitted successfully! Status: PENDING.`);
      setIsModalOpen(false);
      setRequestAmount('');
      setPayoutNotes('');
      // Reload balance ledger
      loadAll();
    } catch (err: any) {
      setPayoutError(err.message || 'Failed to submit payout request');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const getStatusBadge = (status: PayoutStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>PAID</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>PROCESSING</span>
          </span>
        );
      case 'FAILED':
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>PENDING</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C122C] via-[#141220] to-[#0A0B12] border border-purple-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9333EA] to-[#EC4899] text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>Payout Center</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-[#C084FC] border border-purple-500/30">
                    Live Settlement
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Direct revenue withdrawals to your UPI or Bank Account. Pure transactional ledger — no virtual wallet balance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAll}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition"
              title="Refresh Payout Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={(balanceData?.availableForPayout || 0) < 100}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 ${
                (balanceData?.availableForPayout || 0) >= 100
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:from-[#A855F7] hover:to-[#F43F5E] text-white shadow-purple-500/30 cursor-pointer'
                  : 'bg-white/5 text-zinc-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Request Payout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {payoutSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{payoutSuccess}</span>
        </div>
      )}
      {payoutError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{payoutError}</span>
        </div>
      )}

      {/* 3 Core Financial Metric Cards (PART H) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Withdrawable Balance */}
        <div className="p-5 rounded-3xl bg-[#13141F] border border-purple-500/20 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
            <span>Withdrawable Balance</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{(balanceData?.availableForPayout || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500">
            Net verified revenue after platform commission minus pending/paid settlements.
          </p>
        </div>

        {/* Pending Payout */}
        <div className="p-5 rounded-3xl bg-[#13141F] border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
            <span>Pending Payout</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            ₹{(balanceData?.pendingPayoutRequests || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500">
            Currently in PENDING or PROCESSING status awaiting bank clearing.
          </p>
        </div>

        {/* Total Paid History */}
        <div className="p-5 rounded-3xl bg-[#13141F] border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
            <span>Paid History</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">
            ₹{(balanceData?.totalWithdrawn || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500">
            Lifetime cleared settlements transferred directly to your bank or UPI.
          </p>
        </div>
      </div>

      {/* Payout Destination Configuration */}
      <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-[#13141F] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Payout Destination Details</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Set where your earned revenue will be credited upon payout approval.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5 self-start">
            <button
              type="button"
              onClick={() => setPayoutMethod('UPI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                payoutMethod === 'UPI' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              UPI (Recommended)
            </button>
            <button
              type="button"
              onClick={() => setPayoutMethod('BANK_TRANSFER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                payoutMethod === 'BANK_TRANSFER' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Bank Transfer
            </button>
          </div>
        </div>

        {settingsSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{settingsSuccess}</span>
          </div>
        )}
        {settingsError && (
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{settingsError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* UPI ID */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              UPI ID (VPA) <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@okaxis"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-mono"
            />
          </div>

          {/* PAN Number (Optional) */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center justify-between">
              <span>PAN Card Number</span>
              <span className="text-[10px] text-zinc-500 font-normal">Optional until legally required</span>
            </label>
            <input
              type="text"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-mono uppercase"
            />
          </div>

          {/* Bank Details (Optional) */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center justify-between">
              <span>Bank Account Number</span>
              <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
            </label>
            <input
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="Account Number"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center justify-between">
              <span>IFSC Code & Bank Name</span>
              <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                placeholder="IFSC (e.g. HDFC0001234)"
                maxLength={11}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-mono uppercase"
              />
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name"
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingSettings}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs transition active:scale-95 flex items-center gap-2"
          >
            {isSavingSettings ? 'Saving...' : 'Save Payout Destination'}
          </button>
        </div>
      </form>

      {/* Payout History Ledger Table */}
      <div className="p-6 rounded-3xl bg-[#13141F] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Payout History Ledger</span>
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            {payouts.length} records
          </span>
        </div>

        {payouts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs font-bold bg-black/20 rounded-2xl border border-white/5">
            No payout requests submitted yet. Earned revenue appears here upon payout initiation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Payout ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Destination</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Reference / UTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-3 font-mono text-purple-300 font-bold">
                      {p.payoutId || p.id}
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      {p.requestedAt ? new Date(p.requestedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3 font-black text-white">
                      ₹{p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-zinc-300">
                      {p.payoutMethod}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-400 truncate max-w-[150px]">
                      {p.upiId || p.bankAccountNumber || 'Direct'}
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-400 truncate max-w-[160px]">
                      {p.transactionRef || 'Pending clearing'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Payout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#161722] border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-400" />
                <span>Request Payout</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
              <span className="font-bold">Available to Withdraw:</span> ₹{(balanceData?.availableForPayout || 0).toLocaleString()}
            </div>

            <form onSubmit={handleSubmitPayoutRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Withdrawal Amount (₹) <span className="text-purple-400">*</span>
                </label>
                <input
                  type="number"
                  min="100"
                  max={balanceData?.availableForPayout || 100}
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="Minimum ₹100"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-sm font-black text-white placeholder-zinc-600 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Destination UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@bank"
                  required={payoutMethod === 'UPI'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Optional Settlement Note
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Monthly developer disbursement"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                />
              </div>

              {payoutError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold">
                  {payoutError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition"
                >
                  {isSubmittingPayout ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
