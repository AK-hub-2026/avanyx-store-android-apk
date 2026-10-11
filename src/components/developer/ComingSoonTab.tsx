import React from 'react';
import {
  Smartphone,
  Package,
  HeartPulse,
  ShoppingBag,
  DollarSign,
  Share2,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { DeveloperConsoleTab } from './developerTypes';

interface ComingSoonTabProps {
  tab: DeveloperConsoleTab;
  onBackToDashboard: () => void;
}

export const ComingSoonTab: React.FC<ComingSoonTabProps> = ({
  tab,
  onBackToDashboard
}) => {
  const meta: Record<string, { title: string; desc: string; icon: React.ElementType; eta: string }> = {
    REACH_DEVICES: {
      title: 'Reach and Devices',
      desc: 'Target device filtering, SoC specifications, screen density exclusions, and RAM threshold configurations.',
      icon: Smartphone,
      eta: 'Q4 2026'
    },
    APP_BUNDLE_EXPLORER: {
      title: 'App Bundle Explorer (.aab)',
      desc: 'Dynamic feature modules, universal APK generation, split APK deliveries, and asset packs analyzer.',
      icon: Package,
      eta: 'Q4 2026'
    },
    ANDROID_VITALS: {
      title: 'Android Vitals & Performance',
      desc: 'ANR (Application Not Responding) rates, slow rendering frames, frozen frames, and background battery drain diagnostics.',
      icon: HeartPulse,
      eta: 'Q4 2026'
    },
    PRODUCTS_SKUS: {
      title: 'In-App Products & Subscriptions (SKUs)',
      desc: 'Digital consumable goods, monthly subscription tiers, and crypto/in-app billing integration.',
      icon: ShoppingBag,
      eta: 'Q1 2027'
    },
    FINANCIAL_REPORTS: {
      title: 'Financial Reports & Payouts',
      desc: 'Monthly developer earnings, tax documentation, payout remittance receipts, and refund analytics.',
      icon: DollarSign,
      eta: 'Q1 2027'
    },
    INTERNAL_SHARING: {
      title: 'Internal App Sharing',
      desc: 'Instant test build sharing links with QA testers without requiring full version deployment approval.',
      icon: Share2,
      eta: 'Q4 2026'
    }
  };

  const current = meta[tab] || {
    title: 'Advanced Developer Module',
    desc: 'This module is actively being developed for AVANYX Developer Console.',
    icon: Sparkles,
    eta: 'Coming Soon'
  };

  const Icon = current.icon;

  return (
    <div className="p-8 md:p-16 rounded-3xl bg-[#161722] border border-white/10 text-center max-w-2xl mx-auto my-8 space-y-6 shadow-2xl">
      <div className="w-20 h-20 rounded-3xl bg-[#9333EA]/20 border border-[#9333EA]/40 text-[#C084FC] flex items-center justify-center mx-auto shadow-lg shadow-[#9333EA]/20">
        <Icon className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#9333EA]/20 text-[#C084FC] font-extrabold text-[11px] uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Roadmap Milestone • {current.eta}</span>
        </div>
        <h2 className="text-2xl font-black text-white">{current.title}</h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          {current.desc}
        </p>
      </div>

      <div className="pt-4 flex justify-center">
        <button
          onClick={onBackToDashboard}
          className="px-6 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4 text-[#C084FC]" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
