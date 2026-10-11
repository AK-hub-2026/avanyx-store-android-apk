import React, { useState } from 'react';
import { StoreApp, User } from '../../types';
import {
  Layers,
  PlusCircle,
  ExternalLink,
  Download,
  Star,
  Trash2,
  Edit3,
  History,
  UploadCloud,
  SlidersHorizontal,
  Search,
  AlertTriangle,
  CheckCircle2,
  Box,
  Sparkles,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { DeveloperConsoleTab } from './developerTypes';
import { AppManageModal } from './AppManageModal';
import { deleteDeveloperApp } from '../../services/firestoreService';

interface AllAppsTabProps {
  developerApps: StoreApp[];
  user: User;
  setActiveTab: (tab: DeveloperConsoleTab) => void;
  setSelectedAppId?: (appId: string) => void;
  openAppDetails?: (app: StoreApp) => void;
  onRefreshApps?: () => void;
}

export const AllAppsTab: React.FC<AllAppsTabProps> = ({
  developerApps,
  user,
  setActiveTab,
  setSelectedAppId,
  openAppDetails,
  onRefreshApps
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // App Manage Modal
  const [managingApp, setManagingApp] = useState<StoreApp | null>(null);

  // Delete Confirmation Dialog
  const [deletingApp, setDeletingApp] = useState<StoreApp | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter apps
  const filteredApps = developerApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || app.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(developerApps.map((a) => a.category).filter(Boolean)));

  const handleConfirmDelete = async () => {
    if (!deletingApp) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const devUid = user.id || deletingApp.developerUid || '';
      await deleteDeveloperApp(deletingApp.id, devUid, user.email);

      setDeletingApp(null);
      if (onRefreshApps) onRefreshApps();
    } catch (err: any) {
      console.error('Failed to delete app:', err);
      setDeleteError(err.message || 'Failed to delete application. Please verify ownership.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenReleaseHistory = (app: StoreApp) => {
    if (setSelectedAppId) setSelectedAppId(app.id);
    setActiveTab('RELEASES');
  };

  const handlePublishUpdate = (app: StoreApp) => {
    if (setSelectedAppId) setSelectedAppId(app.id);
    setActiveTab('RELEASES');
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#161724] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black text-[#C084FC] uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-[#C084FC] shrink-0" />
            <span>Studio Application Catalog</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white truncate">All Applications</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Manage your published store listings, APK downloads, updates, and package metadata.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('SUBMIT_APP')}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] hover:from-[#A855F7] hover:to-[#9333EA] text-white font-black text-xs shadow-lg shadow-[#9333EA]/30 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141520] p-3 rounded-2xl border border-white/5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by app name or package identifier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0E0F18] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              categoryFilter === 'ALL'
                ? 'bg-[#9333EA] text-white shadow-md shadow-[#9333EA]/20'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            All ({developerApps.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat!)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                categoryFilter === cat
                  ? 'bg-[#9333EA] text-white shadow-md shadow-[#9333EA]/20'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Apps */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="p-5 rounded-[20px] bg-[#161724] border border-white/10 hover:border-[#9333EA]/50 transition-all duration-200 flex flex-col justify-between h-[250px] shadow-xl overflow-hidden group select-none"
            >
              {/* Top Row: 64x64 Icon, Title, Package & Badges */}
              <div className="space-y-2 min-w-0">
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                    alt={app.name}
                    className="w-16 h-16 rounded-[16px] object-cover bg-black/40 border border-white/10 shrink-0 shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="font-black text-white text-base leading-snug line-clamp-2 break-words">
                        {app.name}
                      </h3>
                      {openAppDetails && (
                        <button
                          type="button"
                          onClick={() => openAppDetails(app)}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition shrink-0"
                          title="View in Store"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono truncate block mt-0.5 leading-tight">
                      {app.packageName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                      <span className="px-2 py-0.5 rounded-full bg-[#9333EA]/15 text-[#C084FC] text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                        {app.category}
                      </span>
                      {app.status && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                            app.status === 'PUBLISHED' || app.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : app.status === 'PENDING_REVIEW'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-zinc-500/15 text-zinc-400'
                          }`}
                        >
                          {app.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1-Line Description snippet */}
                <p className="text-xs text-zinc-300 line-clamp-1 leading-normal break-words">
                  {app.fullDescription || app.description || 'Production verified AVANYX application package.'}
                </p>
              </div>

              {/* Horizontal Stats Row: Downloads, Rating, Size, Version */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 font-medium">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="font-bold text-white text-xs">{app.downloads || '0'}</span>
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="font-bold text-white text-xs">{app.rating ? app.rating.toFixed(1) : '5.0'}</span>
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {app.apkSize || `${app.sizeMb || 25} MB`}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 font-mono font-bold text-[10px] shrink-0">
                  v{app.version || '1.0.0'}
                </span>
              </div>

              {/* Single Horizontal Bottom Action Row: App Manage, Releases, Update, Delete */}
              <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 shrink-0">
                {/* App Manage */}
                <button
                  type="button"
                  onClick={() => setManagingApp(app)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#9333EA]/20 hover:bg-[#9333EA]/35 border border-[#9333EA]/40 text-[11px] sm:text-xs font-black text-[#C084FC] hover:text-white transition flex items-center justify-center gap-1.5 min-w-0 cursor-pointer"
                  title="Manage app details, graphics, and URLs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">App Manage</span>
                </button>

                {/* Releases */}
                <button
                  type="button"
                  onClick={() => handleOpenReleaseHistory(app)}
                  className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] sm:text-xs font-bold text-zinc-300 hover:text-white transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                  title="View releases and APK history"
                >
                  <History className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Releases</span>
                </button>

                {/* Update */}
                <button
                  type="button"
                  onClick={() => handlePublishUpdate(app)}
                  className="py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] sm:text-xs font-bold text-emerald-400 transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                  title="Upload and publish new APK version"
                >
                  <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                  <span>Update</span>
                </button>

                {/* AI Security Scan */}
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedAppId) setSelectedAppId(app.id);
                    setActiveTab('SECURITY_SCAN');
                  }}
                  className="py-1.5 px-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-[11px] sm:text-xs font-bold text-teal-300 transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                  title="Run AI Verification Pipeline & Security Scan"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>AI Scan</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setDeletingApp(app)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer shrink-0"
                  title="Delete Application"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 px-6 rounded-3xl bg-[#161724] border border-white/10 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9333EA]/30 to-[#6366F1]/30 border border-[#9333EA]/30 flex items-center justify-center mx-auto text-[#C084FC]">
            <Box className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">No Applications Found</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {searchQuery || categoryFilter !== 'ALL'
              ? 'No applications match your active search or category filter.'
              : 'You have not published any applications to the AVANYX Store under this developer account yet.'}
          </p>
          <button
            onClick={() => setActiveTab('SUBMIT_APP')}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white font-extrabold text-xs shadow-lg shadow-[#9333EA]/30 transition inline-flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit First Application</span>
          </button>
        </div>
      )}

      {/* App Manage Modal */}
      {managingApp && (
        <AppManageModal
          app={managingApp}
          user={user}
          onClose={() => setManagingApp(null)}
          onSaveSuccess={(updates) => {
            if (onRefreshApps) onRefreshApps();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingApp && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161724] border border-red-500/30 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Delete Application?</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E0F18] border border-white/10 flex items-center gap-3">
              <img
                src={deletingApp.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                alt={deletingApp.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/10"
              />
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{deletingApp.name}</p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">{deletingApp.packageName}</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{deletingApp.name}</strong> from your catalog? All public store metadata will be removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingApp(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg shadow-red-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
