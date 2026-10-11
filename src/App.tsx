import React, { useEffect, useState, lazy, Suspense, startTransition } from 'react';
import { useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AutoSEOEngine } from './components/seo/AutoSEOEngine';
import { Shield, Lock, Terminal, ShieldAlert, ArrowRight, LogIn, ArrowLeft, BadgeCheck, GraduationCap, Loader2 } from 'lucide-react';

// Eagerly loaded primary screens
import { HomeScreen } from './screens/HomeScreen';
import { IntroWelcomePage } from './screens/IntroWelcomePage';

// Lazy loaded secondary screens for optimal bundle size & mobile PageSpeed
const GamesScreen = lazy(() => import('./screens/GamesScreen').then(m => ({ default: m.GamesScreen })));
const AppsScreen = lazy(() => import('./screens/AppsScreen').then(m => ({ default: m.AppsScreen })));
const DownloadsScreen = lazy(() => import('./screens/DownloadsScreen').then(m => ({ default: m.DownloadsScreen })));
const SecurityAlertsScreen = lazy(() => import('./screens/SecurityAlertsScreen').then(m => ({ default: m.SecurityAlertsScreen })));
const DeveloperConsoleScreen = lazy(() => import('./screens/DeveloperConsoleScreen').then(m => ({ default: m.DeveloperConsoleScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen').then(m => ({ default: m.NotificationsScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const AppDetailsScreen = lazy(() => import('./screens/AppDetailsScreen').then(m => ({ default: m.AppDetailsScreen })));
const AdminConsoleScreen = lazy(() => import('./screens/AdminConsoleScreen').then(m => ({ default: m.AdminConsoleScreen })));
const AccountSettingsScreen = lazy(() => import('./screens/AccountSettingsScreen').then(m => ({ default: m.AccountSettingsScreen })));
const GmailScreen = lazy(() => import('./screens/GmailScreen').then(m => ({ default: m.GmailScreen })));
const DeveloperProfileScreen = lazy(() => import('./screens/DeveloperProfileScreen').then(m => ({ default: m.DeveloperProfileScreen })));
const StoreLoginPage = lazy(() => import('./screens/StoreLoginPage').then(m => ({ default: m.StoreLoginPage })));
const DeveloperApplyScreen = lazy(() => import('./screens/DeveloperApplyScreen').then(m => ({ default: m.DeveloperApplyScreen })));
const StudentApplyScreen = lazy(() => import('./screens/StudentApplyScreen').then(m => ({ default: m.StudentApplyScreen })));
const StudentConsoleScreen = lazy(() => import('./screens/StudentConsoleScreen').then(m => ({ default: m.StudentConsoleScreen })));
const AvanyxIdentityRouter = lazy(() => import('./screens/identity/AvanyxIdentityRouter').then(m => ({ default: m.AvanyxIdentityRouter })));
const PurchaseHistoryScreen = lazy(() => import('./screens/PurchaseHistoryScreen').then(m => ({ default: m.PurchaseHistoryScreen })));
const IdentitySignUpPage = lazy(() => import('./screens/identity/IdentitySignUpPage').then(m => ({ default: m.IdentitySignUpPage })));
const IdentityAccountPage = lazy(() => import('./screens/identity/IdentityAccountPage').then(m => ({ default: m.IdentityAccountPage })));
const IdentityOAuthAdminPage = lazy(() => import('./screens/identity/IdentityOAuthAdminPage').then(m => ({ default: m.IdentityOAuthAdminPage })));
const RewardsCenterScreen = lazy(() => import('./screens/RewardsCenterScreen').then(m => ({ default: m.RewardsCenterScreen })));
import { NativeDownloadTray } from './components/download/NativeDownloadTray';

const ScreenFallback = () => (
  <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
    <Loader2 className="w-8 h-8 text-[#6750A4] dark:text-[#D0BCFF] animate-spin" />
    <span className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">Loading AVANYX module...</span>
  </div>
);

export const AppContent: React.FC = () => {
  const { currentTab, setCurrentTab, user, isAuthenticated, authLoading } = useStore();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  const isDeveloper = isAuthenticated && (user.role === 'DEVELOPER' || user.role === 'ADMIN' || user.realRole === 'ADMIN' || user.verifiedDeveloper);
  const isAdmin = isAuthenticated && (user.role === 'ADMIN' || user.realRole === 'ADMIN');
  const isStudent = isAuthenticated && (user.role === 'STUDENT' || user.studentStatus === 'VERIFIED' || user.role === 'ADMIN' || user.realRole === 'ADMIN');

  // Helper to test if user has previously visited or dismissed intro
  const hasVisitedStore = () => {
    return typeof window !== 'undefined' && localStorage.getItem('avanyx_visited_before') === 'true';
  };

  // Keep state in sync with URL
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);

      startTransition(() => {
        if (path === '/intro') {
          setCurrentTab('INTRO');
        } else if (path === '/' || path === '') {
          // Logged in or returning users land on Store (HOME) by default
          const hasSession = isAuthenticated || (typeof window !== 'undefined' && !!localStorage.getItem('avanyx_auth_user'));
          const visitedBefore = hasVisitedStore();
          if (hasSession || visitedBefore) {
            setCurrentTab('HOME');
          } else {
            setCurrentTab('INTRO');
          }
        } else if (path === '/store') {
          setCurrentTab('HOME');
          if (typeof window !== 'undefined') {
            localStorage.setItem('avanyx_visited_before', 'true');
          }
        } else if (path === '/login') {
          setCurrentTab('LOGIN');
        } else if (path === '/signup') {
          setCurrentTab('SIGNUP');
        } else if (path === '/developer/apply') {
          setCurrentTab('DEVELOPER_APPLY');
        } else if (path === '/student/apply') {
          setCurrentTab('STUDENT_APPLY');
        } else if (path === '/student' || path === '/student/console' || path === '/student-console') {
          setCurrentTab('STUDENT_CONSOLE');
        } else if (path === '/about') {
          setCurrentTab('INTRO');
          setTimeout(() => {
            const el = document.getElementById('about');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else if (path === '/faq' || path === '/faqs') {
          setCurrentTab('INTRO');
          setTimeout(() => {
            const el = document.getElementById('faqs');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else if (path === '/account' || path === '/profile') {
          setCurrentTab('PROFILE');
        } else if (path === '/purchases' || path === '/billing' || path === '/orders') {
          setCurrentTab('PURCHASE_HISTORY');
        } else if (path === '/developer' || path === '/dev' || path === '/developer-console' || path === '/developer/console') {
          setCurrentTab('DEV_CONSOLE');
        } else if (path === '/admin' || path === '/admin-console') {
          setCurrentTab('ADMIN_CONSOLE');
        } else if (path === '/identity/admin' || path === '/identity/admin/oauth') {
          setCurrentTab('ADMIN_OAUTH');
        } else if (path.startsWith('/identity')) {
          setCurrentTab('IDENTITY');
        }
      });
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [setCurrentTab, isAuthenticated]);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);

    startTransition(() => {
      if (path === '/intro') {
        setCurrentTab('INTRO');
      } else if (path === '/' || path === '') {
        const hasSession = isAuthenticated || (typeof window !== 'undefined' && !!localStorage.getItem('avanyx_auth_user'));
        const visitedBefore = hasVisitedStore();
        if (hasSession || visitedBefore) {
          setCurrentTab('HOME');
        } else {
          setCurrentTab('INTRO');
        }
      } else if (path === '/store') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('avanyx_visited_before', 'true');
        }
        setCurrentTab('HOME');
      } else if (path === '/login') {
        setCurrentTab('LOGIN');
      } else if (path === '/signup') {
        setCurrentTab('SIGNUP');
      } else if (path === '/developer/apply') {
        setCurrentTab('DEVELOPER_APPLY');
      } else if (path === '/student/apply') {
        setCurrentTab('STUDENT_APPLY');
      } else if (path === '/student' || path === '/student/console' || path === '/student-console') {
        setCurrentTab('STUDENT_CONSOLE');
      } else if (path === '/about') {
        setCurrentTab('INTRO');
        setTimeout(() => {
          const el = document.getElementById('about');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (path === '/faq' || path === '/faqs') {
        setCurrentTab('INTRO');
        setTimeout(() => {
          const el = document.getElementById('faqs');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (path === '/account' || path === '/profile') {
        setCurrentTab('PROFILE');
      } else if (path === '/developer' || path === '/dev' || path === '/developer-console' || path === '/developer/console') {
        setCurrentTab('DEV_CONSOLE');
      } else if (path === '/admin' || path === '/admin-console') {
        setCurrentTab('ADMIN_CONSOLE');
      } else if (path === '/identity/admin' || path === '/identity/admin/oauth') {
        setCurrentTab('ADMIN_OAUTH');
      } else if (path.startsWith('/identity')) {
        setCurrentTab('IDENTITY');
      }
    });
  };



  // 0. AUTH LOADING GUARD: Wait for Firebase auth state using onAuthStateChanged() before rendering protected routes
  const isTargetingProtected =
    currentTab === 'DEV_CONSOLE' ||
    currentTab === 'STUDENT_CONSOLE' ||
    currentTab === 'ADMIN_OAUTH' ||
    currentTab === 'ADMIN_CONSOLE' ||
    currentPath === '/developer' ||
    currentPath === '/student' ||
    currentPath === '/admin' ||
    currentPath === '/admin-console' ||
    currentPath === '/dev' ||
    currentPath === '/developer-console' ||
    currentPath === '/developer/console' ||
    currentPath.startsWith('/identity/admin');

  if (authLoading && isTargetingProtected) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0F1015] text-white p-6 select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#6750A4]/20 border border-[#6750A4]/40 flex items-center justify-center mb-5 animate-pulse shadow-2xl shadow-[#6750A4]/20">
          <Shield className="w-8 h-8 text-[#D0BCFF]" />
        </div>
        <div className="text-base font-black flex items-center gap-2 text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6750A4] animate-ping" />
          <span>Verifying AVANYX Security Clearance...</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1 font-medium">Synchronizing with Firebase Authentication Authority</p>
      </div>
    );
  }

  // 1. Separate Intro / Welcome Marketing Page Route (/intro or currentTab === 'INTRO')
  // Authenticated & returning users default to the Store. Any user can still freely visit /intro whenever they choose.
  if (
    currentTab === 'INTRO' ||
    currentPath === '/intro' ||
    (currentPath === '/' &&
      !isAuthenticated &&
      !hasVisitedStore() &&
      currentTab !== 'HOME' &&
      currentTab !== 'GAMES' &&
      currentTab !== 'APPS' &&
      currentTab !== 'DOWNLOADS' &&
      currentTab !== 'SECURITY_ALERTS' &&
      currentTab !== 'DEV_CONSOLE' &&
      currentTab !== 'STUDENT_CONSOLE' &&
      currentTab !== 'ADMIN_CONSOLE' &&
      currentTab !== 'SETTINGS' &&
      currentTab !== 'NOTIFICATIONS' &&
      currentTab !== 'PROFILE' &&
      currentTab !== 'APP_DETAILS' &&
      currentTab !== 'DEVELOPER_PROFILE')
  ) {
    return <IntroWelcomePage onNavigate={navigateTo} />;
  }

  // 2. Separate Login Page Route (/login or currentTab === 'LOGIN')
  if (currentTab === 'LOGIN' || currentPath === '/login') {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <StoreLoginPage
          onBackToStore={() => navigateTo('/store')}
          onNavigateToSignUp={() => navigateTo('/signup')}
          onSuccess={() => navigateTo('/store')}
        />
      </Suspense>
    );
  }

  // 3. Separate SignUp Page Route (/signup or currentTab === 'SIGNUP')
  if (currentTab === 'SIGNUP' || currentPath === '/signup') {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <IdentitySignUpPage
          onNavigate={navigateTo}
          redirectUri="/store"
        />
      </Suspense>
    );
  }

  // 5. Standalone Identity Admin OAuth Panel (/identity/admin, /identity/admin/oauth, or currentTab === 'ADMIN_OAUTH')
  // Guard: /identity/admin/oauth requires authenticated admin (role === "ADMIN")
  if (
    currentTab === 'ADMIN_OAUTH' ||
    currentPath === '/identity/admin' ||
    currentPath === '/identity/admin/oauth'
  ) {
    if (!isAuthenticated) {
      return (
        <Suspense fallback={<ScreenFallback />}>
          <StoreLoginPage
            onBackToStore={() => navigateTo('/store')}
            onNavigateToSignUp={() => navigateTo('/signup')}
            onSuccess={() => navigateTo('/identity/admin/oauth')}
          />
        </Suspense>
      );
    }

    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-[#07060A] text-[#FAFAFA] flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md p-8 rounded-3xl bg-[#121118] border border-rose-500/30 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">Administrator Clearance Required</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The AVANYX OAuth 2.0 Governance Console is strictly restricted to verified system administrators. Your current account role is <strong className="text-amber-400 font-bold">{user?.role || 'USER'}</strong>.
            </p>
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => navigateTo('/store')}
                className="w-full py-3 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-black text-xs shadow-lg shadow-[#6750A4]/25 transition-all"
              >
                Return to AVANYX Store
              </button>
              <button
                onClick={() => navigateTo('/login')}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-all"
              >
                Sign In with Admin Credentials
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={<ScreenFallback />}>
        <IdentityOAuthAdminPage
          onNavigate={navigateTo}
        />
      </Suspense>
    );
  }

  // 6. Standalone Identity Platform Root & Subroutes (/identity/* or currentTab === 'IDENTITY')
  if (currentTab === 'IDENTITY' || currentPath.startsWith('/identity')) {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <AvanyxIdentityRouter />
      </Suspense>
    );
  }

  // 7. Developer Console Full-Screen
  // Guard: /developer requires authenticated developer (role === "DEVELOPER" or role === "ADMIN")
  if (
    currentTab === 'DEV_CONSOLE' ||
    currentPath === '/developer' ||
    currentPath === '/dev' ||
    currentPath === '/developer-console' ||
    currentPath === '/developer/console'
  ) {
    if (!isAuthenticated) {
      return (
        <Suspense fallback={<ScreenFallback />}>
          <StoreLoginPage
            onBackToStore={() => navigateTo('/store')}
            onNavigateToSignUp={() => navigateTo('/signup')}
            onSuccess={() => navigateTo('/developer')}
          />
        </Suspense>
      );
    }

    if (!isDeveloper) {
      if (user?.developerStatus === 'PENDING_REVIEW' || user?.developerDetails?.status === 'PENDING_REVIEW') {
        return (
          <Suspense fallback={<ScreenFallback />}>
            <DeveloperApplyScreen onBack={() => navigateTo('/store')} />
          </Suspense>
        );
      }

      return (
        <div className="min-h-screen bg-[#0F1015] text-white flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md p-8 rounded-3xl bg-[#181924] border border-[#6750A4]/30 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#6750A4]/20 border border-[#6750A4]/40 flex items-center justify-center mx-auto text-[#D0BCFF]">
              <Terminal className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">Developer Clearance Required</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Access to the AVANYX Developer Studio Console requires verified Developer credentials. Your current account role is <strong className="text-purple-400 font-bold">{user?.role || 'USER'}</strong>.
            </p>
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => navigateTo('/developer/apply')}
                className="w-full py-3 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-black text-xs shadow-lg shadow-[#6750A4]/25 flex items-center justify-center gap-2 transition-all"
              >
                <BadgeCheck className="w-4 h-4" />
                <span>Apply for Developer Verification</span>
              </button>
              <button
                onClick={() => navigateTo('/store')}
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-all"
              >
                Return to AVANYX Store
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={<ScreenFallback />}>
        <DeveloperConsoleScreen onExit={() => navigateTo('/store')} />
      </Suspense>
    );
  }

  // 8. Student Console Full-Screen
  if (
    currentTab === 'STUDENT_CONSOLE' ||
    currentPath === '/student' ||
    currentPath === '/student/console'
  ) {
    if (!isAuthenticated) {
      return (
        <Suspense fallback={<ScreenFallback />}>
          <StoreLoginPage
            onBackToStore={() => navigateTo('/store')}
            onNavigateToSignUp={() => navigateTo('/signup')}
            onSuccess={() => navigateTo('/student')}
          />
        </Suspense>
      );
    }

    const isStudentUser = user?.role === 'STUDENT' || user?.realRole === 'STUDENT' || user?.studentStatus === 'VERIFIED' || user?.role === 'ADMIN' || user?.realRole === 'ADMIN';

    if (!isStudentUser) {
      if (user?.studentStatus === 'PENDING_REVIEW' || user?.studentDetails?.status === 'PENDING_REVIEW') {
        return (
          <Suspense fallback={<ScreenFallback />}>
            <StudentApplyScreen onBack={() => navigateTo('/store')} />
          </Suspense>
        );
      }
    }

    return (
      <Suspense fallback={<ScreenFallback />}>
        <StudentConsoleScreen onExit={() => navigateTo('/store')} />
      </Suspense>
    );
  }

  // 9. Admin Console Full-Screen
  if (
    currentTab === 'ADMIN_CONSOLE' ||
    currentPath === '/admin' ||
    currentPath === '/admin-console'
  ) {
    if (!isAuthenticated) {
      return (
        <Suspense fallback={<ScreenFallback />}>
          <StoreLoginPage
            onBackToStore={() => navigateTo('/store')}
            onNavigateToSignUp={() => navigateTo('/signup')}
            onSuccess={() => navigateTo('/admin')}
          />
        </Suspense>
      );
    }

    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-[#07060A] text-[#FAFAFA] flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md p-8 rounded-3xl bg-[#121118] border border-rose-500/30 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">Administrator Clearance Required</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The AVANYX Root Admin Console is strictly restricted to verified system administrators. Your current account role is <strong className="text-amber-400 font-bold">{user?.role || 'USER'}</strong>.
            </p>
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => navigateTo('/store')}
                className="w-full py-3 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-black text-xs shadow-lg shadow-[#6750A4]/25 transition-all"
              >
                Return to AVANYX Store
              </button>
              <button
                onClick={() => navigateTo('/login')}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-all"
              >
                Sign In with Admin Credentials
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={<ScreenFallback />}>
        <AdminConsoleScreen onExit={() => navigateTo('/store')} />
      </Suspense>
    );
  }

  // 10. Store Viewport Main Layout (/store & sub-tabs)
  const renderScreen = () => {
    switch (currentTab) {
      case 'HOME':
        return <HomeScreen />;
      case 'GAMES':
        return <GamesScreen />;
      case 'APPS':
        return <AppsScreen />;
      case 'DOWNLOADS':
        return <DownloadsScreen />;
      case 'SECURITY_ALERTS':
        return <SecurityAlertsScreen />;
      case 'DEVELOPER_APPLY':
        return <DeveloperApplyScreen onBack={() => navigateTo('/store')} />;
      case 'STUDENT_APPLY':
        return <StudentApplyScreen onBack={() => navigateTo('/store')} />;
      case 'DEVELOPER_PROFILE':
        return <DeveloperProfileScreen />;
      case 'PROFILE':
      case 'ACCOUNT':
        return <ProfileScreen />;
      case 'PURCHASE_HISTORY':
        return <PurchaseHistoryScreen />;
      case 'REWARDS_CENTER':
        return <RewardsCenterScreen />;
      case 'GMAIL':
        if (!isAdmin) {
          return (
            <div className="p-8 text-center bg-white dark:bg-[#18191D] rounded-3xl border border-rose-500/20">
              <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-black text-[#1D1B20] dark:text-white">Admin Clearance Required</h3>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-1 max-w-sm mx-auto">
                Gmail Workspace Hub is restricted to verified administrators.
              </p>
            </div>
          );
        }
        return <GmailScreen />;
      case 'SETTINGS':
        return <SettingsScreen />;
      case 'ACCOUNT_SETTINGS':
        return <AccountSettingsScreen />;
      case 'NOTIFICATIONS':
        return <NotificationsScreen />;
      case 'APP_DETAILS':
        return <AppDetailsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8F9FA] dark:bg-[#121316] text-[#1D1B20] dark:text-[#E6E1E5] flex flex-row transition-colors">
      {/* Left Sidebar: dynamic width, in-flow */}
      <Sidebar />

      {/* Right Main Layout Column: Header + scrollable Main Content */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[#F8F9FA] dark:bg-[#121316]">
        <Header />

        <main className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Suspense fallback={<ScreenFallback />}>
              {renderScreen()}
            </Suspense>
          </div>
        </main>

        {/* Global Native Download Manager Tray (PART A) */}
        <NativeDownloadTray />
      </div>
    </div>
  );
};

export function App() {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <AutoSEOEngine />
      <AppContent />
    </Suspense>
  );
}

export default App;
