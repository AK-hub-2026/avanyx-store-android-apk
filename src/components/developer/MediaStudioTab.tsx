import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  HardDrive,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { uploadMediaToSupabase, SUPABASE_BUCKETS, SupabaseBucketName } from '../../services/supabaseStorage';

interface MediaStudioTabProps {
  activeUid: string;
}

export const MediaStudioTab: React.FC<MediaStudioTabProps> = ({ activeUid }) => {
  const [selectedBucket, setSelectedBucket] = useState<SupabaseBucketName>(SUPABASE_BUCKETS.APP_ICONS);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<Array<{ id: string; name: string; url: string; size: string; type: string }>>([
    {
      id: 'asset-1',
      name: 'avanyx_store_icon_512.png',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512',
      size: '240 KB',
      type: 'ICON'
    },
    {
      id: 'asset-2',
      name: 'avanyx_store_banner_1024x500.png',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1024',
      size: '620 KB',
      type: 'BANNER'
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadMediaToSupabase(selectedBucket, file, activeUid);
      setUploadedAssets((prev) => [
        {
          id: `asset-${Date.now()}`,
          name: file.name,
          url: result.publicUrl,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          type: selectedBucket
        },
        ...prev
      ]);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDelete = (id: string) => {
    setUploadedAssets((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/webp,video/mp4"
        className="hidden"
      />

      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC] uppercase tracking-wider mb-1">
            <UploadCloud className="w-4 h-4 text-[#C084FC]" />
            <span>Supabase Media Studio</span>
          </div>
          <h1 className="text-2xl font-black text-white">Media Asset Studio</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Upload high-resolution icons, 1024×500 promotional graphics, and screenshot sets to your cloud storage buckets.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white font-extrabold text-xs shadow-lg shadow-[#9333EA]/30 transition flex items-center gap-2 disabled:opacity-50"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{isUploading ? 'Uploading to Supabase...' : 'Upload Media Asset'}</span>
        </button>
      </div>

      {/* Bucket Filter */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#161722] border border-white/10 overflow-x-auto">
        {[
          { id: SUPABASE_BUCKETS.APP_ICONS as SupabaseBucketName, label: 'App Icons (512x512)' },
          { id: SUPABASE_BUCKETS.APP_BANNERS as SupabaseBucketName, label: 'Feature Banners (1024x500)' },
          { id: SUPABASE_BUCKETS.APP_SCREENSHOTS as SupabaseBucketName, label: 'Screenshots' }
        ].map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBucket(b.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
              selectedBucket === b.id
                ? 'bg-[#9333EA] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Media Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {uploadedAssets.map((asset) => (
          <div
            key={asset.id}
            className="rounded-2xl bg-[#161722] border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-[#9333EA]/40 transition"
          >
            <div className="aspect-video w-full bg-black/40 overflow-hidden relative">
              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="font-bold text-white text-xs truncate">{asset.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{asset.size}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  onClick={() => handleCopy(asset.url, asset.id)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white font-bold flex items-center gap-1 transition"
                >
                  {copiedUrl === asset.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl === asset.id ? 'Copied' : 'Copy URL'}</span>
                </button>

                <button
                  onClick={() => handleDelete(asset.id)}
                  className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                  title="Remove asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
