import React from 'react';
import { StoreApp } from '../types';
import { Star, ShieldCheck, Download, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface AppCardProps {
  app: StoreApp;
  featuredLayout?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({ app, featuredLayout }) => {
  const { openAppDetails, downloadApp, downloads, openDeveloperProfile } = useStore();

  const activeDownload = downloads.find((d) => d.appId === app.id);
  const isDownloading = activeDownload && (activeDownload.status === 'DOWNLOADING' || activeDownload.status === 'PREPARING');

  const renderAppTypeBadge = () => {
    const type = app.appType || (app.price > 0 ? 'PAID' : 'FREE');
    switch (type) {
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            PAID ₹{app.price || 99}
          </span>
        );
      case 'IN_APP_PURCHASE':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
            In-App
          </span>
        );
      case 'SUBSCRIPTION':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            Subscription
          </span>
        );
      case 'FREE_WITH_PREMIUM':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            Free + Premium
          </span>
        );
      case 'FREE':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            Free
          </span>
        );
    }
  };

  if (featuredLayout) {
    return (
      <div
        onClick={() => openAppDetails(app.id)}
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6750A4] to-[#4F378B] text-white p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between min-h-[260px]"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:scale-105 transition-transform duration-500"
          style={{ backgroundImage: `url(${app.bannerUrl})` }}
        />
        
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase">
              Featured Spotlight
            </span>
            {renderAppTypeBadge()}
          </div>
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{app.securityScore}% Clean</span>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={app.iconUrl}
              alt={`${app.name} Application Icon - AVANYX Store`}
              loading="lazy"
              decoding="async"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 shadow-md"
            />
            <div>
              <h2 className="text-xl font-extrabold tracking-tight leading-snug">{app.name}</h2>
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  openDeveloperProfile(app.developerUid || app.developer);
                }}
                className="text-xs text-white/80 hover:text-white font-medium hover:underline cursor-pointer"
              >
                {app.developer}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/90">
                <span className="flex items-center gap-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {app.rating}
                </span>
                <span>•</span>
                <span>{app.downloads} downloads</span>
                <span>•</span>
                <span>{app.apkSize}</span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!app.isInstalled) downloadApp(app);
            }}
            className={`shrink-0 px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
              app.isInstalled
                ? 'bg-emerald-500 text-white'
                : isDownloading
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-white text-[#6750A4] hover:bg-white/90'
            }`}
          >
            {app.isInstalled ? (
              <>
                <Check className="w-4 h-4" /> Installed
              </>
            ) : isDownloading ? (
              `${activeDownload?.progress}%`
            ) : (
              <>
                <Download className="w-4 h-4" /> Get App
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => openAppDetails(app.id)}
      className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-[#6750A4]/30 dark:hover:border-[#D0BCFF]/30 hover:shadow-lg transition-all cursor-pointer flex items-center justify-between gap-4 group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <img
          src={app.iconUrl}
          alt={`${app.name} Application Icon - AVANYX Store`}
          loading="lazy"
          decoding="async"
          className="w-13 h-13 rounded-2xl object-cover shrink-0 ring-1 ring-black/5 group-hover:scale-105 transition-transform"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-sm text-[#1D1B20] dark:text-[#E6E1E5] truncate">
              {app.name}
            </h3>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            {renderAppTypeBadge()}
          </div>
          <p
            onClick={(e) => {
              e.stopPropagation();
              openDeveloperProfile(app.developerUid || app.developer);
            }}
            className="text-xs text-[#49454F] dark:text-[#CAC4D0] hover:text-[#6750A4] dark:hover:text-[#D0BCFF] truncate mt-0.5 hover:underline cursor-pointer"
          >
            {app.developer}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            <span className="flex items-center gap-0.5 font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {app.rating}
            </span>
            <span>•</span>
            <span>{app.apkSize}</span>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!app.isInstalled) downloadApp(app);
          else openAppDetails(app.id);
        }}
        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
          app.isInstalled
            ? 'bg-[#E8DEF8] dark:bg-[#4A4458] text-[#6750A4] dark:text-[#D0BCFF]'
            : isDownloading
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
            : (app.appType === 'PAID' || app.price > 0)
            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
            : 'bg-[#6750A4] hover:bg-[#4F378B] text-white shadow-sm'
        }`}
      >
        {app.isInstalled
          ? 'Open'
          : isDownloading
          ? `${activeDownload?.progress}%`
          : (app.appType === 'PAID' || app.price > 0)
          ? `Buy ₹${app.price || 99}`
          : 'Get'}
      </button>
    </div>
  );
};
