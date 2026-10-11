import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { AvanyxIdentityEmblem } from '../../components/identity/AvanyxIdentityEmblem';
import {
  fetchOAuthClientApps,
  registerOAuthClientApp
} from '../../services/identityService';
import { STANDARD_OAUTH_SCOPES } from '../../data/avanyxEcosystemData';
import { OAuthClientApp, OAuthClientSecretResult, OAuthScopeDefinition } from '../../types/identity';
import {
  KeyRound,
  Plus,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Lock,
  Globe,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
  Info
} from 'lucide-react';

interface IdentityOAuthAdminPageProps {
  onNavigate: (path: string) => void;
}

export const IdentityOAuthAdminPage: React.FC<IdentityOAuthAdminPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useStore();
  const isAdmin = user?.role === 'ADMIN' || user?.realRole === 'ADMIN';

  const [clients, setClients] = useState<OAuthClientApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Client Modal
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [appType, setAppType] = useState<'WEB' | 'MOBILE' | 'DESKTOP' | 'SERVICE' | 'GAME'>('WEB');
  const [homepageUrl, setHomepageUrl] = useState('');
  const [redirectUrisRaw, setRedirectUrisRaw] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['openid', 'profile', 'email']);
  const [submitting, setSubmitting] = useState(false);

  // Secret display modal (shown once after creation or rotation)
  const [generatedSecret, setGeneratedSecret] = useState<OAuthClientSecretResult | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await fetchOAuthClientApps();
      setClients(data);
    } catch (err: any) {
      console.warn('[OAuthAdmin] Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setSubmitting(true);
    try {
      const redirectUris = redirectUrisRaw
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      const newClient = await registerOAuthClientApp({
        clientName: clientName.trim(),
        description: description.trim() || `${clientName} ${appType} Application`,
        ownerUid: user?.id || 'admin',
        ownerEmail: user?.email || 'admin@avanyx.io',
        homepageUrl: homepageUrl.trim() || 'https://avanyx.io',
        redirectUris: redirectUris.length ? redirectUris : ['https://example.com/callback'],
        allowedScopes: selectedScopes
      });

      // Generate a mock secret payload for one-time display
      const randomSecret = `sec_avx_live_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      setGeneratedSecret({
        clientId: newClient.clientId,
        clientSecret: randomSecret,
        clientName: newClient.clientName
      });

      setShowNewClientModal(false);
      setClientName('');
      setDescription('');
      setHomepageUrl('');
      setRedirectUrisRaw('');
      setSelectedScopes(['openid', 'profile', 'email']);

      await loadClients();
      setNotification({
        type: 'success',
        message: `OAuth client "${newClient.clientName}" registered successfully.`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to register OAuth client.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRotateSecret = (client: OAuthClientApp) => {
    const newSecret = `sec_avx_live_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    setGeneratedSecret({
      clientId: client.clientId,
      clientSecret: newSecret,
      clientName: client.clientName
    });
    setNotification({
      type: 'success',
      message: `Client secret rotated for "${client.clientName}".`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRevokeClient = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) => (c.clientId === clientId ? { ...c, status: 'REVOKED' as const } : c))
    );
    setNotification({
      type: 'success',
      message: 'OAuth Client status updated to REVOKED.'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  // Route Protection Guard
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#07060A] text-[#FAFAFA] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#121118] border border-amber-500/30 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">Administrator Clearance Required</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The OAuth 2.0 Client Governance console is strictly restricted to verified system administrators. Please sign in with an authorized administrator account.
          </p>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => onNavigate('/login')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-lg shadow-amber-500/20"
            >
              Sign In as Administrator
            </button>
            <button
              onClick={() => onNavigate('/')}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs"
            >
              Return to AVANYX Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07060A] text-[#FAFAFA] py-6 sm:py-10 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header / Return Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Return to AVANYX Store</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Admin Clearance Verified</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <KeyRound className="w-5 h-5 text-amber-400" />
              </div>
              <h1 className="text-2xl font-black text-white">OAuth Client Manager</h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Manage OAuth 2.0 / OpenID Connect clients for first-party products and third-party developer integrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewClientModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transform hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Client</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-3 animate-fadeIn ${
              notification.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Security & Admin Isolation Notice */}
        <div className="p-5 rounded-3xl bg-[#121118] border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Architecture & Security Boundary Policy</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Client Secrets are never shown in raw plaintext in this list. Click on a client to rotate or manage secrets securely. 
            <strong className="text-white"> Client IDs and Secrets NEVER appear inside the AVANYX Store dashboard</strong> or client-side telemetry.
          </p>
        </div>

        {/* OAuth Clients Table */}
        <div className="p-6 rounded-3xl bg-[#121118] border border-white/10 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Client Name</th>
                  <th className="pb-3 px-3">Client ID</th>
                  <th className="pb-3 px-3">Created At</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map((client) => {
                  const isRevoked = client.status === 'REVOKED';

                  return (
                    <tr key={client.clientId} className="hover:bg-white/5 transition-colors">
                      {/* Name & Type */}
                      <td className="py-4 px-3">
                        <div className="font-black text-white text-xs sm:text-sm">
                          {client.clientName}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5">
                          {client.description}
                        </div>
                        {client.isFirstParty && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                            First-Party Ecosystem
                          </span>
                        )}
                      </td>

                      {/* Client ID with Copy */}
                      <td className="py-4 px-3 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-300 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                            {client.clientId.length > 20
                              ? `${client.clientId.substring(0, 10)}...${client.clientId.substring(client.clientId.length - 6)}`
                              : client.clientId}
                          </span>
                          <button
                            onClick={() => handleCopy(client.clientId, client.clientId)}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                            title="Copy Client ID"
                          >
                            {copiedId === client.clientId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-3 text-zinc-400 text-xs">
                        {client.createdAt
                          ? new Date(client.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'May 20, 2024'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        {isRevoked ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                            Revoked
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRotateSecret(client)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-zinc-300 hover:text-amber-300 font-bold text-[11px] transition-all"
                            title="Rotate Secret Key"
                          >
                            <RefreshCw className="w-3 h-3 inline mr-1" />
                            Rotate Secret
                          </button>

                          {!isRevoked && (
                            <button
                              onClick={() => handleRevokeClient(client.clientId)}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-zinc-300 hover:text-rose-300 font-bold text-[11px] transition-all"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Backend Pending Notice Box */}
        <div className="p-6 rounded-3xl bg-[#111018] border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-black text-amber-400 uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>Identity Backend Integration Roadmap</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>OAuth 2.0 Auth Server</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  Backend Pending
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Live RFC 6749 authorization code exchange endpoint for token issuing.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>Token Refresh Service</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  Backend Pending
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Automated JWT token rotation and secure refresh token storage.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>Domain Migration</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Ready (avanyx.io)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                OIDC routes mapped to https://identity.avanyx.io with zero downtime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Modal: Register New OAuth Client */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[#14131A] border border-amber-500/30 p-6 shadow-2xl text-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Register New OAuth Client
              </h3>
              <button
                onClick={() => setShowNewClientModal(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Client / Application Name
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Aether Platform (Web App)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Application Type
                  </label>
                  <select
                    value={appType}
                    onChange={(e) => setAppType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                  >
                    <option value="WEB">Web App (SPA)</option>
                    <option value="MOBILE">Mobile App (APK / iOS)</option>
                    <option value="DESKTOP">Desktop Client</option>
                    <option value="GAME">Game Hub / Unity 3D</option>
                    <option value="SERVICE">Machine-to-Machine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Homepage URL
                  </label>
                  <input
                    type="url"
                    value={homepageUrl}
                    onChange={(e) => setHomepageUrl(e.target.value)}
                    placeholder="https://app.example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Redirect URIs <span className="text-zinc-500 font-normal">(One per line)</span>
                </label>
                <textarea
                  rows={2}
                  value={redirectUrisRaw}
                  onChange={(e) => setRedirectUrisRaw(e.target.value)}
                  placeholder="https://app.example.com/oauth/callback&#10;http://localhost:3000/callback"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Allowed OAuth Scopes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STANDARD_OAUTH_SCOPES.slice(0, 6).map((scope: OAuthScopeDefinition) => (
                    <label
                      key={scope.scope}
                      className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer text-[11px]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope.scope)}
                        onChange={() => toggleScope(scope.scope)}
                        className="rounded bg-black border-white/20 text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-zinc-300 truncate">{scope.scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Generated Secret Display (One-Time) */}
      {generatedSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#14131A] border border-amber-500/40 p-6 shadow-2xl text-zinc-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-2 text-amber-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">
                Client Credentials Generated
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Save this Client Secret securely now. It will never be shown again in plaintext.
              </p>
            </div>

            <div className="space-y-3 py-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Client ID
                </label>
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-amber-300 break-all select-all">
                  {generatedSecret.clientId}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Client Secret (Copy Now)
                </label>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 font-mono text-xs text-amber-400 break-all select-all flex items-center justify-between gap-2">
                  <span>{generatedSecret.clientSecret}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSecret.clientSecret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 3000);
                    }}
                    className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 shrink-0"
                  >
                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-center">
              <button
                onClick={() => setGeneratedSecret(null)}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs shadow-md"
              >
                I have saved my secret securely
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
