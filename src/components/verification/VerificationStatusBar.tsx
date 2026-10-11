import React from 'react';
import {
  CheckCircle2,
  Clock,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Globe,
  Database,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface VerificationStatusBarProps {
  type: 'DEVELOPER' | 'STUDENT';
  token?: string;
  draftSavedAt?: string | null;
  verificationStatus?: string;
  paymentStatus?: string;
  profileSynced?: boolean;
}

export const VerificationStatusBar: React.FC<VerificationStatusBarProps> = ({
  type,
  token,
  draftSavedAt,
  verificationStatus = 'DRAFT',
  paymentStatus = 'PENDING_PAYMENT',
  profileSynced = false
}) => {
  return (
    <div className="w-full bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 rounded-2xl p-3.5 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* 1. Developer Profile Synced */}
        <div className="flex items-center gap-1.5 font-bold">
          <div className={`w-2.5 h-2.5 rounded-full ${profileSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-[#1D1B20] dark:text-[#E6E1E5]">Profile Synced:</span>
          <span className={profileSynced ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-amber-600 dark:text-amber-400'}>
            {profileSynced ? 'Live Synced' : 'Pending Verification'}
          </span>
        </div>

        {/* 2. Token Saved */}
        {token && (
          <div className="flex items-center gap-1 text-[#49454F] dark:text-[#CAC4D0]">
            <KeyRound className="w-3.5 h-3.5 text-[#6750A4] dark:text-[#D0BCFF]" />
            <span className="font-semibold">Token:</span>
            <code className="font-mono text-[11px] font-extrabold text-[#6750A4] dark:text-[#D0BCFF] bg-white dark:bg-[#121316] px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/5">
              {token}
            </code>
          </div>
        )}

        {/* 3. Draft Last Saved Time */}
        {draftSavedAt && (
          <div className="flex items-center gap-1 text-[#49454F] dark:text-[#CAC4D0]">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold">Draft Saved:</span>
            <span className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">{draftSavedAt}</span>
          </div>
        )}

        {/* 4. Verification Status */}
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-semibold text-[#49454F] dark:text-[#CAC4D0]">Verification:</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              verificationStatus === 'APPROVED' || verificationStatus === 'VERIFIED'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : verificationStatus === 'REJECTED'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}
          >
            {verificationStatus}
          </span>
        </div>

        {/* 5. Payment Status */}
        <div className="flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5 text-purple-600" />
          <span className="font-semibold text-[#49454F] dark:text-[#CAC4D0]">Payment:</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              paymentStatus === 'APPROVED'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : paymentStatus === 'PAID_PENDING_APPROVAL'
                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}
          >
            {paymentStatus === 'PAID_PENDING_APPROVAL' ? 'Paid (Pending Review)' : paymentStatus}
          </span>
        </div>

        {/* 6. Public Profile Live */}
        <div className="flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-semibold text-[#49454F] dark:text-[#CAC4D0]">Public Profile:</span>
          <span className={profileSynced ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 font-bold'}>
            {profileSynced ? 'Live' : 'Hidden'}
          </span>
        </div>

        {/* 7. Zero Mock Data Indicator */}
        <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
          <Database className="w-3 h-3" />
          <span>Live Firestore</span>
        </div>
      </div>
    </div>
  );
};
