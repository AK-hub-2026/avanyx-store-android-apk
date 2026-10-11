import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { UserDeviceSession, DevicePlatform } from '../../types/identity';
import {
  fetchUserSessions,
  registerCurrentDeviceSession,
  revokeUserSession,
  revokeAllOtherSessions
} from '../../services/identityService';
import {
  Laptop,
  Smartphone,
  Server,
  Globe,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Radio,
  Sparkles,
  LogOut
} from 'lucide-react';

export const AvanyxIdentitySessionManager: React.FC = () => {
  const { user, isAuthenticated } = useStore();
  const [sessions, setSessions] = useState<UserDeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadSessions = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const sessList = await registerCurrentDeviceSession(user.id);
      setSessions(sessList);
    } catch (err) {
      console.warn('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user?.id]);

  const handleRevokeOne = async (sessionId: string, deviceName: string) => {
    if (!user?.id) return;
    setRevokingId(sessionId);
    try {
      const updated = await revokeUserSession(user.id, sessionId);
      setSessions(updated);
      setActionNotice(`Revoked access for "${deviceName}". Session terminated.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.warn('Error revoking session:', err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    if (!user?.id) return;
    setIsRevokingAll(true);
    try {
      const updated = await revokeAllOtherSessions(user.id);
      setSessions(updated);
      setActionNotice('All other remote device sessions have been securely revoked.');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.warn('Error revoking all other sessions:', err);
    } finally {
      setIsRevokingAll(false);
    }
  };

  const getPlatformIcon = (platform: DevicePlatform) => {
    switch (platform) {
      case 'ANDROID':
      case 'IOS':
        return <Smartphone className="w-5 h-5 text-emerald-500" />;
      case 'MAC':
      case 'WINDOWS':
      case 'LINUX':
        return <Laptop className="w-5 h-5 text-indigo-500" />;
      default:
        return <Monitor className="w-5 h-5 text-amber-500" />;
    }
  };

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
  const revokedSessions = sessions.filter((s) => s.status === 'REVOKED');
  const otherActiveSessionsCount = activeSessions.filter((s) => !s.isCurrentSession).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Action Notice */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header with Stats & Revoke All */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1B26] border border-black/5 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Multi-Device Session Manager
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[10px] font-black uppercase">
              AVANYX SSO
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#CAC4D0]">
            You have <strong>{activeSessions.length} active device sessions</strong> synchronized with your AVANYX Identity account.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            title="Refresh session list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {otherActiveSessionsCount > 0 && (
            <button
              onClick={handleRevokeAllOther}
              disabled={isRevokingAll}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isRevokingAll ? 'Revoking...' : 'Sign Out Other Devices'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Sessions List */}
      <div className="space-y-3.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 flex items-center justify-between">
          <span>Active Authenticated Devices ({activeSessions.length})</span>
          <span className="text-[11px] font-medium lowercase">Real-time sync</span>
        </h4>

        {loading && sessions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-amber-500" />
            Loading active sessions...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 sm:p-5 rounded-2xl transition-all border ${
                  session.isCurrentSession
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-sm'
                    : 'bg-white dark:bg-[#1E1F23] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 shrink-0 mt-0.5">
                      {getPlatformIcon(session.platform)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {session.deviceName}
                        </span>
                        {session.isCurrentSession ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[10px] font-black tracking-wide border border-emerald-500/20">
                            Current Session
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                            Remote Device
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-[#CAC4D0]">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{session.browser}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{session.location}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Active {new Date(session.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
                    {session.isCurrentSession ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Secure & Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRevokeOne(session.id, session.deviceName)}
                        disabled={revokingId === session.id}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition flex items-center gap-1.5 border border-transparent hover:border-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{revokingId === session.id ? 'Revoking...' : 'Revoke Session'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revoked Sessions History (Collapsible) */}
      {revokedSessions.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recently Terminated Sessions ({revokedSessions.length})
          </span>
          <div className="space-y-1.5">
            {revokedSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 py-1 border-b border-black/5 dark:border-white/5 last:border-0">
                <span className="line-through">{s.deviceName}</span>
                <span className="text-[10px] text-rose-500 font-bold">Revoked</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
