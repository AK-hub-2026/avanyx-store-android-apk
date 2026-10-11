import React from 'react';
import { useStore } from '../context/StoreContext';
import { AppCard } from '../components/AppCard';
import { Gamepad2, Trophy, Flame, Sparkles } from 'lucide-react';

export const GamesScreen: React.FC = () => {
  const { apps, appsLoading } = useStore();

  const games = apps.filter((a) => a.isGame || a.category === 'GAMES' || ['CASUAL', 'ARCADE', 'ACTION', 'RACING'].includes(a.category));

  return (
    <div className="space-y-6 pb-12">
      {/* Games Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-[#6750A4] dark:text-[#D0BCFF]" />
            AVANYX Games Hub
          </h1>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
            High-performance games with ray-tracing support and controller compatibility
          </p>
        </div>
      </div>

      {/* Featured Game Hero */}
      {games.length > 0 && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-lg">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-black text-[11px] font-black uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" /> Game of the Month
              </span>
              <h2 className="text-2xl md:text-3xl font-black">{games[0].name}</h2>
              <p className="text-xs md:text-sm text-white/80 leading-relaxed">
                {games[0].description}
              </p>
              <div className="flex items-center gap-3 pt-2 text-xs">
                <span className="font-bold">⭐ {games[0].rating}</span>
                <span>•</span>
                <span>{games[0].downloads} players</span>
                <span>•</span>
                <span>{games[0].apkSize}</span>
              </div>
            </div>

            <img
              src={games[0].iconUrl}
              alt={games[0].name}
              className="w-28 h-28 md:w-36 md:h-36 rounded-3xl object-cover ring-4 ring-white/20 shadow-2xl shrink-0"
            />
          </div>
        </section>
      )}

      {/* Top Game Rankings or Empty State */}
      <section className="space-y-4">
        <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" /> Top Game Charts
        </h2>

        {appsLoading && games.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 animate-pulse h-20" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
              No published apps available
            </h3>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-sm mx-auto">
              No published games are currently available in the AVANYX Games Hub.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((game, idx) => (
              <div key={game.id} className="flex items-center gap-3">
                <span className="text-lg font-black text-[#6750A4] dark:text-[#D0BCFF] w-6 text-center">
                  #{idx + 1}
                </span>
                <div className="flex-1">
                  <AppCard app={game} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
