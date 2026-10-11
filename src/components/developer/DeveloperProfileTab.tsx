import React, { useState } from 'react';
import { User, DeveloperProfile } from '../../types';
import {
  Building2,
  Globe,
  Mail,
  CheckCircle2,
  Save,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { saveDeveloperProfile } from '../../services/firestoreService';

interface DeveloperProfileTabProps {
  user: User;
  activeUid: string;
  developerProfile?: DeveloperProfile | null;
}

export const DeveloperProfileTab: React.FC<DeveloperProfileTabProps> = ({
  user,
  activeUid,
  developerProfile
}) => {
  const [name, setName] = useState(developerProfile?.displayName || user.name || '');
  const [bio, setBio] = useState(developerProfile?.bio || 'Building cutting-edge applications for the AVANYX ecosystem.');
  const [website, setWebsite] = useState(developerProfile?.websiteUrl || 'https://');
  const [email, setEmail] = useState(user.email || '');
  const [logoUrl, setLogoUrl] = useState(developerProfile?.logoUrl || user.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(developerProfile?.bannerUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveDeveloperProfile(activeUid, {
        displayName: name.trim(),
        bio: bio.trim(),
        websiteUrl: website.trim(),
        email: email.trim(),
        logoUrl: logoUrl.trim(),
        bannerUrl: bannerUrl.trim(),
        verified: developerProfile?.verified || false
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC] uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-[#C084FC]" />
            <span>Public Studio Identity</span>
          </div>
          <h1 className="text-2xl font-black text-white">Developer Studio Profile</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Customize your public publisher brand page, official website links, and developer biography displayed across store listings.
          </p>
        </div>

        {developerProfile?.verified && (
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Studio</span>
          </span>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Developer Studio Profile updated successfully!</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Studio / Developer Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Official Contact Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Studio Website URL</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Avatar / Logo Image URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-2">Developer Bio / About Studio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white font-extrabold text-xs shadow-lg shadow-[#9333EA]/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
