import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Tag,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Layers,
  Copy,
  Check,
  TrendingUp,
  FileCheck2,
  DollarSign,
  Gift,
  Clock,
  Search,
  Filter,
  PlusCircle,
  XCircle,
  Eye,
  Sliders,
  Send,
  HelpCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';
import {
  getGlobalPaymentSettings,
  subscribeToGlobalPaymentSettings,
  updateGlobalPaymentSettings,
  generateDynamicUpiQr,
  DEFAULT_GLOBAL_PAYMENT_SETTINGS,
  fetchCouponCodes,
  getCommissionSettings,
  saveCommissionSettings,
  fetchAllPayouts,
  adminUpdatePayoutStatus,
  fetchPayments,
  subscribeToPayments
} from '../../services/firestoreService';
import {
  GlobalPaymentSettings,
  CouponCode,
  CommissionSettings,
  DeveloperPayout,
  PaymentRecord,
  PayoutStatus
} from '../../types';
import { AdminPaymentReview } from './AdminPaymentReview';
import { AdminPaymentAnalytics } from './AdminPaymentAnalytics';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, limit } from 'firebase/firestore';
import { db, removeUndefinedFields } from '../../firebase';

export type PaymentConsoleTab =
  | 'OVERVIEW'
  | 'UPI_CONFIG'
  | 'PAYMENT_REVIEW'
  | 'TRANSACTIONS'
  | 'REVENUE_ANALYTICS'
  | 'PAYOUT_REQUESTS'
  | 'COUPON_MANAGER'
  | 'REWARDS'
  | 'COMMISSION_SETTINGS';

interface AdminPaymentConsoleProps {
  adminUid: string;
  initialTab?: PaymentConsoleTab;
}

