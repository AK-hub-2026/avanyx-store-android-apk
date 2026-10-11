import React from 'react';
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Lock,
  ExternalLink,
  Smartphone
} from 'lucide-react';

export const PolicyCenterTab: React.FC = () => {
  const policies = [
    {
      title: 'Target SDK Requirements',
      desc: 'All submitted APKs must target Android 13 (API 33) or higher (Android 14 API 34 recommended) to ensure full platform security.',
      status: 'COMPLIANT'
    },
    {
      title: 'User Privacy & Permission Declarations',
      desc: 'Apps requesting sensitive permissions (Location, Storage, Camera) must declare functional necessity in the listing description.',
      status: 'COMPLIANT'
    },
    {
      title: 'Zero Malicious Code Guarantee',
      desc: 'APKs containing hidden cryptominers, unauthorized device tracking, or aggressive popup adware will be permanently delisted.',
      status: 'ENFORCED'
    },
    {
      title: 'Cryptographic Binary Integrity',
      desc: 'APK downloads must provide verifiable SHA-256 signatures matching the original developer signing keystore.',
      status: 'ENFORCED'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Developer Policy & Compliance</span>
          </div>
          <h1 className="text-2xl font-black text-white">Policy Center & Guidelines</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Maintain your store standing, review APK binary distribution standards, and ensure compatibility with AVANYX Store policies.
          </p>
        </div>

        <span className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs">
          ACCOUNT HEALTH: EXCELLENT
        </span>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {policies.map((p, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-2 hover:border-white/20 transition"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">{p.title}</h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold">
                {p.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
