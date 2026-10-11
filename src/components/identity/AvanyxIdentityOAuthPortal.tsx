import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { OAuthClientApp, OAuthScopeDefinition } from '../../types/identity';
import { STANDARD_OAUTH_SCOPES } from '../../data/avanyxEcosystemData';
import {
  fetchOAuthClientApps,
  registerOAuthClientApp,
  generateOIDCIdTokenPayload,
  OPENID_CONNECT_DISCOVERY_SPEC
} from '../../services/identityService';
import {
  KeyRound,
  ShieldCheck,
  Code2,
  Lock,
  Layers,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Plus,
  Server,
  FileCode,
  Terminal,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export const AvanyxIdentityOAuthPortal: React.FC = () => {
  const { user, isAuthenticated } = useStore();
  const [clients, setClients] = useState<OAuthClientApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Register client state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [homepageUrl, setHomepageUrl] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['openid', 'profile', 'email']);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);

  // Consent / Token test dialog simulator
  const [simulatingClientId, setSimulatingClientId] = useState<string>('client_aether_platform_agent_cloud');
  const [simulatingScopes, setSimulatingScopes] = useState<string[]>(['openid', 'profile', 'email', 'avanyx.aether.workspace']);
  const [generatedTokenData, setGeneratedTokenData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'CLIENTS' | 'CONSENT_SIMULATOR' | 'SCOPES' | 'DISCOVERY'>('CLIENTS');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await fetchOAuthClientApps();
      setClients(data);
    } catch (err) {
      console.warn('Error loading OAuth clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !redirectUri.trim() || !user?.id) return;
    setIsSubmittingClient(true);
    try {
      const created = await registerOAuthClientApp({
        clientName: clientName.trim(),
        description: description.trim() || 'Custom AVANYX Ecosystem Application',
        ownerUid: user.id,
        ownerEmail: user.email,
        homepageUrl: homepageUrl.trim() || 'https://developer.avanyx.io',
        redirectUris: [redirectUri.trim()],
        allowedScopes: selectedScopes
      });
      setClients((prev) => [created, ...prev]);
      setShowRegisterModal(false);
      setClientName('');
      setDescription('');
      setHomepageUrl('');
      setRedirectUri('');
    } catch (err) {
      console.warn('Error creating OAuth client:', err);
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const handleGenerateTokenSimulation = () => {
    if (!user) return;
    const token = generateOIDCIdTokenPayload(user, simulatingClientId, simulatingScopes);
    setGeneratedTokenData(token);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Navigation Subtabs */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1B26] border border-black/5 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              OAuth 2.0 & OpenID Connect Developer Portal
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase">
              OIDC v0.02
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#CAC4D0]">
            Standard RFC 6749 / OpenID Connect Core 1.0 provider specifications for future and first-party AVANYX applications.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 text-black text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register New App Client</span>
        </button>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('CLIENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CLIENTS'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Registered Clients ({clients.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('CONSENT_SIMULATOR');
            if (!generatedTokenData && user) handleGenerateTokenSimulation();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CONSENT_SIMULATOR'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>OAuth Consent & Token Sandbox</span>
        </button>
        <button
          onClick={() => setActiveTab('SCOPES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'SCOPES'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Standard Scopes Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('DISCOVERY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DISCOVERY'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>OIDC Discovery (/.well-known)</span>
        </button>
      </div>

      {/* TAB 1: Registered Clients */}
      {activeTab === 'CLIENTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((client) => (
              <div
                key={client.clientId}
                className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-slate-200 dark:border-white/5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {client.clientName}
                      </h4>
                      {client.isFirstParty ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 text-[9px] font-black">
                          FIRST-PARTY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[9px] font-bold">
                          DEVELOPER APP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#CAC4D0]">
                      {client.description}
                    </p>
                  </div>
                </div>

                {/* Client ID & Secret */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Client ID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-800 dark:text-slate-200">{client.clientId}</span>
                      <button
                        onClick={() => handleCopy(client.clientId, `cid_${client.clientId}`)}
                        className="p-1 text-slate-400 hover:text-amber-500 transition"
                      >
                        {copiedText === `cid_${client.clientId}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {client.clientSecretHint && (
                    <div className="flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/5 pt-1.5">
                      <span className="text-[10px] uppercase text-slate-400 font-bold">Client Secret:</span>
                      <span className="text-slate-500">{client.clientSecretHint}</span>
                    </div>
                  )}
                </div>

                {/* Redirect URIs */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Allowed Redirect URIs:</span>
                  <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {client.redirectUris.map((uri, idx) => (
                      <div key={idx} className="truncate bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                        {uri}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scopes */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {client.allowedScopes.map((scope) => (
                    <span
                      key={scope}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[10px] font-mono"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Consent Simulator & ID Token Generator */}
      {activeTab === 'CONSENT_SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulation Configurator & Consent Mock Dialog */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-slate-200 dark:border-white/5 shadow-sm space-y-5">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>OAuth 2.0 Authorization Flow Simulator</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#CAC4D0]">
                Simulate how third-party AVANYX apps request permissions and receive OpenID Connect identity tokens.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Application Client:
                </label>
                <select
                  value={simulatingClientId}
                  onChange={(e) => setSimulatingClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-400"
                >
                  {clients.map((c) => (
                    <option key={c.clientId} value={c.clientId}>
                      {c.clientName} ({c.clientId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Requested Permissions (Scopes):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STANDARD_OAUTH_SCOPES.slice(0, 6).map((scopeObj) => (
                    <label
                      key={scopeObj.scope}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={simulatingScopes.includes(scopeObj.scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSimulatingScopes([...simulatingScopes, scopeObj.scope]);
                          } else {
                            setSimulatingScopes(simulatingScopes.filter((s) => s !== scopeObj.scope));
                          }
                        }}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="font-mono text-[11px] truncate">{scopeObj.scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateTokenSimulation}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 text-black text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 mt-4"
              >
                <KeyRound className="w-4 h-4" />
                <span>Simulate User Consent & Generate ID Token</span>
              </button>
            </div>
          </div>

          {/* Generated Claims & JWT Inspector */}
          <div className="p-6 rounded-3xl bg-[#121118] border border-amber-500/20 text-white shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Decoded OpenID Connect Payload (JWT)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  v0.02 SPEC
                </span>
              </div>

              {generatedTokenData ? (
                <pre className="p-4 rounded-2xl bg-black/60 border border-white/5 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-96">
                  {JSON.stringify(generatedTokenData.claims, null, 2)}
                </pre>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 font-mono">
                  Click &ldquo;Simulate User Consent&rdquo; to generate cryptographic OIDC claims.
                </div>
              )}
            </div>

            {generatedTokenData && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Backend Pending: Live JWS Cryptographic Signatures</span>
                </div>
                <p className="text-amber-300/80">
                  Tokens generated on client conform to OIDC Core 1.0 specifications. Production server endpoint signature generation is ready for live microservice mount.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Scopes Matrix */}
      {activeTab === 'SCOPES' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {STANDARD_OAUTH_SCOPES.map((scope) => (
              <div
                key={scope.scope}
                className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-slate-200 dark:border-white/5 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    {scope.scope}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[9px] font-black uppercase text-slate-500">
                    {scope.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#CAC4D0]">
                  {scope.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Discovery Metadata */}
      {activeTab === 'DISCOVERY' && (
        <div className="p-6 rounded-3xl bg-[#121118] border border-white/10 text-white space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-amber-400 font-bold flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              <span>GET /.well-known/openid-configuration</span>
            </span>
            <span className="text-[10px] text-slate-400">RFC 8414 Protocol Specification</span>
          </div>

          <pre className="p-4 rounded-2xl bg-black/60 border border-white/5 text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
            {JSON.stringify(OPENID_CONNECT_DISCOVERY_SPEC, null, 2)}
          </pre>
        </div>
      )}

      {/* Register Client Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1B26] border border-black/10 dark:border-white/10 p-6 sm:p-8 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>Register Developer OAuth Client</span>
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Application Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Game Studio / Cloud CLI"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short explanation of application purpose"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Redirect URI (Callback) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://myapp.com/oauth/callback"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClient || !clientName || !redirectUri}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black shadow transition disabled:opacity-50"
                >
                  {isSubmittingClient ? 'Creating...' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
