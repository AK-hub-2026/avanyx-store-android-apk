import React from 'react';
import { ShieldCheck, Sparkles, KeyRound } from 'lucide-react';

interface AvanyxIdentityBadgeProps {
  variant?: 'gold' | 'purple' | 'subtle' | 'compact';
  appName?: string;
  className?: string;
}

export const AvanyxIdentityBadge: React.FC<AvanyxIdentityBadgeProps> = ({
  variant = 'gold',
  appName = 'AVANYX Ecosystem',
  className = ''
}) => {
  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 ${className}`}
      >
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span>AVANYX Identity</span>
      </span>
    );
  }

  if (variant === 'purple') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-2xl bg-[#6750A4]/10 dark:bg-[#6750A4]/20 border border-[#6750A4]/25 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold ${className}`}
      >
        <KeyRound className="w-3.5 h-3.5" />
        <span>AVANYX Identity SSO &bull; {appName}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-[#1E1B15] to-[#121316] border border-amber-500/30 text-amber-300 shadow-md ${className}`}
    >
      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-xs font-black tracking-wide uppercase bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
        AVANYX Identity
      </span>
      <span className="text-[10px] text-amber-400/80 font-medium font-mono">
        &bull; Cross-Platform SSO
      </span>
    </div>
  );
};
