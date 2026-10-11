import React, { useState } from 'react';
import { StoreApp, User } from '../../types';
import {
  Users,
  ShieldCheck,
  Plus,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface TestingTracksTabProps {
  developerApps: StoreApp[];
  activeApp?: StoreApp;
  user: User;
}

export const TestingTracksTab: React.FC<TestingTracksTabProps> = ({
  developerApps,
  activeApp,
  user
}) => {
  const currentApp = activeApp || developerApps[0];
  const [copiedTrack, setCopiedTrack] = useState<string | null>(null);

  const copyInviteLink = (track: string) => {
    const link = `https://avanyx.store/test/${currentApp?.packageName || 'app'}?track=${track.toLowerCase()}`;
    navigator.clipboard.writeText(link);
    setCopiedTrack(track);
    setTimeout(() => setCopiedTrack(null), 2000);
  };

  const tracks = [
    {
      id: 'INTERNAL',
      name: 'Internal Testing Track',
      testersCount: 5,
      version: currentApp ? `v${currentApp.version}-internal` : 'v1.0.0-rc1',
      desc: 'Rapid QA iterations for your immediate studio team members.'
    },
    {
      id: 'CLOSED_BETA',
      name: 'Closed Beta Track',
      testersCount: 32,
      version: currentApp ? `v${currentApp.version}-beta` : 'v1.0.0-beta',
      desc: 'Invite-only early access testing for selected community members.'
    },
    {
      id: 'OPEN_BETA',
      name: 'Open Public Testing',
      testersCount: 140,
      version: currentApp ? `v${currentApp.version}` : 'v1.0.0',
      desc: 'Public opt-in beta testing directly available via AVANYX Store.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Pre-Release Testing Matrix</span>
          </div>
          <h1 className="text-2xl font-black text-white">Testing Tracks & Closed Beta</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Distribute sandbox builds, invite QA testers, and gather private feedback before promoting updates to production.
          </p>
        </div>

        {currentApp && (
          <div className="px-4 py-2 rounded-2xl bg-[#0F1015] border border-white/10 text-xs">
            <span className="text-zinc-400 font-bold">Active Track Target: </span>
            <span className="text-white font-extrabold">{currentApp.name}</span>
          </div>
        )}
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="p-6 rounded-3xl bg-[#161722] border border-white/10 space-y-4 hover:border-white/20 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#9333EA]/20 text-[#C084FC] text-[10px] font-extrabold">
                  {track.id}
                </span>
                <span className="text-xs text-zinc-400 font-mono">{track.version}</span>
              </div>

              <h3 className="text-base font-black text-white">{track.name}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{track.desc}</p>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Enrolled Testers</span>
                <span className="font-bold text-white">{track.testersCount} active</span>
              </div>

              <button
                onClick={() => copyInviteLink(track.id)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition flex items-center justify-center gap-2"
              >
                {copiedTrack === track.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Invite Link</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#C084FC]" />
                    <span>Copy Tester Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
