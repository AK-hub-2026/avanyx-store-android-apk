import React, { useState, useEffect } from 'react';
import {
  Receipt,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Calendar,
  CreditCard,
  Layers,
  Copy,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BillingPurchase, BillingSubscription } from '../types';
import { getUserPurchases, getUserSubscriptions } from '../services/billingService';
import { AvanyxLogo } from '../components/AvanyxLogo';

export const PurchaseHistoryScreen: React.FC = () => {
  const { user, setCurrentTab } = useStore();
  const [purchases, setPurchases] = useState<BillingPurchase[]>([]);
  const [subscriptions, setSubscriptions] = useState<BillingSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'IN_APP' | 'SUBSCRIPTIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BillingPurchase | null>(null);

  const loadHistory = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [pList, sList] = await Promise.all([
        getUserPurchases(user.id),
        getUserSubscriptions(user.id)
      ]);
      setPurchases(pList);
      setSubscriptions(sList);
    } catch (err) {
      console.error('Failed to load user purchase history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredPurchases = purchases.filter((p) => {
    if (filterType === 'SUBSCRIPTIONS') return false;
    if (filterType === 'IN_APP' && p.productType !== 'IN_APP') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.productName.toLowerCase().includes(q) ||
      p.appName.toLowerCase().includes(q) ||
      p.purchaseToken.toLowerCase().includes(q) ||
      p.utr.toLowerCase().includes(q)
    );
  });

  const filteredSubscriptions = subscriptions.filter((s) => {
    if (filterType === 'IN_APP') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.productName.toLowerCase().includes(q) ||
      s.appName.toLowerCase().includes(q) ||
      s.planId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#6750A4]/15 via-[#6750A4]/5 to-transparent border border-black/10 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#6750A4] text-white flex items-center justify-center shadow-lg shadow-[#6750A4]/30">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#1D1B20] dark:text-white">
                Purchase History & Billing
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Live Ledger
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              All your in-app purchases, recurring subscriptions, and verified payment receipts.
            </p>
          </div>
        </div>

        <button
          onClick={loadHistory}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'ALL'
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            All Transactions ({purchases.length + subscriptions.length})
          </button>
          <button
            onClick={() => setFilterType('IN_APP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'IN_APP'
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            In-App Purchases ({purchases.filter((p) => p.productType === 'IN_APP').length})
          </button>
          <button
            onClick={() => setFilterType('SUBSCRIPTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'SUBSCRIPTIONS'
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, app, token..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
          />
        </div>
      </div>

      {/* Subscriptions Section (if any and filter allows) */}
      {filterType !== 'IN_APP' && filteredSubscriptions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#6750A4]" />
            <span>Active & Managed Subscriptions</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      {sub.appName}
                    </span>
                    <h4 className="text-base font-extrabold text-[#1D1B20] dark:text-white">
                      {sub.productName}
                    </h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      sub.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : sub.status === 'CANCELLED'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-zinc-500/15 text-zinc-500'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-black/5 dark:border-white/5 text-zinc-500">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Next Billing</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Billing Cycle</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {sub.billingCycle} (₹{sub.amount})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-App Purchases & Orders List */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-[#6750A4]" />
          <span>In-App Purchases & Transactions</span>
        </h3>

        {filteredPurchases.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6750A4]/10 text-[#6750A4] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold">No purchase records found</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              You haven't made any in-app purchases yet. Explore our featured apps and games on the store!
            </p>
            <button
              onClick={() => setCurrentTab('HOME')}
              className="px-5 py-2.5 rounded-xl bg-[#6750A4] text-white text-xs font-bold hover:bg-[#523e85] transition-colors"
            >
              Browse Apps & Games
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-black/10 dark:border-white/10 shadow-sm hover:border-[#6750A4]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#6750A4]/10 text-[#6750A4] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-[#1D1B20] dark:text-white">
                        {purchase.productName}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          purchase.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : purchase.paymentStatus === 'PENDING_VERIFICATION'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {purchase.paymentStatus}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {purchase.appName} • {new Date(purchase.createdAt).toLocaleDateString()} at{' '}
                      {new Date(purchase.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-zinc-400">
                      <span>Token: {purchase.purchaseToken}</span>
                      <button
                        onClick={() => handleCopy(purchase.purchaseToken)}
                        className="hover:text-black dark:hover:text-white"
                      >
                        {copiedToken === purchase.purchaseToken ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-black/5 dark:border-white/5">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-black text-[#6750A4] dark:text-[#D0BCFF] block">
                      ₹{purchase.amount}
                    </span>
                    <span className="text-[10px] text-zinc-400">UTR: {purchase.utr}</span>
                  </div>

                  <button
                    onClick={() => setSelectedItem(purchase)}
                    className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <span>Receipt</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1C1B1F] text-[#1D1B20] dark:text-[#E6E1E5] rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <AvanyxLogo className="w-5 h-5 text-[#6750A4]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#6750A4]">
                  AVANYX Billing Receipt
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#6750A4]/10 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6750A4] tracking-wider">
                  Amount Paid
                </span>
                <h3 className="text-2xl font-black text-[#6750A4] dark:text-[#D0BCFF]">
                  ₹{selectedItem.amount}
                </h3>
                <span className="text-[10px] text-zinc-500">
                  Status: {selectedItem.paymentStatus}
                </span>
              </div>

              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Product:</span>
                  <span className="font-bold">{selectedItem.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Application:</span>
                  <span className="font-bold">{selectedItem.appName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Purchase Token:</span>
                  <span className="font-mono font-bold text-[#6750A4]">{selectedItem.purchaseToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">UTR / Ref:</span>
                  <span className="font-mono font-bold">{selectedItem.utr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Timestamp:</span>
                  <span>{new Date(selectedItem.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {selectedItem.paymentScreenshotUrl && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Payment Proof</span>
                  <img
                    src={selectedItem.paymentScreenshotUrl}
                    alt="Payment Proof"
                    className="w-full h-32 object-contain rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-3 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-bold text-xs shadow-md transition-all"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryScreen;
