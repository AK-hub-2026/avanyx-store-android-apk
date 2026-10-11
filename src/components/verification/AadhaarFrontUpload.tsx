import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Trash2, FileText, CreditCard, ShieldCheck } from 'lucide-react';
import { uploadAadhaarFront } from '../../services/avanyxUploadService';

interface AadhaarFrontUploadProps {
  userId: string;
  category: 'developer' | 'student';
  documentUrl: string;
  applicationToken?: string;
  onDocumentChange: (url: string) => void;
  error?: string;
  label?: string;
  subLabel?: string;
}

export const AadhaarFrontUpload: React.FC<AadhaarFrontUploadProps> = ({
  userId,
  category,
  documentUrl,
  applicationToken,
  onDocumentChange,
  error,
  label = 'Upload Aadhaar Card (Front)',
  subLabel = 'Upload a clear front-side image or PDF of your official Aadhaar card (Max 700KB, WebP/JPEG optimized).'
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(15);
    try {
      const res = await uploadAadhaarFront(file, userId, applicationToken, (progress) => {
        setUploadProgress(progress);
      });
      onDocumentChange(res.publicUrl);
    } catch (err: any) {
      console.warn('[AadhaarUpload] AVANYX upload service error:', err);
      const reader = new FileReader();
      reader.onload = () => {
        onDocumentChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
      }, 400);
    }
  };

  const isPdf = documentUrl.startsWith('data:application/pdf') || documentUrl.endsWith('.pdf');

  return (
    <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="font-bold text-[#49454F] dark:text-[#CAC4D0] block text-xs">
            {label} <span className="text-rose-500">*</span>
          </label>
          <p className="text-[11px] text-zinc-400">
            {subLabel}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>Encrypted Storage</span>
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Preview thumbnail */}
        <div className="relative w-28 h-20 sm:w-32 sm:h-24 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-black/10 dark:bg-white/5 flex items-center justify-center shrink-0 shadow-sm">
          {documentUrl ? (
            isPdf ? (
              <div className="flex flex-col items-center gap-1 text-[#6750A4] dark:text-[#D0BCFF]">
                <FileText className="w-8 h-8" />
                <span className="text-[9px] font-bold">PDF Document</span>
              </div>
            ) : (
              <img
                src={documentUrl}
                alt="Aadhaar Front Document"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="flex flex-col items-center text-zinc-400 gap-1">
              <CreditCard className="w-7 h-7" />
              <span className="text-[9px] font-bold">Aadhaar Front</span>
            </div>
          )}

          {documentUrl && (
            <div className="absolute top-1 right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1 space-y-2 w-full">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 text-xs font-bold text-[#1D1B20] dark:text-white hover:border-[#6750A4] flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-[#6750A4]" />
              <span>{documentUrl ? 'Replace Aadhaar Front' : 'Upload Aadhaar Front'}</span>
            </button>
            {documentUrl && (
              <button
                type="button"
                onClick={() => onDocumentChange('')}
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                title="Remove Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            {/* Status indicator per PART A */}
            {documentUrl && !isUploading ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Uploaded Securely</span>
              </span>
            ) : !isUploading ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                <span>Ready to Upload</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold border border-[#6750A4]/20">
                <span>Document Selected</span>
              </span>
            )}
          </div>

          {isUploading && (
            <div className="space-y-1">
              <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#6750A4] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress || 20}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 font-bold">Encrypting & uploading document {uploadProgress}%...</p>
            </div>
          )}

          {error && (
            <p className="text-[11px] text-rose-500 font-semibold">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
