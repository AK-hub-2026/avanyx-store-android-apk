import React, { useState, useEffect } from 'react';
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Code2,
  Terminal,
  Globe,
  Save,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { CreatorApiKey } from '../../types';
import {
  fetchCreatorApiKey,
  generateOrRotateApiKey,
  updateApiKeySettings
} from '../../services/firestoreService';

interface ApiCenterTabProps {
  creatorUid: string;
  creatorName: string;
  creatorType: 'DEVELOPER' | 'STUDENT';
}

export const ApiCenterTab: React.FC<ApiCenterTabProps> = ({
  creatorUid,
  creatorName,
  creatorType
}) => {
  const [apiKeyData, setApiKeyData] = useState<CreatorApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSavingUrls, setIsSavingUrls] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchCreatorApiKey(creatorUid, creatorType)
      .then((key) => {
        if (mounted) {
          if (key) {
            setApiKeyData(key);
            setCallbackUrl(key.purchaseCallbackUrl || '');
            setWebhookUrl(key.webhookUrl || '');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch creator API key:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [creatorUid, creatorType]);

  const handleGenerateOrRotate = async () => {
    setIsRotating(true);
    setSaveSuccess(null);
    setSaveError(null);
    setShowRotateConfirm(false);
    try {
      const generated = await generateOrRotateApiKey(creatorUid, creatorName, creatorType, {
        callbackUrl: callbackUrl.trim(),
        webhookUrl: webhookUrl.trim()
      });
      setApiKeyData(generated);
      setCallbackUrl(generated.purchaseCallbackUrl || '');
      setWebhookUrl(generated.webhookUrl || '');
      setSaveSuccess(
        apiKeyData
          ? 'API Key successfully rotated! Please update your app configuration.'
          : 'New API Key generated successfully!'
      );
    } catch (err: any) {
      setSaveError(err.message || 'Failed to generate API Key');
    } finally {
      setIsRotating(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyData) return;
    setIsSavingUrls(true);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      await updateApiKeySettings(creatorUid, creatorType, {
        purchaseCallbackUrl: callbackUrl.trim(),
        webhookUrl: webhookUrl.trim()
      });
      setApiKeyData((prev) =>
        prev
          ? {
              ...prev,
              purchaseCallbackUrl: callbackUrl.trim(),
              webhookUrl: webhookUrl.trim()
            }
          : null
      );
      setSaveSuccess('Callback and Webhook URLs updated successfully in live Firestore!');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update endpoint URLs');
    } finally {
      setIsSavingUrls(false);
    }
  };

  const copyToClipboard = (text: string, type: 'KEY' | 'PROJECT') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'KEY') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedProjectId(true);
      setTimeout(() => setCopiedProjectId(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1E112A] via-[#141220] to-[#0D0B14] border border-purple-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9333EA] to-[#EC4899] text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>API Center & SDK Credentials</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-[#C084FC] border border-purple-500/30">
                    {creatorType} PRODUCTION
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Manage live API credentials for AVANYX Pay SDK and server-side verification webhooks.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {apiKeyData ? (
              <button
                type="button"
                onClick={() => setShowRotateConfirm(true)}
                disabled={isRotating}
                className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 font-extrabold text-xs flex items-center gap-2 transition active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                <span>Rotate API Key</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateOrRotate}
                disabled={isRotating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:from-[#A855F7] hover:to-[#F43F5E] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/30 transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate API Key</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Rotate Confirmation Modal */}
      {showRotateConfirm && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Confirm API Key Rotation
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Rotating your API Key immediately invalidates your current key. Any active applications using the old key will fail to authenticate with AVANYX Pay SDK until updated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end pt-1">
            <button
              onClick={() => setShowRotateConfirm(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateOrRotate}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs transition"
            >
              Confirm Rotate
            </button>
          </div>
        </div>
      )}

      {/* Main Credentials Panel */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 text-xs font-bold flex flex-col items-center justify-center gap-2 bg-[#12111A] rounded-3xl border border-white/5">
          <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
          <span>Loading credentials from live Firestore...</span>
        </div>
      ) : apiKeyData ? (
        <div className="space-y-6">
          {/* Key Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Key Box */}
            <div className="p-5 rounded-3xl bg-[#13141F] border border-white/10 space-y-3 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span>Production API Key</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {apiKeyData.sdkStatus}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs">
                <span className="text-purple-300 truncate tracking-wide">
                  {apiKeyData.apiKey}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(apiKeyData.apiKey, 'KEY')}
                  className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition shrink-0"
                  title="Copy API Key"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Keep secret. Pass in header <code className="text-purple-400">X-Avanyx-Api-Key</code> or initialize SDK.
              </p>
            </div>

            {/* Project ID Box */}
            <div className="p-5 rounded-3xl bg-[#13141F] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Project ID</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  {apiKeyData.billingStatus}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs">
                <span className="text-cyan-300 truncate">
                  {apiKeyData.projectId}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(apiKeyData.projectId, 'PROJECT')}
                  className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition shrink-0"
                  title="Copy Project ID"
                >
                  {copiedProjectId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Public app identifier linked to your developer billing profile.
              </p>
            </div>
          </div>

          {/* Status Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-3xl bg-[#13141F] border border-white/10 text-center">
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">SDK Status</span>
              <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {apiKeyData.sdkStatus}
              </span>
            </div>
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Billing Status</span>
              <span className="text-xs font-black text-purple-400 mt-0.5 block">
                {apiKeyData.billingStatus}
              </span>
            </div>
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Creator Type</span>
              <span className="text-xs font-black text-white mt-0.5 block">
                {apiKeyData.creatorType}
              </span>
            </div>
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Last Rotated</span>
              <span className="text-xs font-mono text-zinc-400 mt-0.5 block truncate">
                {apiKeyData.lastRotatedAt ? new Date(apiKeyData.lastRotatedAt).toLocaleDateString() : 'Initial'}
              </span>
            </div>
          </div>

          {/* Webhooks & Callbacks Form */}
          <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-[#13141F] border border-white/10 space-y-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Integration Endpoints</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure your server callbacks to receive real-time purchase verification notifications.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Purchase Callback URL
                </label>
                <input
                  type="url"
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  placeholder="https://yourserver.com/api/avanyx/callback"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  URL invoked by AVANYX client when in-app purchase completes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Webhook URL (Server-to-Server)
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://yourserver.com/api/avanyx/webhook"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Server-to-server webhook receiving signed JSON payloads on purchase verification and refund events.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingUrls}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] hover:from-[#A855F7] hover:to-[#9333EA] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25 transition active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingUrls ? 'Saving...' : 'Save Endpoints'}</span>
              </button>
            </div>
          </form>

          {/* Quick SDK Quickstart Code snippet */}
          <div className="p-6 rounded-3xl bg-[#0F1017] border border-white/10 space-y-3">
            <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>AVANYX Pay SDK Quickstart</span>
            </h4>
            <div className="p-4 rounded-2xl bg-black/70 border border-white/5 font-mono text-[11px] text-zinc-300 space-y-2 overflow-x-auto">
              <div className="text-zinc-500">// 1. Initialize AVANYX Pay in your Application</div>
              <div className="text-purple-400">AVANYX.init&#123;</div>
              <div className="pl-4">apiKey: <span className="text-emerald-400">"{apiKeyData.apiKey}"</span>,</div>
              <div className="pl-4">projectId: <span className="text-cyan-400">"{apiKeyData.projectId}"</span></div>
              <div className="text-purple-400">&#125;;</div>
              <div className="text-zinc-500 pt-2">// 2. Trigger purchase popup</div>
              <div className="text-purple-400">await AVANYX.purchase(&#123;</div>
              <div className="pl-4">productId: <span className="text-emerald-400">"premium_upgrade"</span>,</div>
              <div className="pl-4">price: 99</div>
              <div className="text-purple-400">&#125;);</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-[#13141F] rounded-3xl border border-white/10 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-400 mx-auto flex items-center justify-center">
            <Key className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-black text-white">No API Key Generated Yet</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Generate your unique production credentials to integrate AVANYX Pay into your published Android applications and games.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateOrRotate}
            disabled={isRotating}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black text-xs shadow-lg shadow-purple-500/30 transition hover:scale-105 active:scale-95"
          >
            {isRotating ? 'Generating API Credentials...' : 'Generate First API Key'}
          </button>
        </div>
      )}
    </div>
  );
};
