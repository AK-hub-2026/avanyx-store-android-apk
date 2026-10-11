import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Settings, Shield, Moon, Sun, Bell, Download, RefreshCw, Key, Database } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { darkMode, setDarkMode } = useStore();
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [securityScanning, setSecurityScanning] = useState(true);
  const [wiFiOnlyDownloads, setWiFiOnlyDownloads] = useState(false);

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Title */}
      <div className="pt-2">
        <h1 className="text-2xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
          <Settings className="w-7 h-7 text-[#6750A4] dark:text-[#D0BCFF]" />
          Store Preferences & Settings
        </h1>
        <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
          Configure security protocols, theme defaults, auto-updates, and download parameters
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Theme Settings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF]">
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">Dark Theme</h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Toggle between high-contrast dark canvas and light material layout
              </p>
            </div>
          </div>

          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
              darkMode ? 'bg-[#6750A4]' : 'bg-black/20'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Security Scanning */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                Real-Time CyberShield Scanning
              </h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Automatically verify APK integrity and SHA-256 signatures before installation
              </p>
            </div>
          </div>

          <button
            onClick={() => setSecurityScanning(!securityScanning)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
              securityScanning ? 'bg-emerald-500' : 'bg-black/20'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                securityScanning ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto Update */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                Auto-Update Applications
              </h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Keep installed apps automatically updated to their latest verified build
              </p>
            </div>
          </div>

          <button
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
              autoUpdate ? 'bg-amber-500' : 'bg-black/20'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                autoUpdate ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Wi-Fi Only Downloads */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                Wi-Fi Only Downloads
              </h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                Pause large APK package downloads over mobile cellular networks
              </p>
            </div>
          </div>

          <button
            onClick={() => setWiFiOnlyDownloads(!wiFiOnlyDownloads)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
              wiFiOnlyDownloads ? 'bg-blue-500' : 'bg-black/20'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                wiFiOnlyDownloads ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
