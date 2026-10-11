import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ConnectedApp, AvanyxEcosystemProduct } from '../../types/identity';
import { AVANYX_ECOSYSTEM_PRODUCTS } from '../../data/avanyxEcosystemData';
import {
  fetchConnectedApps,
  revokeConnectedApp,
  grantConnectedAppAccess
} from '../../services/identityService';
import {
  Layers,
  ShoppingBag,
  Sparkles,
  Code2,
  Gamepad2,
  CheckCircle2,
  Shield,
  Trash2,
  ExternalLink,
  Lock,
  Eye,
  KeyRound,
  RefreshCw,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

export const AvanyxIdentityConnectedApps: React.FC = () => {
  const { user, isAuthenticated, setCurrentTab } = useStore();
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<AvanyxEcosystemProduct | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadConnected = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await fetchConnectedApps(user.id);
      setConnectedApps(list);
    } catch (err) {
      console.warn('Error loading connected apps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadConnected();
    }
  }, [user?.id]);

  const handleRevoke = async (appId: string, appName: string) => {
    if (!user?.id) return;
    setRevokingId(appId);
    try {
      const updated = await revokeConnectedApp(user.id, appId);
      setConnectedApps(updated);
      setActionNotice(`Revoked AVANYX Identity access for "${appName}".`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.warn('Error revoking app:', err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleReAuthorize = async (product: AvanyxEcosystemProduct) => {
    if (!user?.id) return;
    setRevokingId(product.id);
    try {
      const updated = await grantConnectedAppAccess(
        user.id,
        {
          clientId: product.clientId,
          name: product.name,
          description: product.description,
          isFirstParty: true
        },
        product.defaultScopes
      );
      setConnectedApps(updated);
      setActionNotice(`Re-authorized Single Sign-On for "${product.name}".`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.warn('Error authorizing app:', err);
    } finally {
      setRevokingId(null);
    }
  };

  const getProductIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-purple-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-sky-400" />;
      case 'Code2':
        return <Code2 className="w-5 h-5 text-emerald-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-amber-400" />;
      default:
        return <Layers className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Notice */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. VISUAL ECOSYSTEM HIERARCHY TREE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#121118] via-[#1E1B26] to-[#0A0A0D] border border-amber-500/20 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Universal Identity Architecture v0.02</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              AVANYX Connected Product Tree
            </h3>
            <p className="text-xs sm:text-sm text-[#CAC4D0] max-w-xl">
              One universal master account safeguards and powers authentication across all first-party products and third-party developer integrations.
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-right shrink-0">
            <span className="text-[10px] font-bold uppercase text-amber-400 block">UID Checksum</span>
            <span className="font-mono text-xs text-white">{user?.id ? `${user.id.substring(0, 10)}...` : 'GUEST_UNIFIED'}</span>
          </div>
        </div>

        {/* ASCII / Graphical Hierarchy Representation */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300 overflow-x-auto space-y-2">
          <div className="text-amber-400 font-bold flex items-center gap-2">
            <span>AVANYX Identity (Root Auth Provider)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">v0.02 SSO</span>
          </div>
          <div className="text-slate-400 pl-4 border-l border-amber-500/30 space-y-2.5 py-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-white font-sans font-bold flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-400" /> AVANYX Store
              </span>
              <span className="text-[10px] text-emerald-400 font-sans font-bold px-2 py-0.5 rounded bg-emerald-500/10">Connected</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white font-sans font-bold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Aether Platform
              </span>
              <span className="text-[10px] text-sky-400 font-sans font-bold px-2 py-0.5 rounded bg-sky-500/10">SSO Ready</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white font-sans font-bold flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" /> Infinity Studio
              </span>
              <span className="text-[10px] text-indigo-400 font-sans font-bold px-2 py-0.5 rounded bg-indigo-500/10">SDK Linked</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white font-sans font-bold flex items-center gap-2">
                <Gamepad2 className="w-3.5 h-3.5 text-amber-400" /> Bomb Rush 3D
              </span>
              <span className="text-[10px] text-amber-400 font-sans font-bold px-2 py-0.5 rounded bg-amber-500/10">Cloud Saves</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-sans font-medium flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-purple-400" /> Future Apps (OAuth/OIDC)
              </span>
              <span className="text-[10px] text-slate-400 font-sans px-2 py-0.5 rounded bg-white/5">Open API</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ECOSYSTEM PRODUCTS CARDS */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Ecosystem Products & SSO Grants
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVANYX_ECOSYSTEM_PRODUCTS.map((prod) => {
            const connectedInfo = connectedApps.find((c) => c.clientId === prod.clientId);
            const isConn = connectedInfo && connectedInfo.status !== 'REVOKED';

            return (
              <div
                key={prod.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-slate-200 dark:border-white/5 hover:border-amber-500/30 transition-all shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 shrink-0">
                        {getProductIcon(prod.iconName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-black text-slate-900 dark:text-white">
                            {prod.name}
                          </h5>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                            {prod.version}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          {prod.tagline}
                        </span>
                      </div>
                    </div>

                    {isConn ? (
                      <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[10px] font-black shrink-0">
                        Connected
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] font-bold shrink-0">
                        Disconnected
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-[#CAC4D0] leading-relaxed">
                    {prod.description}
                  </p>

                  {/* Scopes Preview */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Authorized Scopes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {prod.defaultScopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Client ID: <code className="text-[10px] font-mono">{prod.clientId.substring(0, 16)}...</code>
                  </span>

                  <div className="flex items-center gap-2">
                    {prod.id === 'avanyx-store' ? (
                      <button
                        onClick={() => setCurrentTab('HOME')}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>Open Store</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : isConn ? (
                      <button
                        onClick={() => handleRevoke(connectedInfo!.id, prod.name)}
                        disabled={revokingId === connectedInfo!.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-bold transition"
                      >
                        {revokingId === connectedInfo!.id ? 'Revoking...' : 'Revoke Access'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReAuthorize(prod)}
                        disabled={revokingId === prod.id}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow transition"
                      >
                        {revokingId === prod.id ? 'Connecting...' : 'Authorize SSO'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
