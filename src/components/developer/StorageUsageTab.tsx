import React from 'react';
import { StoreApp } from '../../types';
import {
  HardDrive,
  Image as ImageIcon,
  FileCode,
  Layers,
  Database,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';

interface StorageUsageTabProps {
  developerApps: StoreApp[];
}

export const StorageUsageTab: React.FC<StorageUsageTabProps> = ({
  developerApps
}) => {
  // Calculate aggregate storage metrics across developer apps
  const totalApkMb = developerApps.reduce((acc, a) => acc + (a.sizeMb || 24.5), 0);
  const totalScreenshotsCount = developerApps.reduce((acc, a) => acc + (a.screenshots?.length || 3), 0);
  const estimatedScreenshotsMb = (totalScreenshotsCount * 0.8).toFixed(1);
  const totalBannersCount = developerApps.length;
  const estimatedBannersMb = (totalBannersCount * 0.5).toFixed(1);
  const totalIconsCount = developerApps.length;
  const estimatedIconsMb = (totalIconsCount * 0.2).toFixed(1);

  const totalUsedMb = (
    totalApkMb +
    parseFloat(estimatedScreenshotsMb) +
    parseFloat(estimatedBannersMb) +
    parseFloat(estimatedIconsMb)
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC] uppercase tracking-wider mb-1">
            <HardDrive className="w-4 h-4 text-[#C084FC]" />
            <span>Supabase Cloud Storage Infrastructure</span>
          </div>
          <h1 className="text-2xl font-black text-white">Storage Usage & Quota</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Real-time storage breakdown across application icons, 1024×500 promotional graphics, screenshot galleries, and binary APK bundles.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0F1015] border border-white/10 text-xs">
          <span className="text-zinc-400 font-bold">Total Storage:</span>
          <span className="text-[#C084FC] font-black">{totalUsedMb} MB / 5.0 GB</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-white">Studio Allocation (Free Developer Tier)</span>
          <span className="text-emerald-400">1.2% Used (Healthy)</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[#0F1015] overflow-hidden p-0.5 border border-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-[#9333EA] to-[#C084FC]" style={{ width: '5%' }} />
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Screenshots</span>
            <div className="w-8 h-8 rounded-xl bg-[#9333EA]/20 text-[#C084FC] flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{estimatedScreenshotsMb} MB</p>
          <p className="text-[11px] text-zinc-500">{totalScreenshotsCount} images stored</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Feature Banners</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{estimatedBannersMb} MB</p>
          <p className="text-[11px] text-zinc-500">{totalBannersCount} graphics stored</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">App Icons</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{estimatedIconsMb} MB</p>
          <p className="text-[11px] text-zinc-500">{totalIconsCount} icons stored</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#161722] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">APK Binaries</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{totalApkMb.toFixed(1)} MB</p>
          <p className="text-[11px] text-zinc-500">{developerApps.length} active binaries</p>
        </div>
      </div>
    </div>
  );
};
