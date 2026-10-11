import React, { useState } from 'react';
import { StoreApp, AppVersionDoc, User } from '../../types';
import {
  Rocket,
  Plus,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { addAppVersionDoc } from '../../services/firestoreService';

interface ReleasesTabProps {
  activeApp?: StoreApp;
  developerApps: StoreApp[];
  appVersionsList: AppVersionDoc[];
  user: User;
  activeUid: string;
}

export const ReleasesTab: React.FC<ReleasesTabProps> = ({
  activeApp,
  developerApps,
  appVersionsList,
  user,
  activeUid
}) => {
  const currentApp = activeApp || developerApps[0];

  const [versionName, setVersionName] = useState('');
  const [versionCode, setVersionCode] = useState('');
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');
  const [checksumSha256, setChecksumSha256] = useState('');
  const [sizeMb, setSizeMb] = useState('24.5');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [minAndroidSdk, setMinAndroidSdk] = useState('26');
  const [targetAndroidSdk, setTargetAndroidSdk] = useState('34');
  const [isMandatory, setIsMandatory] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);

  const handleGenerateChecksum = () => {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    setChecksumSha256(hash);
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApp) {
      alert('Please select an application to deploy a release for.');
      return;
    }
    if (!versionName.trim() || !versionCode.trim() || !apkDownloadUrl.trim()) {
      alert('Version name, version code, and APK URL are required.');
      return;
    }

    setIsDeploying(true);
    try {
      await addAppVersionDoc(currentApp.id, {
        appId: currentApp.id,
        version: versionName.trim(),
        versionCode: parseInt(versionCode, 10) || 1,
        downloadUrl: apkDownloadUrl.trim(),
        checksumSha256: checksumSha256.trim() || undefined,
        sizeMb: parseFloat(sizeMb) || 24.5,
        releaseNotes: releaseNotes.trim() || 'Performance improvements and bug fixes.',
        minAndroidSdk: parseInt(minAndroidSdk, 10) || 26,
        targetAndroidSdk: parseInt(targetAndroidSdk, 10) || 34,
        isMandatory: isMandatory,
        track: 'PRODUCTION'
      });

      setDeploySuccess(true);
      setVersionName('');
      setVersionCode('');
      setApkDownloadUrl('');
      setChecksumSha256('');
      setReleaseNotes('');
      setTimeout(() => setDeploySuccess(false), 4000);
    } catch (err: any) {
      alert(`Error deploying release: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC] uppercase tracking-wider mb-1">
            <Rocket className="w-4 h-4 text-[#C084FC]" />
            <span>Production Version Rollout</span>
          </div>
          <h1 className="text-2xl font-black text-white">Releases & Version Management</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Rollout over-the-air binary updates, specify cryptographic APK checksums, and define release changelogs for {currentApp?.name || 'your apps'}.
          </p>
        </div>

        {currentApp && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0F1015] border border-white/10">
            <img
              src={currentApp.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
              alt={currentApp.name}
              className="w-8 h-8 rounded-xl object-cover"
            />
            <div>
              <span className="text-xs font-extrabold text-white block truncate max-w-[140px]">{currentApp.name}</span>
              <span className="text-[10px] text-zinc-500 font-mono">Current: v{currentApp.version}</span>
            </div>
          </div>
        )}
      </div>

      {deploySuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>New release published successfully and deployed to store clients!</span>
        </div>
      )}

      {/* Deploy New Release Form */}
      <form onSubmit={handleCreateRelease} className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#C084FC]" />
          <span>Draft & Rollout New Release</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Version Name (e.g. 1.0.1) *</label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="1.0.1"
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Version Code (e.g. 2) *</label>
            <input
              type="number"
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              placeholder="2"
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">APK Size in MB</label>
            <input
              type="text"
              value={sizeMb}
              onChange={(e) => setSizeMb(e.target.value)}
              placeholder="24.5"
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-2">Direct APK Download URL *</label>
          <input
            type="url"
            value={apkDownloadUrl}
            onChange={(e) => setApkDownloadUrl(e.target.value)}
            placeholder="https://github.com/organization/repo/releases/download/v1.0.1/app-release.apk"
            className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-zinc-300">Authoritative SHA-256 Checksum</label>
            <button
              type="button"
              onClick={handleGenerateChecksum}
              className="text-[11px] font-bold text-[#C084FC] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Generate Checksum</span>
            </button>
          </div>
          <input
            type="text"
            value={checksumSha256}
            onChange={(e) => setChecksumSha256(e.target.value)}
            placeholder="64-character SHA-256 hash"
            className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-2">Release Notes / Changelog</label>
          <textarea
            rows={3}
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            placeholder="What's new in this version..."
            className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="w-4 h-4 rounded accent-[#9333EA]"
            />
            <span className="text-xs font-bold text-zinc-300">Mandatory Update (Users must update to continue)</span>
          </label>

          <button
            type="submit"
            disabled={isDeploying}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white font-extrabold text-xs shadow-lg shadow-[#9333EA]/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            <span>{isDeploying ? 'Deploying Release...' : 'Rollout to Production'}</span>
          </button>
        </div>
      </form>

      {/* Release History List */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-4">
        <h3 className="text-base font-extrabold text-white">Release Version History</h3>

        <div className="space-y-3">
          {appVersionsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 rounded-2xl bg-[#0F1015] border border-white/5">
              No version history records found. Deploy a release above.
            </div>
          ) : (
            appVersionsList.map((ver) => (
              <div
                key={ver.id}
                className="p-5 rounded-2xl bg-[#0F1015] border border-white/5 space-y-2 hover:border-white/10 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white">v{ver.version}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-400 font-mono text-[10px]">
                      Version Code {ver.versionCode}
                    </span>
                    {(ver as any).isMandatory && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                        MANDATORY
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    ACTIVE PRODUCTION
                  </span>
                </div>
                <p className="text-xs text-zinc-300">{ver.releaseNotes || 'Production build release'}</p>
                <p className="text-[10px] text-zinc-500 font-mono truncate">{ver.downloadUrl}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