export const AdminPaymentConsole: React.FC<AdminPaymentConsoleProps> = ({
  adminUid,
  initialTab = 'OVERVIEW'
}) => {
  const [activeTab, setActiveTab] = useState<PaymentConsoleTab>(initialTab);

  // Sync if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Global UPI Settings State (payment_settings/global)
  const [globalSettings, setGlobalSettings] = useState<GlobalPaymentSettings>(DEFAULT_GLOBAL_PAYMENT_SETTINGS);
  const [globalForm, setGlobalForm] = useState<GlobalPaymentSettings>(DEFAULT_GLOBAL_PAYMENT_SETTINGS);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [testCouponDiscount, setTestCouponDiscount] = useState<number>(0);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Commission Settings State
  const [commissionForm, setCommissionForm] = useState<CommissionSettings>({
    id: 'global',
    appSaleCommission: 10,
    inAppCommission: 10,
    subscriptionCommission: 10,
    promotionCommission: 5,
    updatedAt: ''
  });
  const [isSavingCommission, setIsSavingCommission] = useState(false);
  const [commissionSuccess, setCommissionSuccess] = useState<string | null>(null);
  const [commissionError, setCommissionError] = useState<string | null>(null);

  // Payout Requests State
  const [payouts, setPayouts] = useState<DeveloperPayout[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('ALL');
  const [selectedPayout, setSelectedPayout] = useState<DeveloperPayout | null>(null);
  const [payoutRefInput, setPayoutRefInput] = useState('');
  const [isUpdatingPayout, setIsUpdatingPayout] = useState(false);

  // Coupons State
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('200');
  const [newCouponDesc, setNewCouponDesc] = useState('Developer verification discount');
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Transactions State
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [allPurchases, setAllPurchases] = useState<any[]>([]);
  const [txnSearch, setTxnSearch] = useState('');
  const [txnStatusFilter, setTxnStatusFilter] = useState('ALL');

  // Load subscriptions & initial data
  useEffect(() => {
    const unsubUpi = subscribeToGlobalPaymentSettings((s) => {
      setGlobalSettings(s);
      setGlobalForm(s);
    });

    const unsubPayments = subscribeToPayments((list) => {
      setAllPayments(list);
    });

    fetchCouponCodes().then(setCoupons);
    getCommissionSettings().then(setCommissionForm);
    loadPayouts();
    loadPurchases();

    return () => {
      unsubUpi();
      unsubPayments();
    };
  }, []);

  const loadPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const list = await fetchAllPayouts();
      setPayouts(list);
    } catch (err) {
      console.warn('Error loading payouts:', err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const loadPurchases = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'purchases'), limit(100)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllPurchases(list);
    } catch (err) {
      console.warn('Error loading purchases:', err);
    }
  };

  // Save Dynamic Global UPI Settings
  const handleSaveGlobalUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGlobal(true);
    setGlobalSuccess(null);
    setGlobalError(null);
    try {
      await updateGlobalPaymentSettings(globalForm, adminUid);
      setGlobalSuccess('Global UPI configuration published to live Firestore payment_settings/global! All store QR codes updated.');
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to update global UPI settings');
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // Save Commission Settings
  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCommission(true);
    setCommissionSuccess(null);
    setCommissionError(null);
    try {
      const saved = await saveCommissionSettings(commissionForm, adminUid);
      setCommissionForm(saved);
      setCommissionSuccess('Platform commission settings updated and published to live Firestore!');
    } catch (err: any) {
      setCommissionError(err.message || 'Failed to update commissions');
    } finally {
      setIsSavingCommission(false);
    }
  };

  // Create Coupon Code
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCouponCode.trim().toUpperCase();
    const disc = Number(newCouponDiscount) || 200;
    if (!code) return;

    setSavingCoupon(true);
    try {
      const couponDocRef = doc(db, 'coupon_codes', code);
      const newCoupon: CouponCode = {
        id: code,
        code,
        discountAmount: disc,
        enabled: true,
        maxUses: 1000,
        currentUses: 0,
        validUntil: '2027-12-31',
        description: newCouponDesc.trim() || `₹${disc} off developer verification`,
        developerOnly: true,
        createdAt: new Date().toISOString()
      };
      await setDoc(couponDocRef, removeUndefinedFields(newCoupon));
      setCoupons((prev) => [newCoupon, ...prev.filter((c) => c.code !== code)]);
      setIsCreatingCoupon(false);
      setNewCouponCode('');
    } catch (err) {
      console.warn('Coupon creation error:', err);
    } finally {
      setSavingCoupon(false);
    }
  };

  // Update Payout Status (PENDING -> PROCESSING -> PAID -> FAILED)
  const handleUpdatePayoutStatus = async (payoutId: string, status: PayoutStatus) => {
    setIsUpdatingPayout(true);
    try {
      await adminUpdatePayoutStatus(payoutId, status, {
        processedBy: adminUid,
        transactionRef: payoutRefInput.trim(),
        notes: `Marked as ${status} by Admin`
      });
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === payoutId
            ? {
                ...p,
                status,
                transactionRef: payoutRefInput.trim() || p.transactionRef
              }
            : p
        )
      );
      setSelectedPayout(null);
      setPayoutRefInput('');
    } catch (err) {
      console.warn('Failed to update payout:', err);
    } finally {
      setIsUpdatingPayout(false);
    }
  };

  // Calculated Preview QR
  const previewAmount = Math.max(0, (globalForm.paymentTypes?.DEVELOPER_VERIFICATION || 1626) - testCouponDiscount);
  const previewQr = generateDynamicUpiQr(
    globalForm.upiId,
    globalForm.accountName,
    previewAmount,
    'AVANYX Store Admin Test',
    globalForm.qrBase
  );

  // Tabs array
  const consoleTabs: Array<{ id: PaymentConsoleTab; label: string; icon: React.ElementType; badge?: string | number }> = [
    { id: 'OVERVIEW', label: 'Overview', icon: Layers },
    { id: 'UPI_CONFIG', label: 'UPI Configuration', icon: QrCode, badge: 'Dynamic' },
    { id: 'PAYMENT_REVIEW', label: 'Payment Review', icon: FileCheck2, badge: allPayments.filter((p) => p.status === 'PENDING_REVIEW').length || undefined },
    { id: 'TRANSACTIONS', label: 'Transactions', icon: CreditCard, badge: allPayments.length + allPurchases.length },
    { id: 'REVENUE_ANALYTICS', label: 'Revenue Analytics', icon: TrendingUp },
    { id: 'PAYOUT_REQUESTS', label: 'Payout Requests', icon: DollarSign, badge: payouts.filter((p) => p.status === 'PENDING').length || undefined },
    { id: 'COUPON_MANAGER', label: 'Coupon Manager', icon: Tag, badge: coupons.length },
    { id: 'REWARDS', label: 'Rewards', icon: Gift },
    { id: 'COMMISSION_SETTINGS', label: 'Commission Settings', icon: Sliders }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Navigation Tabs */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C122C] via-[#141220] to-[#0A0B12] border border-purple-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-purple-400" />
              <span>AVANYX Payment Console</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-[#C084FC] border border-purple-500/30">
                Single Source of Truth
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Unified administration of live payments, dynamic UPI source, payouts, commissions, coupons, and revenue settlement.
            </p>
          </div>
          <span className="self-start sm:self-center px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>Firestore payment_settings/global Active</span>
          </span>
        </div>

        {/* 9 PART B Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-white/5 pt-3 scrollbar-none">
          {consoleTabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white shadow-md shadow-purple-500/25'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[#13141F] border border-purple-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Payments Received</span>
              <div className="text-2xl font-black text-white">
                ₹{allPayments.reduce((acc, p) => acc + (p.status === 'PAYMENT_VERIFIED' ? p.amountPaid || p.amount || 0 : 0), 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">
                {allPayments.filter((p) => p.status === 'PAYMENT_VERIFIED').length} Verified Transactions
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-[#13141F] border border-amber-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Pending Reviews</span>
              <div className="text-2xl font-black text-amber-300">
                {allPayments.filter((p) => p.status === 'PENDING_REVIEW' || p.status === 'PAYMENT_SUBMITTED').length}
              </div>
              <button
                onClick={() => setActiveTab('PAYMENT_REVIEW')}
                className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1"
              >
                Review queue →
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-[#13141F] border border-blue-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Pending Payout Requests</span>
              <div className="text-2xl font-black text-blue-300">
                ₹{payouts.filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING').reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
              </div>
              <button
                onClick={() => setActiveTab('PAYOUT_REQUESTS')}
                className="text-[11px] text-blue-400 font-bold hover:underline flex items-center gap-1"
              >
                {payouts.filter((p) => p.status === 'PENDING').length} awaiting clearance →
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-[#13141F] border border-purple-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Dynamic UPI Source</span>
              <div className="text-sm font-mono text-purple-300 truncate font-bold">
                {globalSettings.upiId}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className={`w-2 h-2 rounded-full ${globalSettings.enabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span>{globalSettings.enabled ? 'Enabled' : 'Disabled'} ({globalSettings.accountName})</span>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('UPI_CONFIG')}
              className="p-5 rounded-3xl bg-[#13141F] border border-white/10 hover:border-purple-500/40 cursor-pointer transition group space-y-2"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5 group-hover:scale-110 transition" />
              </div>
              <h3 className="text-sm font-black text-white">Dynamic UPI Configuration</h3>
              <p className="text-xs text-zinc-400">
                Configure primary UPI ID, account name, and base fee tiers for real-time QR generation.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('COUPON_MANAGER')}
              className="p-5 rounded-3xl bg-[#13141F] border border-white/10 hover:border-purple-500/40 cursor-pointer transition group space-y-2"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                <Tag className="w-5 h-5 group-hover:scale-110 transition" />
              </div>
              <h3 className="text-sm font-black text-white">Manage Promotional Coupons</h3>
              <p className="text-xs text-zinc-400">
                Create and toggle promotional discounts (e.g. ₹200 launch codes) that dynamically update payment QR codes.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('COMMISSION_SETTINGS')}
              className="p-5 rounded-3xl bg-[#13141F] border border-white/10 hover:border-purple-500/40 cursor-pointer transition group space-y-2"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5 group-hover:scale-110 transition" />
              </div>
              <h3 className="text-sm font-black text-white">Store Commission Rates</h3>
              <p className="text-xs text-zinc-400">
                Adjust platform revenue share percentages on app sales, in-app purchases, and promotions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPI CONFIGURATION (PART C Single Dynamic UPI Source) */}
      {activeTab === 'UPI_CONFIG' && (
        <div className="space-y-6 animate-fadeIn">
          {globalSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{globalSuccess}</span>
            </div>
          )}
          {globalError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <form onSubmit={handleSaveGlobalUpi} className="lg:col-span-2 p-6 rounded-3xl bg-[#13141F] border border-white/10 space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <span>Live UPI Source (`payment_settings/global`)</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    All payment screens, dialogs, and verification steps across AVANYX Store read this authoritative document.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-zinc-300">Enabled</span>
                  <button
                    type="button"
                    onClick={() => setGlobalForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                      globalForm.enabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    UPI ID (VPA) <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={globalForm.upiId}
                    onChange={(e) => setGlobalForm((prev) => ({ ...prev, upiId: e.target.value }))}
                    placeholder="e.g. avanyx@upi"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Beneficiary Account Name <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={globalForm.accountName}
                    onChange={(e) => setGlobalForm((prev) => ({ ...prev, accountName: e.target.value }))}
                    placeholder="e.g. AVANYX STORE INDIA"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Custom QR Base Image URL (Optional)</span>
                  <span className="text-[10px] text-zinc-500">Leave blank for automatic high-res vector UPI QR</span>
                </label>
                <input
                  type="url"
                  value={globalForm.qrBase || ''}
                  onChange={(e) => setGlobalForm((prev) => ({ ...prev, qrBase: e.target.value }))}
                  placeholder="https://... (Optional custom branded base QR)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>

              {/* Base Fee Tiers (paymentTypes) */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <span className="text-xs font-black uppercase tracking-wider text-purple-300 block">
                  Store Payment Type Pricing (₹ INR)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1 truncate">
                      Developer Verification
                    </label>
                    <input
                      type="number"
                      value={globalForm.paymentTypes?.DEVELOPER_VERIFICATION ?? 1626}
                      onChange={(e) =>
                        setGlobalForm((prev) => ({
                          ...prev,
                          paymentTypes: {
                            ...prev.paymentTypes,
                            DEVELOPER_VERIFICATION: Number(e.target.value) || 0
                          }
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1 truncate">
                      Student Verification
                    </label>
                    <input
                      type="number"
                      value={globalForm.paymentTypes?.STUDENT_VERIFICATION ?? 50}
                      onChange={(e) =>
                        setGlobalForm((prev) => ({
                          ...prev,
                          paymentTypes: {
                            ...prev.paymentTypes,
                            STUDENT_VERIFICATION: Number(e.target.value) || 0
                          }
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1 truncate">
                      Banner Promotion
                    </label>
                    <input
                      type="number"
                      value={globalForm.paymentTypes?.BANNER_PROMOTION ?? 1499}
                      onChange={(e) =>
                        setGlobalForm((prev) => ({
                          ...prev,
                          paymentTypes: {
                            ...prev.paymentTypes,
                            BANNER_PROMOTION: Number(e.target.value) || 0
                          }
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1 truncate">
                      Featured App Promo
                    </label>
                    <input
                      type="number"
                      value={globalForm.paymentTypes?.FEATURED_APP_PROMOTION ?? 999}
                      onChange={(e) =>
                        setGlobalForm((prev) => ({
                          ...prev,
                          paymentTypes: {
                            ...prev.paymentTypes,
                            FEATURED_APP_PROMOTION: Number(e.target.value) || 0
                          }
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1 truncate">
                      Category Spotlight
                    </label>
                    <input
                      type="number"
                      value={globalForm.paymentTypes?.CATEGORY_SPOTLIGHT_PROMOTION ?? 799}
                      onChange={(e) =>
                        setGlobalForm((prev) => ({
                          ...prev,
                          paymentTypes: {
                            ...prev.paymentTypes,
                            CATEGORY_SPOTLIGHT_PROMOTION: Number(e.target.value) || 0
                          }
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1 truncate">
                      Store Ad Promo
                    </label>
                    <input
                      type="number"
                      value={globalForm.paymentTypes?.STORE_ADVERTISEMENT_PROMOTION ?? 499}
                      onChange={(e) =>
                        setGlobalForm((prev) => ({
                          ...prev,
                          paymentTypes: {
                            ...prev.paymentTypes,
                            STORE_ADVERTISEMENT_PROMOTION: Number(e.target.value) || 0
                          }
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingGlobal}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:from-[#A855F7] hover:to-[#F43F5E] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25 transition active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingGlobal ? 'Publishing...' : 'Publish UPI Changes to Firestore'}</span>
                </button>
              </div>
            </form>

            {/* Live QR Preview & Dynamic Coupon Test Simulator (PART C) */}
            <div className="p-6 rounded-3xl bg-[#13141F] border border-purple-500/20 space-y-4 text-center">
              <div>
                <h3 className="text-sm font-black text-white flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4 text-purple-400" />
                  <span>Live Dynamic QR Preview</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Regenerates in real time using the same UPI ID with updated coupon amounts.
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-purple-500/40">
                <img
                  src={previewQr}
                  alt="Dynamic QR Preview"
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-mono font-bold text-purple-300">
                  {globalForm.upiId}
                </div>
                <div className="text-zinc-400 font-bold">
                  Amount: <span className="text-white font-black text-sm">₹{previewAmount}</span>
                  {testCouponDiscount > 0 && (
                    <span className="text-emerald-400 text-[10px] ml-1">
                      (-₹{testCouponDiscount} discount)
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Coupon Simulator Slider */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-300">Test Coupon Discount:</span>
                  <span className="text-purple-300">₹{testCouponDiscount}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="50"
                  value={testCouponDiscount}
                  onChange={(e) => setTestCouponDiscount(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <p className="text-[10px] text-zinc-500 italic">
                  Drag to simulate user applying coupon: observe instant QR re-encoding with exact same UPI ID!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT REVIEW */}
      {activeTab === 'PAYMENT_REVIEW' && (
        <div className="animate-fadeIn">
          <AdminPaymentReview adminUid={adminUid} adminEmail="alok8881864873@gmail.com" />
        </div>
      )}

      {/* TAB 4: TRANSACTIONS (Unified Ledger) */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="p-6 rounded-3xl bg-[#13141F] border border-white/10 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span>Unified Transactions Ledger</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Combined feed of developer verifications, student verifications, promotions, and in-app purchases.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
                placeholder="Search by UTR or token..."
                className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <select
                value={txnStatusFilter}
                onChange={(e) => setTxnStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAYMENT_VERIFIED">Verified / Success</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Transaction / Token</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Applicant / User</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Coupon</th>
                  <th className="py-3 px-3">UTR</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allPayments
                  .filter((p) => {
                    const matchQ =
                      !txnSearch ||
                      (p.transactionId || '').toLowerCase().includes(txnSearch.toLowerCase()) ||
                      (p.applicationToken || '').toLowerCase().includes(txnSearch.toLowerCase());
                    const matchStatus =
                      txnStatusFilter === 'ALL' ||
                      p.status === txnStatusFilter;
                    return matchQ && matchStatus;
                  })
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-3 font-mono text-purple-300 font-bold">
                        {p.applicationToken || p.id.slice(0, 14)}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">
                        {p.paymentType}
                      </td>
                      <td className="py-3 px-3 text-white font-medium">
                        {p.applicantName || p.userId}
                      </td>
                      <td className="py-3 px-3 font-black text-white">
                        ₹{p.amountPaid || p.amount}
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-300">
                        {p.couponCode || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-300">
                        {p.transactionId || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            p.status === 'PAYMENT_VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : p.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 text-[11px]">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REVENUE ANALYTICS */}
      {activeTab === 'REVENUE_ANALYTICS' && (
        <div className="animate-fadeIn">
          <AdminPaymentAnalytics />
        </div>
      )}

      {/* TAB 6: PAYOUT REQUESTS */}
      {activeTab === 'PAYOUT_REQUESTS' && (
        <div className="p-6 rounded-3xl bg-[#13141F] border border-white/10 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span>Developer & Student Payout Requests</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Review and disburse creator earnings directly to their bank accounts or UPI VPAs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadPayouts}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPayouts ? 'animate-spin' : ''}`} />
              </button>
              <select
                value={payoutStatusFilter}
                onChange={(e) => setPayoutStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Payout Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed / Rejected</option>
              </select>
            </div>
          </div>

          {payouts.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-bold bg-black/20 rounded-2xl">
              No creator payout requests in ledger.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Payout ID</th>
                    <th className="py-3 px-3">Creator</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts
                    .filter((p) => payoutStatusFilter === 'ALL' || p.status === payoutStatusFilter)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-3 font-mono text-purple-300 font-bold">
                          {p.payoutId || p.id}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{p.developerName}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{p.developerUid.slice(0, 10)}</span>
                        </td>
                        <td className="py-3 px-3 font-black text-white">
                          ₹{p.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-300 text-[11px]">
                          {p.payoutMethod === 'UPI' ? p.upiId : `${p.bankName} • ${p.bankAccountNumber?.slice(-4)}`}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              p.status === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : p.status === 'PROCESSING'
                                ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                                : p.status === 'FAILED' || p.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-500 text-[11px]">
                          {p.requestedAt ? new Date(p.requestedAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedPayout(p)}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Manage Payout Modal */}
          {selectedPayout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md bg-[#161722] border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-black text-white">
                    Manage Payout #{selectedPayout.payoutId}
                  </h3>
                  <button onClick={() => setSelectedPayout(null)} className="text-zinc-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Creator:</span>
                    <span className="font-bold text-white">{selectedPayout.developerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Amount:</span>
                    <span className="font-black text-purple-300 text-sm">₹{selectedPayout.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Destination:</span>
                    <span className="font-mono text-zinc-300">{selectedPayout.upiId || selectedPayout.bankAccountNumber}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Bank Reference / UTR Number
                  </label>
                  <input
                    type="text"
                    value={payoutRefInput}
                    onChange={(e) => setPayoutRefInput(e.target.value)}
                    placeholder="Enter 12-digit UTR from banking portal"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleUpdatePayoutStatus(selectedPayout.id, 'PROCESSING')}
                    disabled={isUpdatingPayout}
                    className="flex-1 py-2 rounded-xl bg-blue-600/30 text-blue-300 hover:bg-blue-600/40 font-bold text-xs transition"
                  >
                    Processing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePayoutStatus(selectedPayout.id, 'PAID')}
                    disabled={isUpdatingPayout}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-black text-xs transition"
                  >
                    Mark Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePayoutStatus(selectedPayout.id, 'FAILED')}
                    disabled={isUpdatingPayout}
                    className="flex-1 py-2 rounded-xl bg-rose-600/30 text-rose-300 hover:bg-rose-600/40 font-bold text-xs transition"
                  >
                    Fail / Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: COUPON MANAGER */}
      {activeTab === 'COUPON_MANAGER' && (
        <div className="p-6 rounded-3xl bg-[#13141F] border border-white/10 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                <span>Coupon Code Management</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Create promotional discount coupons. When applied by developers, payment QR codes regenerate with the reduced amount dynamically.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingCoupon(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 self-start"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.code} className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-purple-300">
                    {c.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    c.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {c.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="text-lg font-black text-white">
                  ₹{c.discountAmount} OFF
                </div>
                <p className="text-[11px] text-zinc-400">
                  {c.description || 'Promotional coupon code'}
                </p>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5 flex justify-between">
                  <span>Valid Until: {c.validUntil}</span>
                  <span>{c.currentUses || 0} uses</span>
                </div>
              </div>
            ))}
          </div>

          {/* Create Coupon Modal */}
          {isCreatingCoupon && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <form onSubmit={handleCreateCoupon} className="w-full max-w-md bg-[#161722] border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-black text-white">Create New Coupon</h3>
                  <button type="button" onClick={() => setIsCreatingCoupon(false)} className="text-zinc-400 hover:text-white">✕</button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AVXSUMMER2026"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Discount Amount (₹)</label>
                  <input
                    type="number"
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(e.target.value)}
                    placeholder="200"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    placeholder="Reason or campaign note"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCoupon(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCoupon}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-extrabold text-xs shadow-lg"
                  >
                    {savingCoupon ? 'Creating...' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: REWARDS */}
      {activeTab === 'REWARDS' && (
        <div className="p-6 rounded-3xl bg-[#13141F] border border-white/10 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-400" />
                <span>Rewards & Creator Incentives</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Reward points, referral bonuses, and student publishing milestone incentives.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Student Milestone Reward</span>
              <div className="text-xl font-black text-cyan-300">500 Points</div>
              <p className="text-xs text-zinc-400">Awarded on publishing first verified educational app.</p>
            </div>
            <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Developer Referral</span>
              <div className="text-xl font-black text-purple-300">1,000 Points</div>
              <p className="text-xs text-zinc-400">Awarded when referred studio completes commercial verification.</p>
            </div>
            <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Redemption Ratio</span>
              <div className="text-xl font-black text-emerald-300">10 Pts = ₹1</div>
              <p className="text-xs text-zinc-400">Points redeemable for verification and promotion credits.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: COMMISSION SETTINGS */}
      {activeTab === 'COMMISSION_SETTINGS' && (
        <form onSubmit={handleSaveCommission} className="p-6 rounded-3xl bg-[#13141F] border border-white/10 space-y-5 animate-fadeIn">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Platform Commission Settings</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live percentage rates retained by AVANYX Store upon transaction clearance.
            </p>
          </div>

          {commissionSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{commissionSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">App Sale Commission (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={commissionForm.appSaleCommission}
                onChange={(e) => setCommissionForm((prev) => ({ ...prev, appSaleCommission: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">In-App Commission (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={commissionForm.inAppCommission}
                onChange={(e) => setCommissionForm((prev) => ({ ...prev, inAppCommission: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Subscription Commission (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={commissionForm.subscriptionCommission}
                onChange={(e) => setCommissionForm((prev) => ({ ...prev, subscriptionCommission: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Promotion Commission (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={commissionForm.promotionCommission}
                onChange={(e) => setCommissionForm((prev) => ({ ...prev, promotionCommission: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-black"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingCommission}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-extrabold text-xs shadow-lg transition active:scale-95"
            >
              {isSavingCommission ? 'Saving...' : 'Save Commission Rates'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
