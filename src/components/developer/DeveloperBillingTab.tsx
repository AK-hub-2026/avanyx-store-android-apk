import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  Plus,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code,
  ShieldCheck,
  RefreshCw,
  Edit2,
  Tag,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  BillingProduct,
  BillingPurchase,
  BillingSubscription,
  StoreApp,
  DeveloperPayout,
  DeveloperPayoutSetting,
  PayoutMethod
} from '../../types';
import {
  getBillingProductsByDeveloper,
  getDeveloperPurchases,
  getDeveloperSubscriptions,
  createBillingProduct,
  getDeveloperBillingAnalytics,
  DeveloperBillingSummary,
  getDeveloperPayouts,
  getDeveloperPayoutBalance,
  getDeveloperPayoutSettings,
  saveDeveloperPayoutSettings,
  requestDeveloperPayout,
  DeveloperPayoutBalance
} from '../../services/billingService';
import { AvanyxLogo } from '../AvanyxLogo';

export const DeveloperBillingTab: React.FC = () => {
  const { user, apps } = useStore();
  const developerUid = user?.id || '';
  const currentDeveloperApps = apps.filter(
    (a: StoreApp) => a.developerUid === developerUid || a.developer === user?.name || a.developer === user?.organizationName
  );

  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [purchases, setPurchases] = useState<BillingPurchase[]>([]);
  const [subscriptions, setSubscriptions] = useState<BillingSubscription[]>([]);
  const [payouts, setPayouts] = useState<DeveloperPayout[]>([]);
  const [payoutBalance, setPayoutBalance] = useState<DeveloperPayoutBalance>({
    grossRevenue: 0,
    commissionAmount: 0,
    netRevenue: 0,
    availableForPayout: 0,
    pendingVerification: 0,
    totalWithdrawn: 0,
    pendingPayoutRequests: 0,
    platformFeePercent: 10,
    netEarningsRate: 90
  });
  const [payoutSettings, setPayoutSettings] = useState<DeveloperPayoutSetting | null>(null);

  const [summary, setSummary] = useState<DeveloperBillingSummary>({
    totalRevenue: 0,
    totalPurchases: 0,
    pendingRevenue: 0,
    pendingPurchasesCount: 0,
    subscriptionCount: 0,
    activeSubscriptionsCount: 0,
    topSellingProducts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PRODUCTS' | 'TRANSACTIONS' | 'PAYOUTS' | 'SDK'>('OVERVIEW');
  const [sdkLanguage, setSdkLanguage] = useState<'KOTLIN' | 'JAVA' | 'FLUTTER' | 'TYPESCRIPT'>('KOTLIN');

  // Payout request modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmountInput, setPayoutAmountInput] = useState<number>(500);
  const [payoutMethodInput, setPayoutMethodInput] = useState<PayoutMethod>('UPI');
  const [payoutUpiInput, setPayoutUpiInput] = useState('');
  const [payoutAccountInput, setPayoutAccountInput] = useState('');
  const [payoutIfscInput, setPayoutIfscInput] = useState('');
  const [payoutBankNameInput, setPayoutBankNameInput] = useState('');
  const [payoutHolderNameInput, setPayoutHolderNameInput] = useState(user?.organizationName || user?.name || '');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // Create Product Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [productIdInput, setProductIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [typeInput, setTypeInput] = useState<'IN_APP' | 'SUBSCRIPTION'>('IN_APP');
  const [priceInput, setPriceInput] = useState<number>(99);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [featuresInput, setFeaturesInput] = useState<string>('No Ads, Premium Content, Extra Features');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const isVerifiedDeveloper = user?.verifiedDeveloper || user?.role === 'VERIFIED_DEVELOPER' || user?.role === 'ADMIN';

  const loadData = async () => {
    if (!developerUid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [prodList, purchList, subList, analytics, poList, poBal, poSet] = await Promise.all([
        getBillingProductsByDeveloper(developerUid),
        getDeveloperPurchases(developerUid),
        getDeveloperSubscriptions(developerUid),
        getDeveloperBillingAnalytics(developerUid),
        getDeveloperPayouts(developerUid),
        getDeveloperPayoutBalance(developerUid),
        getDeveloperPayoutSettings(developerUid)
      ]);
      setProducts(prodList);
      setPurchases(purchList);
      setSubscriptions(subList);
      setSummary(analytics);
      setPayouts(poList);
      setPayoutBalance(poBal);
      if (poSet) {
        setPayoutSettings(poSet);
        if (poSet.upiId) setPayoutUpiInput(poSet.upiId);
        if (poSet.bankAccountNumber) setPayoutAccountInput(poSet.bankAccountNumber);
        if (poSet.bankIfsc) setPayoutIfscInput(poSet.bankIfsc);
        if (poSet.bankName) setPayoutBankNameInput(poSet.bankName);
        if (poSet.accountHolderName) setPayoutHolderNameInput(poSet.accountHolderName);
        setPayoutMethodInput(poSet.payoutMethod || 'UPI');
      }

      if (currentDeveloperApps.length > 0 && !selectedAppId) {
        setSelectedAppId(currentDeveloperApps[0].id);
      }
    } catch (err) {
      console.error('Error loading developer billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccessMsg(null);

    if (payoutAmountInput < 100) {
      setPayoutError('Minimum withdrawal amount is ₹100.');
      return;
    }
    if (payoutAmountInput > payoutBalance.availableForPayout) {
      setPayoutError(`Amount exceeds available withdrawable balance of ₹${payoutBalance.availableForPayout}.`);
      return;
    }

    if (payoutMethodInput === 'UPI' && !payoutUpiInput.trim()) {
      setPayoutError('Please enter a valid UPI VPA ID (e.g. yourname@okaxis).');
      return;
    }

    if (payoutMethodInput === 'BANK_TRANSFER') {
      if (!payoutAccountInput.trim() || !payoutIfscInput.trim() || !payoutHolderNameInput.trim()) {
        setPayoutError('Bank Account Number, IFSC code, and Beneficiary Name are required.');
        return;
      }
    }

    setIsSubmittingPayout(true);
    try {
      // 1. Auto-save payout settings for convenience
      await saveDeveloperPayoutSettings(developerUid, {
        payoutMethod: payoutMethodInput,
        upiId: payoutUpiInput.trim() || '',
        bankAccountNumber: payoutAccountInput.trim() || '',
        bankIfsc: payoutIfscInput.trim().toUpperCase() || '',
        bankName: payoutBankNameInput.trim() || '',
        accountHolderName: payoutHolderNameInput.trim() || ''
      });

      // 2. Submit payout request to live Firestore
      await requestDeveloperPayout({
        developerUid,
        developerName: user?.organizationName || user?.name || 'Verified Developer',
        developerEmail: user?.email || '',
        amount: payoutAmountInput,
        payoutMethod: payoutMethodInput,
        upiId: payoutUpiInput.trim() || '',
        bankAccountNumber: payoutAccountInput.trim() || '',
        bankIfsc: payoutIfscInput.trim().toUpperCase() || '',
        bankName: payoutBankNameInput.trim() || '',
        accountHolderName: payoutHolderNameInput.trim() || ''
      });

      setPayoutSuccessMsg(`Payout request for ₹${payoutAmountInput} submitted successfully! It will be reviewed by admin.`);
      setShowPayoutModal(false);
      await loadData();
    } catch (err: any) {
      setPayoutError(err.message || 'Failed to submit payout request.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [developerUid, currentDeveloperApps]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cleanId = productIdInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanId) {
      setCreateError('Permanent Product ID is required (e.g. premium_remove_ads).');
      return;
    }
    if (!nameInput.trim()) {
      setCreateError('Product Title is required.');
      return;
    }
    if (priceInput <= 0) {
      setCreateError('Price must be greater than ₹0.');
      return;
    }
    if (!selectedAppId && currentDeveloperApps.length > 0) {
      setCreateError('Please select an associated application.');
      return;
    }

    setIsCreatingProduct(true);
    try {
      const chosenApp = currentDeveloperApps.find((a: StoreApp) => a.id === selectedAppId) || currentDeveloperApps[0];
      const featureList = featuresInput
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      await createBillingProduct({
        productId: cleanId,
        name: nameInput.trim(),
        description: descInput.trim() || 'In-app item or subscription unlocked by AVANYX Billing.',
        type: typeInput,
        price: priceInput,
        originalPrice: priceInput * 2,
        discountPercent: 50,
        appId: chosenApp?.id || 'avanyx.app',
        appName: chosenApp?.name || 'My Android App',
        developerUid: developerUid,
        developerName: user?.organizationName || user?.name || 'Verified Developer',
        iconUrl: chosenApp?.iconUrl || '/avanyx-logo.svg',
        features: featureList.length > 0 ? featureList : ['Premium Unlock', 'Ad-Free'],
        status: 'ACTIVE'
      });

      setShowCreateModal(false);
      setProductIdInput('');
      setNameInput('');
      setDescInput('');
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to publish billing product.');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const copySdkSnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getKotlinSnippet = () => `// Kotlin Android Integration (AVANYX Billing SDK)
import com.avanyx.billing.AVANYX

// 1. Initialize SDK in Application or MainActivity
AVANYX.initialize(
    context = this,
    apiKey = "YOUR_AVANYX_API_KEY",
    appId = "${currentDeveloperApps[0]?.id || 'com.example.myapp'}"
)

// 2. Launch In-App Purchase Flow
AVANYX.purchase(
    productId = "${products[0]?.productId || 'premium_remove_ads'}",
    type = AVANYX.ProductType.IN_APP
) { result ->
    when (result.status) {
        AVANYX.Status.SUCCESS -> {
            // Unlock premium features
            unlockPremiumContent(result.purchaseToken)
        }
        AVANYX.Status.PENDING_VERIFICATION -> {
            // Show verification banner
            showPendingVerificationDialog()
        }
        AVANYX.Status.FAILED -> {
            showError(result.message)
        }
    }
}`;

  const getJavaSnippet = () => `// Java Android Integration (AVANYX Billing SDK)
import com.avanyx.billing.AVANYX;
import com.avanyx.billing.BillingCallback;

// Initialize
AVANYX.initialize(this, "YOUR_AVANYX_API_KEY", "${currentDeveloperApps[0]?.id || 'com.example.myapp'}");

// Purchase
AVANYX.purchase("${products[0]?.productId || 'premium_remove_ads'}", new BillingCallback() {
    @Override
    public void onResult(BillingResult result) {
        if (result.isSuccess()) {
            unlockContent(result.getPurchaseToken());
        }
    }
});`;

  const getFlutterSnippet = () => `// Flutter Integration (AVANYX Billing Plugin)
import 'package:avanyx_billing/avanyx_billing.dart';

final avanyx = AvanyxBilling();
await avanyx.initialize(appId: '${currentDeveloperApps[0]?.id || 'com.example.myapp'}');

final response = await avanyx.purchase(
  productId: '${products[0]?.productId || 'premium_remove_ads'}',
  type: ProductType.inApp,
);

if (response.status == PurchaseStatus.success) {
  // Premium unlocked
}`;

  const getTsSnippet = () => `// TypeScript / Web Hybrid Integration
import { AVANYX } from '@avanyx/billing-sdk';

AVANYX.initialize({
  appId: '${currentDeveloperApps[0]?.id || 'com.example.myapp'}',
  appName: '${currentDeveloperApps[0]?.name || 'MyApp'}'
});

const result = await AVANYX.purchase({
  productId: '${products[0]?.productId || 'premium_remove_ads'}',
  price: 99,
  type: 'IN_APP'
});

console.log('Purchase result:', result);`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#6750A4]/15 via-[#6750A4]/5 to-transparent border border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#1D1B20] dark:text-white">
              Billing API & Monetization Hub
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              v3.7.0 Live
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Publish In-App Purchases, recurring subscriptions, manage payouts, and track verified customer revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white text-xs font-bold shadow-md shadow-[#6750A4]/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product / Plan</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-2 overflow-x-auto">
        {(
          [
            { key: 'OVERVIEW', label: 'Billing Overview' },
            { key: 'PRODUCTS', label: `In-App Products (${products.length})` },
            { key: 'TRANSACTIONS', label: `Transactions (${purchases.length})` },
            { key: 'PAYOUTS', label: `Payout Center (₹${payoutBalance.availableForPayout})` },
            { key: 'SDK', label: 'Developer SDK & Integration' }
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* PART C — Commission System Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Gross Revenue */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase">Gross Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#1D1B20] dark:text-white">
                ₹{(payoutBalance.grossRevenue || summary.totalRevenue).toLocaleString()}
              </h3>
              <p className="text-[11px] text-zinc-500">Total customer transaction volume</p>
            </div>

            {/* 2. Platform Commission */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase">Commission ({payoutBalance.platformFeePercent}%)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ₹{payoutBalance.commissionAmount.toLocaleString()}
              </h3>
              <p className="text-[11px] text-zinc-500">AVANYX Store ecosystem fee</p>
            </div>

            {/* 3. Net Revenue */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase">Net Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{payoutBalance.netRevenue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-zinc-500">Developer earnings ({payoutBalance.netEarningsRate}%)</p>
            </div>

            {/* 4. Pending Payout */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase">Pending Payout</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
                ₹{(payoutBalance.pendingPayoutRequests + payoutBalance.availableForPayout).toLocaleString()}
              </h3>
              <p className="text-[11px] text-zinc-500">
                ₹{payoutBalance.availableForPayout.toLocaleString()} available • ₹{payoutBalance.pendingPayoutRequests.toLocaleString()} in transit
              </p>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase font-bold">Total Purchases</span>
                <p className="text-lg font-black text-[#1D1B20] dark:text-white mt-0.5">{summary.totalPurchases} orders</p>
              </div>
              <CreditCard className="w-5 h-5 text-zinc-400" />
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase font-bold">Awaiting Verification</span>
                <p className="text-lg font-black text-amber-500 mt-0.5">₹{summary.pendingRevenue.toLocaleString()}</p>
              </div>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase font-bold">Active Subscriptions</span>
                <p className="text-lg font-black text-[#6750A4] dark:text-[#D0BCFF] mt-0.5">{summary.activeSubscriptionsCount} members</p>
              </div>
              <Sparkles className="w-5 h-5 text-[#6750A4]" />
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#6750A4]" />
              <span>Top Selling Products & Revenue Share</span>
            </h3>

            {summary.topSellingProducts.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No product sales recorded yet. Once customers make in-app purchases, top products will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {summary.topSellingProducts.map((item) => (
                  <div key={item.productId} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#1D1B20] dark:text-white">{item.productName} ({item.productId})</span>
                      <span>₹{item.revenue} ({item.salesCount} sales • {item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6750A4] to-[#9a82db] rounded-full"
                        style={{ width: `${Math.max(item.percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: PRODUCTS */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Every In-App Purchase and Subscription has a permanent immutable <code className="font-bold">productId</code> stored in live Firestore.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Product</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 space-y-3">
              <Package className="w-10 h-10 mx-auto text-zinc-400" />
              <h4 className="text-sm font-bold">No In-App Products Created Yet</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Create in-app products such as 'premium_remove_ads', 'coins_pack_100', or recurring subscriptions.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold"
              >
                Create First Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        {prod.appName} • {prod.type}
                      </span>
                      <h4 className="text-base font-extrabold text-[#1D1B20] dark:text-white">
                        {prod.name}
                      </h4>
                      <code className="text-[11px] font-mono font-bold text-[#6750A4] dark:text-[#D0BCFF]">
                        {prod.productId}
                      </code>
                    </div>

                    <span className="text-base font-black text-[#6750A4] dark:text-[#D0BCFF]">
                      ₹{prod.price}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {prod.description}
                  </p>

                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Created: {new Date(prod.createdAt).toLocaleDateString()}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {prod.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: TRANSACTIONS */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-3">
          {purchases.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10">
              <p className="text-xs text-zinc-500">No transactions recorded for your apps yet.</p>
            </div>
          ) : (
            purchases.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-[#1D1B20] dark:text-white block">
                    {p.productName} ({p.appName})
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Token: {p.purchaseToken} • UTR: {p.utr}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-[#6750A4] dark:text-[#D0BCFF] block">
                    ₹{p.amount}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600">
                    {p.paymentStatus}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUBTAB 4: SDK INTEGRATION */}
      {activeTab === 'SDK' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['KOTLIN', 'JAVA', 'FLUTTER', 'TYPESCRIPT'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSdkLanguage(lang)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sdkLanguage === lang
                      ? 'bg-[#6750A4] text-white shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const code =
                  sdkLanguage === 'KOTLIN'
                    ? getKotlinSnippet()
                    : sdkLanguage === 'JAVA'
                    ? getJavaSnippet()
                    : sdkLanguage === 'FLUTTER'
                    ? getFlutterSnippet()
                    : getTsSnippet();
                copySdkSnippet(code);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black/90 text-emerald-400 font-mono text-xs overflow-x-auto border border-black/10 dark:border-white/10 shadow-inner">
            <pre>
              {sdkLanguage === 'KOTLIN' && getKotlinSnippet()}
              {sdkLanguage === 'JAVA' && getJavaSnippet()}
              {sdkLanguage === 'FLUTTER' && getFlutterSnippet()}
              {sdkLanguage === 'TYPESCRIPT' && getTsSnippet()}
            </pre>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1C1B1F] text-[#1D1B20] dark:text-[#E6E1E5] rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#6750A4]" />
                <h3 className="text-base font-black text-[#1D1B20] dark:text-white">
                  Publish In-App Product or Plan
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              {/* Product ID (Permanent & Immutable) */}
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Permanent Product ID (Immutable) *
                </label>
                <input
                  type="text"
                  required
                  value={productIdInput}
                  onChange={(e) => setProductIdInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder="e.g. premium_remove_ads, coins_pack_100"
                  className="w-full px-3.5 py-2.5 rounded-xl font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Once published, Product IDs are permanent and cannot be renamed.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Product Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Premium Remove Ads"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              {/* Type & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Product Type *
                  </label>
                  <select
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-bold focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  >
                    <option value="IN_APP">In-App Purchase (One-time)</option>
                    <option value="SUBSCRIPTION">Recurring Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={priceInput}
                    onChange={(e) => setPriceInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-bold focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
              </div>

              {/* App Selection */}
              {currentDeveloperApps.length > 0 && (
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Target Application *
                  </label>
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-bold"
                  >
                    {currentDeveloperApps.map((a: StoreApp) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.packageName || a.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Features (comma separated) */}
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Features List (comma-separated)
                </label>
                <input
                  type="text"
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="No Ads, Premium Content, Extra Features"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="Unlock all premium features and remove ads from the app."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                />
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-black/5 dark:bg-white/5 font-bold hover:bg-black/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="flex-[2] py-3 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isCreatingProduct ? 'Publishing...' : 'Publish to Live Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperBillingTab;
