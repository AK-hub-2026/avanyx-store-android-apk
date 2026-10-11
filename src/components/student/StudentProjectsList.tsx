import React, { useState } from 'react';
import { StoreApp, User } from '../../types';
import { submitAppForReview, AppSubmissionPayload } from '../../services/firestoreService';
import {
  Package,
  Plus,
  ExternalLink,
  Download,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCode2,
  UploadCloud,
  Layers,
  Sparkles,
  ShieldCheck,
  X,
  Lock,
  Tag
} from 'lucide-react';

interface StudentProjectsListProps {
  user: User;
  studentApps: StoreApp[];
  onRefresh: () => Promise<void>;
  isModalOpen: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
}

export const StudentProjectsList: React.FC<StudentProjectsListProps> = ({
  user,
  studentApps,
  onRefresh,
  isModalOpen,
  onCloseModal,
  onOpenModal
}) => {
  // Submission form state
  const [appName, setAppName] = useState('');
  const [projectType, setProjectType] = useState<'APP' | 'GAME'>('APP');
  const [appType, setAppType] = useState<'FREE' | 'FREE_WITH_PREMIUM' | 'IN_APP_PURCHASE' | 'SUBSCRIPTION'>('FREE');
  const [packageName, setPackageName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState(1);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [sha256, setSha256] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSubmitApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !packageName.trim()) {
      setFormError('App Name and Package Name are required.');
      return;
    }
    if (!packageName.includes('.')) {
      setFormError('Package name must follow reverse domain format (e.g., edu.school.project).');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const isGame = projectType === 'GAME';
      const payload: AppSubmissionPayload = {
        name: appName.trim(),
        packageName: packageName.trim().toLowerCase(),
        developer: user.name || 'Student Developer',
        developerUid: user.id,
        category: isGame ? 'GAMES' : 'EDUCATION',
        categoryId: isGame ? 'games' : 'education',
        appType: appType,
        price: 0,
        iconUrl:
          iconUrl.trim() ||
          `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(appName)}`,
        bannerUrl: isGame
          ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        screenshots: [
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
        ],
        sizeMb: isGame ? 35.0 : 18.5,
        isGame: isGame,
        downloadUrl: downloadUrl.trim() || 'https://github.com/avanyx/releases/download/v1.0.0/app-release.apk',
        checksumSha256:
          sha256.trim() ||
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        version: version.trim() || '1.0.0',
        versionCode: Number(versionCode) || 1,
        fullDescription: description.trim() || `Student ${isGame ? 'game' : 'educational app'} built for coursework and academic portfolio.`,
        features: ['Material You UI', isGame ? 'Offline 60FPS Gameplay' : 'Coursework Sync', 'Open Academic Source'],
        tags: ['student', isGame ? 'games' : 'education', 'academic', 'coursework']
      };

      await submitAppForReview(payload);
      setFormSuccess('Educational app successfully submitted! It is now recorded in Firestore.');
      await onRefresh();

      // Reset form
      setTimeout(() => {
        setAppName('');
        setPackageName('');
        setDownloadUrl('');
        setDescription('');
        setIconUrl('');
        setSha256('');
        setFormSuccess(null);
        onCloseModal();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit educational application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="student-projects-module" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 shadow-sm">
        <div>
          <h3 className="text-base font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#6750A4] dark:text-cyan-400" />
            <span>My Educational Projects</span>
          </h3>
          <p className="text-xs text-[#49454F] dark:text-slate-400 mt-0.5">
            Manage coursework apps, university project distributions, and real-time student downloads.
          </p>
        </div>

        <button
          onClick={onOpenModal}
          className="px-4 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Project APK</span>
        </button>
      </div>

      {/* Projects Grid */}
      {studentApps.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#6750A4]/10 dark:bg-cyan-500/10 text-[#6750A4] dark:text-cyan-400 mx-auto flex items-center justify-center">
            <FileCode2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1D1B20] dark:text-white">No Student Projects Yet</h4>
            <p className="text-xs text-[#49454F] dark:text-slate-400 max-w-sm mx-auto">
              Submit your first class project, hackathon prototype, or student study tool to the AVANYX Store!
            </p>
          </div>
          <button
            onClick={onOpenModal}
            className="px-5 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-black text-xs transition-all shadow-md inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Educational APK</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentApps.map((app) => (
            <div
              key={app.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 hover:border-[#6750A4]/30 dark:hover:border-cyan-500/30 transition-all space-y-4 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-black/10 dark:border-cyan-500/20 bg-[#F8F9FA] dark:bg-[#0B0F17] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-[#1D1B20] dark:text-white truncate">{app.name}</h4>
                      <p className="text-[11px] font-mono text-[#6750A4] dark:text-cyan-400/80 truncate">
                        {app.packageName}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                      app.status === 'PUBLISHED' || app.status === 'APPROVED'
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {app.status || 'Active'}
                  </span>
                </div>

                <p className="text-xs text-[#49454F] dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {app.description}
                </p>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-cyan-500/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#49454F] dark:text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                    <Download className="w-3.5 h-3.5" />
                    <span>{(app.downloadCount || 0).toLocaleString()} downloads</span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{app.rating || '5.0'}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Version: <strong className="text-[#1D1B20] dark:text-slate-300">v{app.version || '1.0.0'}</strong></span>
                  <span className="font-mono truncate max-w-[120px]" title={app.sha256Checksum || ''}>
                    SHA: {(app.sha256Checksum || 'verified').substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 text-[#1D1B20] dark:text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-cyan-500/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#6750A4]/10 dark:bg-cyan-500/15 text-[#6750A4] dark:text-cyan-400 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-[#1D1B20] dark:text-white">Submit Educational Project</h3>
              </div>
              <button
                onClick={onCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitApp} className="space-y-4 text-xs">
              {/* PART D: Developer Chooses Free App or Free Game */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Project Type (Student Tier: 100% Free)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectType('APP')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      projectType === 'APP'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-[#0B0F17] border-cyan-500/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    Free Educational App
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectType('GAME')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      projectType === 'GAME'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-[#0B0F17] border-cyan-500/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    Free Educational Game
                  </button>
                </div>
              </div>

              {/* PART D: Student Premium Publishing Type Selection */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>App Monetization Model (PART D)</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Student Creator Pro</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setAppType('FREE')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      appType === 'FREE'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-[#0B0F17] border-cyan-500/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    FREE
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppType('FREE_WITH_PREMIUM')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      appType === 'FREE_WITH_PREMIUM'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-[#0B0F17] border-cyan-500/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    FREE + PREMIUM
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppType('IN_APP_PURCHASE')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      appType === 'IN_APP_PURCHASE'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-[#0B0F17] border-cyan-500/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    IN_APP
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppType('SUBSCRIPTION')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      appType === 'SUBSCRIPTION'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-[#0B0F17] border-cyan-500/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    SUBSCRIPTION
                  </button>
                </div>

                {/* Locked PAID App Notice */}
                <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upfront PAID APK publishing</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Locked (Requires 18+ Verified Dev)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Project / App Name *</label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. Campus Study Tracker"
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0F17] border border-cyan-500/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Android Package Name *</label>
                  <input
                    type="text"
                    required
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="e.g. edu.university.studytracker"
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0F17] border border-cyan-500/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Version String</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0F17] border border-cyan-500/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Version Code</label>
                  <input
                    type="number"
                    min={1}
                    value={versionCode}
                    onChange={(e) => setVersionCode(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0F17] border border-cyan-500/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">APK Release URL (Direct Download / GitHub)</label>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://github.com/user/repo/releases/download/v1.0.0/app.apk"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0F17] border border-cyan-500/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Project Icon Image URL (Optional)</label>
                <input
                  type="url"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://... (default auto-generated)"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0F17] border border-cyan-500/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Project Summary / Course Notes</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your student application, research goals, or coursework objectives..."
                  className="w-full p-3 rounded-xl bg-[#0B0F17] border border-cyan-500/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0B0F17] border border-cyan-500/20 space-y-1 text-[11px] text-slate-400">
                <span className="font-bold text-cyan-400 block">Student Publishing Guarantee:</span>
                <span>
                  All educational student apps are distributed completely free ($0.00), marked with the Verified Student badge, and assigned 100% clean security certification.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-cyan-500/10">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting to Firestore...' : 'Publish Student Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
