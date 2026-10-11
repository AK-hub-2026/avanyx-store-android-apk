import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { AvanyxIdentityHeader } from '../../components/identity/AvanyxIdentityHeader';
import { IdentityLandingPage } from './IdentityLandingPage';
import { IdentityLoginPage } from './IdentityLoginPage';
import { IdentitySignUpPage } from './IdentitySignUpPage';
import { IdentityAccountPage } from './IdentityAccountPage';
import { IdentityOAuthAdminPage } from './IdentityOAuthAdminPage';
import { IdentityRoute } from '../../types/identity';

interface AvanyxIdentityRouterProps {
  initialPath?: string;
}

export const AvanyxIdentityRouter: React.FC<AvanyxIdentityRouterProps> = ({
  initialPath = '/identity'
}) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/identity')) return p;
    }
    return initialPath;
  });

  // Keep state synced with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p.startsWith('/identity')) {
        setCurrentPath(p);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (newPath: string) => {
    setCurrentPath(newPath);
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render appropriate view based on route
  const renderScreen = () => {
    if (currentPath === '/identity/login') {
      return <IdentityLoginPage onNavigate={handleNavigate} />;
    }
    if (currentPath === '/identity/signup') {
      return <IdentitySignUpPage onNavigate={handleNavigate} />;
    }
    if (currentPath === '/identity/admin' || currentPath === '/identity/admin/oauth') {
      return <IdentityOAuthAdminPage onNavigate={handleNavigate} />;
    }
    if (currentPath === '/identity/apps') {
      return <IdentityAccountPage initialSubTab="APPS" onNavigate={handleNavigate} />;
    }
    if (currentPath === '/identity/account/devices') {
      return <IdentityAccountPage initialSubTab="DEVICES" onNavigate={handleNavigate} />;
    }
    if (currentPath === '/identity/account/connections') {
      return <IdentityAccountPage initialSubTab="CONNECTIONS" onNavigate={handleNavigate} />;
    }
    if (currentPath === '/identity/account/security') {
      return <IdentityAccountPage initialSubTab="SECURITY" onNavigate={handleNavigate} />;
    }
    if (currentPath.startsWith('/identity/account')) {
      return <IdentityAccountPage initialSubTab="PROFILE" onNavigate={handleNavigate} />;
    }

    // Default to Landing Page (/identity)
    return <IdentityLandingPage onNavigate={handleNavigate} />;
  };

  return (
    <div className="min-h-screen bg-[#07060A] text-[#FAFAFA] flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <AvanyxIdentityHeader currentPath={currentPath} onNavigate={handleNavigate} />

      {/* Identity Status Announcement Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-zinc-950 border-b border-amber-500/30 px-4 py-3 text-xs text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/40 text-amber-300 font-black text-[10px] uppercase flex items-center gap-1 shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Disabled / Backend Pending
          </span>
          <div className="text-xs">
            <span className="font-bold text-white">AVANYX Identity development is currently frozen.</span>{' '}
            <span className="text-amber-200/80">Please use the current Firebase Authentication login system for all Store and Developer Console features.</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black tracking-wide shrink-0 transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store Login</span>
        </button>
      </div>

      <main className="flex-1">
        {renderScreen()}
      </main>
    </div>
  );
};
