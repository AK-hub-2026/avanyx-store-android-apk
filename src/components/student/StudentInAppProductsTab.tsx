import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreApp, BillingProduct, SubscriptionPlan } from '../../types';
import {
  Package,
  Plus,
  Tag,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  Calendar,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  getBillingProductsByDeveloper,
  createBillingProduct,
  createSubscriptionPlan,
  getSubscriptionPlansByDeveloper
} from '../../services/billingService';

interface StudentInAppProductsTabProps {
  studentApps: StoreApp[];
}

export const StudentInAppProductsTab: React.FC<StudentInAppProductsTabProps> = ({ studentApps }) => {
  const { user } = useStore();
  const studentUid = user?.id || '';

  const [activeSubTab, setActiveSubTab] = useState<'PRODUCTS' | 'SUBSCRIPTIONS'>('PRODUCTS');

  // Products state
  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // New Product Form
  const [selectedAppId, setSelectedAppId] = useState<string>(studentApps[0]?.id || '');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number>(49);
  const [productType, setProductType] = useState<'CONSUMABLE' | 'NON_CONSUMABLE'>('CONSUMABLE');
  const [productDescription, setProductDescription] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSuccess, setProductSuccess] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);

  // Subscriptions state
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // New Subscription Form
  const [subAppId, setSubAppId] = useState<string>(studentApps[0]?.id || '');
  const [subName, setSubName] = useState('');
  const [subPrice, setSubPrice] = useState<number>(99);
  const [subPeriod, setSubPeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME'>('MONTHLY');
  const [subTrialDays, setSubTrialDays] = useState<number>(7);
  const [subFeatures, setSubFeatures] = useState('Unlimited Cloud Sync\nAcademic Pro Templates\nZero Ads');
  const [isSavingSub, setIsSavingSub] = useState(false);
  const [subSuccess, setSubSuccess] = useState<string | null>(null);
  const [subError, setSubError] = useState<string | null>(null);

  const loadData = async () => {
    if (!studentUid) return;
    setLoadingProducts(true);
    setLoadingSubscriptions(true);

    try {
      const [prods, subs] = await Promise.all([
        getBillingProductsByDeveloper(studentUid),
        getSubscriptionPlansByDeveloper(studentUid)
      ]);
      setProducts(prods);
      setSubscriptionPlans(subs);
    } catch (err) {
      console.warn('Error loading student billing items:', err);
    } finally {
      setLoadingProducts(false);
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentUid]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      setProductError('Please select a project application.');
      return;
    }
    if (!productName.trim()) {
      setProductError('Product name is required.');
      return;
    }

    const targetApp = studentApps.find((a) => a.id === selectedAppId);
    if (!targetApp) {
      setProductError('Selected application not found.');
      return;
    }

    setIsSavingProduct(true);
    setProductError(null);
    setProductSuccess(null);

    try {
      const pId = `iap_${targetApp.packageName.replace(/\./g, '_')}_${productName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

      await createBillingProduct({
        productId: pId,
        name: productName.trim(),
        description: productDescription.trim() || `In-App item for ${targetApp.name}`,
        price: Number(productPrice) || 49,
        type: 'IN_APP',
        appId: targetApp.id,
        appName: targetApp.name,
        developerUid: studentUid,
        developerName: user?.name || 'Student Creator',
        iconUrl: targetApp.iconUrl,
        status: 'ACTIVE'
      });

      setProductSuccess(`In-App Product "${productName}" created and synced to live Firestore!`);
      await loadData();
      setTimeout(() => {
        setProductName('');
        setProductDescription('');
        setProductSuccess(null);
        setIsProductModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setProductError(err.message || 'Failed to create billing product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subAppId) {
      setSubError('Please select a project application.');
      return;
    }
    if (!subName.trim()) {
      setSubError('Plan name is required.');
      return;
    }

    const targetApp = studentApps.find((a) => a.id === subAppId);
    if (!targetApp) {
      setSubError('Selected application not found.');
      return;
    }

    setIsSavingSub(true);
    setSubError(null);
    setSubSuccess(null);

    try {
      const featList = subFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const pId = `sub_${targetApp.packageName.replace(/\./g, '_')}_${subName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

      await createSubscriptionPlan({
        productId: pId,
        name: subName.trim(),
        appId: targetApp.id,
        appName: targetApp.name,
        developerUid: studentUid,
        price: Number(subPrice) || 99,
        billingPeriod: subPeriod,
        trialDays: Number(subTrialDays) || 0,
        features: featList.length > 0 ? featList : ['Premium Academic Access', 'Offline Sync'],
        status: 'ACTIVE'
      });

      setSubSuccess(`Subscription Plan "${subName}" created and synced to live Firestore!`);
      await loadData();
      setTimeout(() => {
        setSubName('');
        setSubSuccess(null);
        setIsSubscriptionModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setSubError(err.message || 'Failed to create subscription plan.');
    } finally {
      setIsSavingSub(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-[#1D1B20] dark:text-zinc-100">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>PART A — Student Creator Pro Monetization</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            In-App Products & Subscription Plans
          </h1>
          <p className="text-xs md:text-sm text-white/90">
            Publish digital goods, pro tier upgrades, and recurring membership plans for your student apps and games.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (studentApps.length === 0) {
                alert('Please submit a student project first before creating products.');
                return;
              }
              if (activeSubTab === 'PRODUCTS') {
                setIsProductModalOpen(true);
              } else {
                setIsSubscriptionModalOpen(true);
              }
            }}
            className="px-5 py-3 rounded-2xl bg-white text-slate-950 font-black text-xs transition-all shadow-lg hover:bg-white/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{activeSubTab === 'PRODUCTS' ? 'Create In-App Product' : 'Create Subscription Plan'}</span>
          </button>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-3 border-b border-black/10 dark:border-cyan-500/20 pb-3">
        <button
          onClick={() => setActiveSubTab('PRODUCTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'PRODUCTS'
              ? 'bg-[#6750A4] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
              : 'text-[#49454F] dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          In-App Purchases ({products.length})
        </button>
        <button
          onClick={() => setActiveSubTab('SUBSCRIPTIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'SUBSCRIPTIONS'
              ? 'bg-[#6750A4] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
              : 'text-[#49454F] dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          Subscription Plans ({subscriptionPlans.length})
        </button>
      </div>

      {/* SUBTAB 1: In-App Purchases */}
      {activeSubTab === 'PRODUCTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
              <span>Registered In-App Products ({products.length})</span>
            </h3>
            <span className="text-xs text-zinc-400">Live in AVANYX Billing SDK</span>
          </div>

          {loadingProducts ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading products from Firestore...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 space-y-3">
              <Package className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No In-App Purchase products registered yet. Create consumable or non-consumable items for your student apps.
              </p>
              <button
                onClick={() => {
                  if (studentApps.length === 0) {
                    alert('Please upload a student app first.');
                    return;
                  }
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Create First In-App Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/15 space-y-3 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono font-bold text-cyan-500 dark:text-cyan-400 block truncate">
                          {p.appName || 'Student Project'}
                        </span>
                        <h4 className="font-extrabold text-sm text-[#1D1B20] dark:text-white truncate">
                          {p.name}
                        </h4>
                      </div>
                      <span className="text-base font-black text-[#6750A4] dark:text-cyan-400 shrink-0">
                        ₹{p.price}
                      </span>
                    </div>

                    <p className="text-xs text-[#49454F] dark:text-zinc-400 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-[#0B0F17] text-zinc-500">
                      {p.type}
                    </span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Subscription Plans */}
      {activeSubTab === 'SUBSCRIPTIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6750A4] dark:text-cyan-400" />
              <span>Active Subscription Plans ({subscriptionPlans.length})</span>
            </h3>
            <span className="text-xs text-zinc-400">Live in AVANYX Billing SDK</span>
          </div>

          {loadingSubscriptions ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading subscription plans...</div>
          ) : subscriptionPlans.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 space-y-3">
              <Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No recurring subscription plans created yet. Offer monthly or yearly plans for pro features.
              </p>
              <button
                onClick={() => {
                  if (studentApps.length === 0) {
                    alert('Please upload a student app first.');
                    return;
                  }
                  setIsSubscriptionModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Create First Subscription Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptionPlans.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/15 space-y-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono font-bold text-cyan-500 dark:text-cyan-400 block truncate">
                          {sub.appName}
                        </span>
                        <h4 className="font-extrabold text-sm text-[#1D1B20] dark:text-white truncate">
                          {sub.name}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-[#6750A4] dark:text-cyan-400">
                          ₹{sub.price}
                        </span>
                        <span className="text-[10px] text-zinc-400 block">/{sub.billingPeriod.toLowerCase()}</span>
                      </div>
                    </div>

                    {sub.trialDays && sub.trialDays > 0 ? (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                        {sub.trialDays}-Day Free Trial Included
                      </span>
                    ) : null}

                    <div className="space-y-1 pt-2 border-t border-black/5 dark:border-white/5">
                      {sub.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">{sub.billingPeriod}</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{sub.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Create In-App Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <h3 className="text-base font-black text-[#1D1B20] dark:text-white">New In-App Purchase Product</h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            {productSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
                {productSuccess}
              </div>
            )}

            {productError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
                {productError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Target Application *</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs font-bold text-[#1D1B20] dark:text-white"
                >
                  {studentApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.packageName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. 500 Study Coins, Pro Unlock"
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs text-[#1D1B20] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Price (INR ₹) *</label>
                  <input
                    type="number"
                    min={9}
                    required
                    value={productPrice}
                    onChange={(e) => setProductPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs text-[#1D1B20] dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Item Type</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs font-bold text-[#1D1B20] dark:text-white"
                  >
                    <option value="CONSUMABLE">CONSUMABLE (e.g. coins, energy)</option>
                    <option value="NON_CONSUMABLE">NON_CONSUMABLE (lifetime pro)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="What users unlock when purchasing this in-app item..."
                  className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs text-[#1D1B20] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition disabled:opacity-50"
                >
                  {isSavingProduct ? 'Publishing...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Subscription Plan */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <h3 className="text-base font-black text-[#1D1B20] dark:text-white">New Subscription Plan</h3>
              <button
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            {subSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
                {subSuccess}
              </div>
            )}

            {subError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
                {subError}
              </div>
            )}

            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Target Application *</label>
                <select
                  value={subAppId}
                  onChange={(e) => setSubAppId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs font-bold text-[#1D1B20] dark:text-white"
                >
                  {studentApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.packageName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Student Pro Membership"
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs text-[#1D1B20] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min={9}
                    required
                    value={subPrice}
                    onChange={(e) => setSubPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs text-[#1D1B20] dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Cycle</label>
                  <select
                    value={subPeriod}
                    onChange={(e) => setSubPeriod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs font-bold text-[#1D1B20] dark:text-white"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="LIFETIME">Lifetime</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Trial Days</label>
                  <input
                    type="number"
                    min={0}
                    value={subTrialDays}
                    onChange={(e) => setSubTrialDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs text-[#1D1B20] dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Features Included (One per line)
                </label>
                <textarea
                  rows={3}
                  value={subFeatures}
                  onChange={(e) => setSubFeatures(e.target.value)}
                  placeholder="Unlimited AI assistance&#10;Cloud Sync&#10;Academic badge"
                  className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-[#0B0F17] border border-black/10 dark:border-cyan-500/20 text-xs text-[#1D1B20] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSub}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition disabled:opacity-50"
                >
                  {isSavingSub ? 'Publishing Plan...' : 'Save Subscription Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
