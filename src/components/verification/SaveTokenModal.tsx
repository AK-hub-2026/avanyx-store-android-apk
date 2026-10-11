import React, { useState } from 'react';
import { KeyRound, Copy, Check, Share2, ShieldCheck, ArrowRight, X } from 'lucide-react';

interface SaveTokenModalProps {
  token: string;
  type: 'DEVELOPER' | 'STUDENT';
  isOpen: boolean;
  onClose: () => void;
}

export const SaveTokenModal: React.FC<SaveTokenModalProps> = ({
  token,
  type,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF]">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1D1B20] dark:text-[#E6E1E5]">
                Save Application Token
              </h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                {type === 'DEVELOPER' ? 'Developer Publisher' : 'Student Publisher'} Token
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#49454F] dark:text-[#CAC4D0]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#2B2C30] border border-[#6750A4]/20 space-y-2">
          <p className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5] leading-relaxed">
            "Save this Application Token. It is required to recover your draft."
          </p>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
            Drafts remain active in secure Firestore storage for 30 days. Auto-saving is enabled as you type.
          </p>
        </div>

        {/* Token Display Box */}
        <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-dashed border-[#6750A4]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 overflow-hidden">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#6750A4] dark:text-[#D0BCFF]">
              Your Unique Application Token
            </span>
            <div className="font-mono font-black text-base sm:text-lg text-[#1D1B20] dark:text-[#E6E1E5] tracking-wider truncate">
              {token}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6750A4] text-white hover:bg-[#533F85] transition text-xs font-bold shrink-0 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Token'}</span>
            </button>
            <button
              onClick={async () => {
                const text = `My AVANYX Store Application Token is ${token}.`;
                if (navigator.share) {
                  try {
                    await navigator.share({ title: 'Application Token', text });
                  } catch {}
                } else {
                  handleCopy();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/10 dark:border-white/10 text-xs font-bold shrink-0 shadow-sm"
            >
              <Share2 className="w-4 h-4 text-[#6750A4]" />
              <span>Share Token</span>
            </button>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmedSaved}
            onChange={(e) => setConfirmedSaved(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#6750A4] rounded border-gray-300 focus:ring-[#6750A4]"
          />
          <span className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-snug">
            I have copied or noted down my Application Token to resume my progress anytime.
          </span>
        </label>

        {/* Proceed Button */}
        <button
          onClick={onClose}
          disabled={!confirmedSaved && !copied}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#6750A4] text-white font-bold text-sm hover:bg-[#533F85] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
        >
          <span>Continue to Application</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Footer Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Permanently secured with AVANYX Zero-Knowledge Firestore encryption.</span>
        </div>
      </div>
    </div>
  );
};
