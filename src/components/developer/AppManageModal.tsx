import React, { useState } from 'react';
import { StoreApp, AppCategory, User } from '../../types';
import {
  X,
  Save,
  Image,
  Layers,
  Upload,
  Globe,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Tag,
  Download
} from 'lucide-react';
import { updateDeveloperAppMetadata } from '../../services/firestoreService';
import { uploadMediaToSupabase, SUPABASE_BUCKETS, SupabaseBucketName } from '../../services/supabaseStorage';

interface AppManageModalProps {
  app: StoreApp;
  user: User;
  onClose: () => void;
  onSaveSuccess: (updatedApp: Partial<StoreApp>) => void;
}

const CATEGORIES: AppCategory[] = [
  'TOOLS',
  'GAMES',
  'PRODUCTIVITY',
  'SOCIAL',
  'MEDIA',
  'AI_AGENTS',
  'EDUCATION',
  'ENTERTAINMENT',
  'FINANCE',
  'HEALTH',
  'LIFESTYLE',
  'SHOPPING',
  'CREATIVITY',
  'BUSINESS',
  'SECURITY',
  'UTILITIES'
];

export const AppManageModal: React.FC<AppManageModalProps> = ({
  app,
  user,
  onClose,
  onSaveSuccess
}) => {
  const [activeSection, setActiveSection] = useState<'DETAILS' | 'MEDIA' | 'PACKAGE'>('DETAILS');

  // Form State
  const [name, setName] = useState(app.name || '');
  const [category, setCategory] = useState<AppCategory>(app.category || 'TOOLS');
  const [fullDescription, setFullDescription] = useState(
    app.fullDescription || app.description || ''
  );
  const [iconUrl, setIconUrl] = useState(app.iconUrl || '');
  const [bannerUrl, setBannerUrl] = useState(app.bannerUrl || '');
  const [screenshots, setScreenshots] = useState<string[]>(
    app.screenshots && app.screenshots.length > 0 ? [...app.screenshots] : []
  );
  const [newScreenshotInput, setNewScreenshotInput] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(app.downloadUrl || '');
  const [checksumSha256, setChecksumSha256] = useState(app.checksumSha256 || app.sha256Checksum || '');
  const [sizeMb, setSizeMb] = useState<number>(
    typeof app.sizeMb === 'number' ? app.sizeMb : parseInt(app.apkSize || '25', 10) || 25
  );

  // Status & Upload State
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // Handle direct file upload for icons, banner, screenshots
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'ICON' | 'BANNER' | 'SCREENSHOT') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(target);
      setStatusMessage(null);
      const uid = user.id || app.developerUid || 'developer';
      
      let bucket: SupabaseBucketName = SUPABASE_BUCKETS.APP_SCREENSHOTS;
      if (target === 'ICON') bucket = SUPABASE_BUCKETS.APP_ICONS;
      else if (target === 'BANNER') bucket = SUPABASE_BUCKETS.APP_BANNERS;

      const res = await uploadMediaToSupabase(bucket, file, uid);
      if (res && res.publicUrl) {
        if (target === 'ICON') setIconUrl(res.publicUrl);
        else if (target === 'BANNER') setBannerUrl(res.publicUrl);
        else if (target === 'SCREENSHOT') setScreenshots((prev) => [...prev, res.publicUrl]);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'ERROR', text: `Upload failed: ${err.message}` });
    } finally {
      setIsUploading(null);
      e.target.value = '';
    }
  };

  const handleAddScreenshot = () => {
    if (!newScreenshotInput.trim()) return;
    setScreenshots((prev) => [...prev, newScreenshotInput.trim()]);
    setNewScreenshotInput('');
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'ERROR', text: 'App name cannot be empty.' });
      return;
    }
    if (!iconUrl.trim()) {
      setStatusMessage({ type: 'ERROR', text: 'App icon URL is required.' });
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage(null);

      const updates = {
        name: name.trim(),
        category,
        fullDescription: fullDescription.trim(),
        description: fullDescription.trim(),
        iconUrl: iconUrl.trim(),
        bannerUrl: bannerUrl.trim(),
        screenshots,
        downloadUrl: downloadUrl.trim(),
        checksumSha256: checksumSha256.trim(),
        sizeMb: Number(sizeMb) || 25,
        apkSize: `${Number(sizeMb) || 25} MB`
      };

      const developerUid = user.id || app.developerUid || '';
      await updateDeveloperAppMetadata(app.id, developerUid, updates, user.email);

      setStatusMessage({ type: 'SUCCESS', text: 'Application metadata saved successfully!' });
      onSaveSuccess(updates);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error updating app metadata:', err);
      setStatusMessage({ type: 'ERROR', text: err.message || 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#141522] border border-white/15 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#181928]">
          <div className="flex items-center gap-3">
            <img
              src={iconUrl || app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
              alt={name}
              className="w-12 h-12 rounded-2xl object-cover border border-white/10 bg-black/40 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{name || 'Manage Application'}</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[#C084FC] text-[10px] font-bold">
                  App Manage
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate max-w-md">
                {app.packageName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-6 border-b border-white/10 flex gap-2 bg-[#12131D]">
          <button
            onClick={() => setActiveSection('DETAILS')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition flex items-center gap-2 ${
              activeSection === 'DETAILS'
                ? 'border-[#9333EA] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Listing Details</span>
          </button>

          <button
            onClick={() => setActiveSection('MEDIA')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition flex items-center gap-2 ${
              activeSection === 'MEDIA'
                ? 'border-[#9333EA] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Icons & Screenshots</span>
          </button>

          <button
            onClick={() => setActiveSection('PACKAGE')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition flex items-center gap-2 ${
              activeSection === 'PACKAGE'
                ? 'border-[#9333EA] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>APK & Package Metadata</span>
          </button>
        </div>

        {/* Status Message Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-3 text-xs font-bold flex items-center gap-2 ${
              statusMessage.type === 'SUCCESS'
                ? 'bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-b border-red-500/20'
            }`}
          >
            {statusMessage.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSection === 'DETAILS' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Application Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pixel Quest Retro"
                  className="w-full px-4 py-2.5 bg-[#0E0F18] border border-white/10 rounded-2xl text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AppCategory)}
                  className="w-full px-4 py-2.5 bg-[#0E0F18] border border-white/10 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:border-[#9333EA]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#141522] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Full Store Description *
                </label>
                <textarea
                  rows={5}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Describe your application features, benefits, and gameplay..."
                  className="w-full px-4 py-3 bg-[#0E0F18] border border-white/10 rounded-2xl text-xs font-normal text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA] leading-relaxed"
                  required
                />
              </div>
            </div>
          )}

          {activeSection === 'MEDIA' && (
            <div className="space-y-6">
              {/* App Icon */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  App Icon (512x512 PNG/JPEG) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="https://.../icon.png"
                    className="flex-1 px-4 py-2.5 bg-[#0E0F18] border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                    required
                  />
                  <label className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#C084FC] cursor-pointer flex items-center gap-2 transition shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading === 'ICON' ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'ICON')}
                    />
                  </label>
                </div>
                {iconUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={iconUrl} alt="Preview" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                    <span className="text-[11px] text-zinc-400">Current Icon Preview</span>
                  </div>
                )}
              </div>

              {/* Banner Image */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Featured Banner Graphic (1024x500)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://.../banner.jpg"
                    className="flex-1 px-4 py-2.5 bg-[#0E0F18] border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                  />
                  <label className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#C084FC] cursor-pointer flex items-center gap-2 transition shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading === 'BANNER' ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'BANNER')}
                    />
                  </label>
                </div>
                {bannerUrl && (
                  <div className="mt-2">
                    <img
                      src={bannerUrl}
                      alt="Banner Preview"
                      className="w-full h-24 rounded-2xl object-cover border border-white/10"
                    />
                  </div>
                )}
              </div>

              {/* Screenshots Array */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Product Screenshots ({screenshots.length})
                </label>

                {/* Screenshot Input */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="url"
                    value={newScreenshotInput}
                    onChange={(e) => setNewScreenshotInput(e.target.value)}
                    placeholder="Paste image URL to add screenshot..."
                    className="flex-1 px-4 py-2.5 bg-[#0E0F18] border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                  />
                  <button
                    type="button"
                    onClick={handleAddScreenshot}
                    className="px-4 py-2.5 rounded-2xl bg-[#9333EA]/20 hover:bg-[#9333EA]/30 border border-[#9333EA]/40 text-xs font-bold text-[#C084FC] transition flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add URL</span>
                  </button>
                  <label className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#C084FC] cursor-pointer flex items-center gap-2 transition shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading === 'SCREENSHOT' ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'SCREENSHOT')}
                    />
                  </label>
                </div>

                {/* Screenshots Grid */}
                {screenshots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {screenshots.map((sUrl, idx) => (
                      <div key={idx} className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                        <img
                          src={sUrl}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(idx)}
                          className="absolute top-2 right-2 p-1.5 rounded-xl bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
                          title="Remove screenshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No screenshots added yet.</p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'PACKAGE' && (
            <div className="space-y-4">
              {/* Immutable Package Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Package Identifier (Immutable)</span>
                </label>
                <input
                  type="text"
                  value={app.packageName}
                  disabled
                  className="w-full px-4 py-2.5 bg-[#0A0A10] border border-white/5 rounded-2xl text-xs font-mono text-zinc-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Package names are strictly locked to prevent APK tampering and preserve user integrity.
                </p>
              </div>

              {/* Direct APK Download URL */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Direct APK Download URL *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://github.com/.../release/app-release.apk"
                    className="flex-1 px-4 py-2.5 bg-[#0E0F18] border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                    required
                  />
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#C084FC] transition"
                      title="Test URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* SHA-256 Checksum */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  APK SHA-256 Checksum (Optional)
                </label>
                <input
                  type="text"
                  value={checksumSha256}
                  onChange={(e) => setChecksumSha256(e.target.value)}
                  placeholder="e.g. 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
                  className="w-full px-4 py-2.5 bg-[#0E0F18] border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                />
              </div>

              {/* Package Size in MB */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  APK Size (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={sizeMb}
                  onChange={(e) => setSizeMb(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[#0E0F18] border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition"
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] hover:from-[#A855F7] hover:to-[#9333EA] text-white text-xs font-extrabold shadow-lg shadow-[#9333EA]/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save App Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
