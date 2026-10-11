import React, { useState, useRef, useEffect } from 'react';
import { StoreApp } from '../../types';
import { Layers, ChevronDown, Check, Plus, Search, Sparkles, Box } from 'lucide-react';

interface AppSelectorDropdownProps {
  developerApps: StoreApp[];
  selectedAppId: string;
  onSelectApp: (appId: string) => void;
  onAddNewApp?: () => void;
}

export const AppSelectorDropdown: React.FC<AppSelectorDropdownProps> = ({
  developerApps,
  selectedAppId,
  onSelectApp,
  onAddNewApp
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedApp = selectedAppId !== 'ALL' ? developerApps.find((a) => a.id === selectedAppId) : null;

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredApps = developerApps.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Pill Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all text-left group select-none ${
          isOpen
            ? 'bg-[#202234] border-[#9333EA]/60 shadow-lg shadow-[#9333EA]/10'
            : 'bg-[#181926] hover:bg-[#1F2030] border-white/10 hover:border-white/20 shadow-sm'
        }`}
      >
        {/* App Icon or All Apps Icon */}
        {selectedApp ? (
          <img
            src={selectedApp.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
            alt={selectedApp.name}
            className="w-7 h-7 rounded-lg object-cover bg-black/40 border border-white/15 shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#9333EA]/40 to-[#6366F1]/40 border border-[#9333EA]/40 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#C084FC]" />
          </div>
        )}

        {/* App Info / Package Name */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-white truncate max-w-[130px] sm:max-w-[200px] leading-tight">
              {selectedApp ? selectedApp.name : 'All Applications'}
            </span>
            {selectedApp && (
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white/10 text-zinc-300">
                v{selectedApp.version || '1.0.0'}
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[130px] sm:max-w-[200px] leading-tight">
            {selectedApp ? selectedApp.packageName : `${developerApps.length} published`}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#C084FC]' : ''
          }`}
        />
      </button>

      {/* Dropdown Floating Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#151624] border border-white/15 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header if > 2 apps */}
          {developerApps.length > 2 && (
            <div className="p-2.5 border-b border-white/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter your apps..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0E0F18] rounded-xl border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]/60 font-sans"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* List Options */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1 no-scrollbar">
            {/* 1. All Apps Option */}
            <button
              type="button"
              onClick={() => {
                onSelectApp('ALL');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                selectedAppId === 'ALL'
                  ? 'bg-[#9333EA]/20 border border-[#9333EA]/40 text-white'
                  : 'hover:bg-white/5 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9333EA] to-[#6366F1] flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-black text-white leading-tight">All Applications</p>
                  <p className="text-[10px] text-zinc-400 font-mono">Overview ({developerApps.length} apps)</p>
                </div>
              </div>
              {selectedAppId === 'ALL' && <Check className="w-4 h-4 text-[#C084FC] shrink-0" />}
            </button>

            <div className="px-2 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
              Your Applications ({developerApps.length})
            </div>

            {/* 2. Developer App Items */}
            {filteredApps.length > 0 ? (
              filteredApps.map((app) => {
                const isSelected = selectedAppId === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      onSelectApp(app.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                      isSelected
                        ? 'bg-[#9333EA]/20 border border-[#9333EA]/40 text-white'
                        : 'hover:bg-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                        alt={app.name}
                        className="w-8 h-8 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                      />
                      <div className="text-left min-w-0">
                        <p className="text-xs font-black text-white truncate leading-tight">{app.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{app.packageName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                        v{app.version || '1.0.0'}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#C084FC]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-zinc-500">
                {developerApps.length === 0 ? 'No apps published yet' : 'No apps match your filter'}
              </div>
            )}
          </div>

          {/* Footer: Quick Submit Link */}
          {onAddNewApp && (
            <div className="p-2 border-t border-white/10 bg-[#0E0F18]/80">
              <button
                type="button"
                onClick={() => {
                  onAddNewApp();
                  setIsOpen(false);
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-[#9333EA]/20 border border-white/10 hover:border-[#9333EA]/30 text-xs font-bold text-[#C084FC] flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit New Application</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
