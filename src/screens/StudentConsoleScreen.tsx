import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  School,
  Calendar,
  Mail,
  ShieldCheck,
  Package,
  ArrowRight,
  Terminal,
  LogOut,
  Hash,
  Layers,
  Sparkle,
  ShoppingBag,
  Flame,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { StudentOverview, StudentConsoleTabType } from '../components/student/StudentOverview';
import { StudentProjectsList } from '../components/student/StudentProjectsList';
import { StudentInAppProductsTab } from '../components/student/StudentInAppProductsTab';
import { StudentPromotionCenter } from '../components/student/StudentPromotionCenter';
import { StudentBillingCenter } from '../components/student/StudentBillingCenter';
import { StudentAnalyticsTab } from '../components/student/StudentAnalyticsTab';
import { StudentPackResources } from '../components/student/StudentPackResources';
import { StudentTelemetrySandbox } from '../components/student/StudentTelemetrySandbox';
import { StudentPermissionsMatrix } from '../components/student/StudentPermissionsMatrix';
import { StudentApplyScreen } from './StudentApplyScreen';
import { StudentStage2Modal } from '../components/student/StudentStage2Modal';
import { ApiCenterTab } from '../components/common/ApiCenterTab';
import { RewardsCenterScreen } from './RewardsCenterScreen';
import { PurchaseHistoryScreen } from './PurchaseHistoryScreen';
import {
  User as UserIcon,
  UploadCloud,
  Gift,
  Key,
  Receipt,
  Bell,
  Settings as SettingsIcon,
  TrendingUp,
  UserCheck,
  BadgeCheck
} from 'lucide-react';

interface StudentConsoleScreenProps {
  onExit?: () => void;
  applyMode?: boolean;
}

export const StudentConsoleScreen: React.FC<StudentConsoleScreenProps> = ({ onExit, applyMode = false }) => {
  const {
    user,
    isAuthenticated,
    apps,
    setCurrentTab,
    requestStudentVerification,
    reloadUserProfile
  } = useStore();

  const isVerifiedStudent =
    user?.role === 'STUDENT' ||
    user?.studentStatus === 'VERIFIED' ||
    user?.role === 'ADMIN' ||
    user?.realRole === 'ADMIN';

  const isStudentPending = user?.studentStatus === 'PENDING' || user?.studentStatus === 'PENDING_REVIEW';

  // Active module in sidebar
  const [activeTab, setActiveTab] = useState<StudentConsoleTabType>('OVERVIEW');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isStage2ModalOpen, setIsStage2ModalOpen] = useState(false);

  // Application form states if applying
  const [institutionName, setInstitutionName] = useState(user?.studentDetails?.institutionName || '');
  const [degreeProgram, setDegreeProgram] = useState(user?.studentDetails?.major || '');
  const [gradYear, setGradYear] = useState(user?.studentDetails?.graduationYear || new Date().getFullYear() + 2);
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [agreeAcademicCode, setAgreeAcademicCode] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter apps submitted by this student or educational apps
  const studentApps = apps.filter(
    (a) =>
      (a.developerUid && a.developerUid === user?.id) ||
      a.isStudentSpotlight ||
      (a.category === 'EDUCATION' && a.developer === user?.name)
  );

  const handleApplyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeAcademicCode) {
      setErrorMessage('Please confirm your enrollment in an accredited institution.');
      return;
    }
    if (!institutionName.trim()) {
      setErrorMessage('Please provide your university or college name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await requestStudentVerification({
        institutionName: institutionName.trim(),
        studentIdNumber: `STU_${Date.now().toString().slice(-6)}`,
        graduationYear: String(gradYear),
        notes: `Major / Degree: ${degreeProgram.trim() || 'Computer Science'}`
      });

      if (res && res.requestId) {
        setSubmitSuccess(true);
      } else {
        setErrorMessage('Failed to submit student verification request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting student verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = () => {
    if (onExit) {
      onExit();
    } else {
      setCurrentTab('HOME');
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        window.history.pushState({}, '', '/store');
      }
    }
  };

  const handleApplyDeveloper = () => {
    setCurrentTab('DEVELOPER_APPLY');
    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      window.history.pushState({}, '', '/developer/apply');
    }
  };

  // 1. If not authenticated, prompt sign in with full academic program overview
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[85vh] py-12 px-4 bg-[#F8F9FA] dark:bg-[#0B0F17] text-[#1D1B20] dark:text-white flex items-center justify-center">
        <div className="max-w-2xl w-full p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/20 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#6750A4]/10 dark:bg-cyan-500/15 text-[#6750A4] dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-[#6750A4]/10 dark:shadow-cyan-500/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-[11px] font-black uppercase">
                <School className="w-3.5 h-3.5" />
                <span>Academic Distribution Portal</span>
              </div>
              <h2 className="text-2xl font-black text-[#1D1B20] dark:text-white">AVANYX Student Console</h2>
              <p className="text-xs text-[#49454F] dark:text-slate-400 leading-relaxed">
                The official publishing hub for enrolled students (Class 10+ and University) to build developer portfolios, distribute educational tools, and share academic software with zero fees.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-[#1A2234] border border-black/5 dark:border-white/5 space-y-1">
              <div className="font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero Hosting Fees</span>
              </div>
              <p className="text-[11px] text-[#49454F] dark:text-slate-400 leading-relaxed">
                Free APK distribution for up to 10 active academic releases per student account.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-[#1A2234] border border-black/5 dark:border-white/5 space-y-1">
              <div className="font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Verified Badge</span>
              </div>
              <p className="text-[11px] text-[#49454F] dark:text-slate-400 leading-relaxed">
                Showcase an authenticated campus badge on your public software listings and developer profile.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-[#1A2234] border border-black/5 dark:border-white/5 space-y-1">
              <div className="font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>AutoSEO Engine</span>
              </div>
              <p className="text-[11px] text-[#49454F] dark:text-slate-400 leading-relaxed">
                Automatic generation of Schema.org structured data, metadata tags, and search indexation.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => {
                setCurrentTab('LOGIN');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/login');
                }
              }}
              className="w-full sm:flex-1 py-3.5 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white font-black text-xs transition-all shadow-md shadow-[#6750A4]/25 flex items-center justify-center gap-2"
            >
              <span>Sign In with AVANYX Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setCurrentTab('STUDENT_APPLY');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/student/apply');
                }
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-[#1D1B20] dark:text-white transition-all flex items-center justify-center gap-1.5"
            >
              <span>Apply for Student Verification</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If authenticated but NOT verified student, show full Class 10+ Student Application Screen
  if (!isVerifiedStudent || applyMode) {
    return <StudentApplyScreen onBack={handleReturn} />;
  }

  // Helper to check active tab
  const isStudentTabActive = (tab: StudentConsoleTabType) => {
    if (activeTab === tab) return true;
    if (tab === 'DASHBOARD' && activeTab === 'OVERVIEW') return true;
    if (tab === 'OVERVIEW' && activeTab === 'DASHBOARD') return true;
    if (tab === 'MY_APPS' && activeTab === 'PROJECTS') return true;
    if (tab === 'PROMOTION_CENTER' && activeTab === 'PROMOTIONS') return true;
    if (tab === 'BILLING_CENTER' && (activeTab === 'BILLING' || activeTab === 'PRODUCTS')) return true;
    return false;
  };

  const navItemClass = (tab: StudentConsoleTabType) => {
    const active = isStudentTabActive(tab);
    return `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
      active
        ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
        : 'text-zinc-400 hover:text-white hover:bg-white/5'
    }`;
  };

  // 3. Authenticated Verified Student Console with Sidebar layout
  return (
    <div className="w-full space-y-6 text-zinc-100 font-sans min-h-screen pb-16">
      <div className="w-full space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#14151C] border border-white/10 shadow-lg">
          <button
            onClick={handleReturn}
            className="self-start px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-[#9333EA]/20 to-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/30 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#EC4899]" />
              <span>Student Developer Suite</span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Stage 1: Academic Verified</span>
            </span>
            {user?.studentStage2Verified && (
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/40 flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-[#EC4899]" />
                <span>Stage 2: Commercial Verified</span>
              </span>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (Scrollable horizontally) */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isStudentTabActive('OVERVIEW')
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('STUDENT_PROFILE')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'STUDENT_PROFILE'
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            Student Profile
          </button>
          <button
            onClick={() => setActiveTab('MY_APPS')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isStudentTabActive('MY_APPS')
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            My Apps ({studentApps.length})
          </button>
          <button
            onClick={() => setActiveTab('APK_DISTRIBUTION')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'APK_DISTRIBUTION'
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            APK Distribution
          </button>
          <button
            onClick={() => setActiveTab('PROMOTIONS')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isStudentTabActive('PROMOTIONS')
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            Promotion Center
          </button>
          <button
            onClick={() => setActiveTab('BILLING')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isStudentTabActive('BILLING')
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            Billing Center
          </button>
          <button
            onClick={() => setActiveTab('REWARDS_CENTER')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'REWARDS_CENTER'
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            Rewards Center
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('API_CENTER')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'API_CENTER'
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            API Center
          </button>
          <button
            onClick={() => setActiveTab('PURCHASE_HISTORY')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PURCHASE_HISTORY'
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            Purchase History
          </button>
          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'NOTIFICATIONS'
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SETTINGS'
                ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-black'
                : 'bg-[#14151C] text-zinc-400 border border-white/10'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Layout: Desktop Independent Sidebar + Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Desktop Sidebar (PART A: Student Console Sidebar) */}
          <aside className="hidden lg:block w-64 shrink-0 rounded-3xl bg-[#14151C] border border-white/10 p-5 space-y-6 sticky top-6 shadow-2xl">
            {/* Student User Snapshot */}
            <div className="flex items-center gap-3 pb-5 border-b border-white/10">
              <img
                src={
                  user.avatarUrl ||
                  `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user.name || 'student')}`
                }
                alt={user.name}
                className="w-11 h-11 rounded-2xl object-cover border border-[#EC4899]/30 bg-[#0E0F15]"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="font-bold text-white text-xs truncate">{user.name || 'Student'}</div>
                <div className="text-[10px] text-[#F472B6] font-semibold truncate">
                  {user.studentDetails?.institutionName || 'Verified Scholar'}
                </div>
              </div>
            </div>

            {/* Navigation Menu (Exact 13 items) */}
            <nav className="space-y-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={navItemClass('OVERVIEW')}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>Dashboard</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('STUDENT_PROFILE')}
                className={navItemClass('STUDENT_PROFILE')}
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>Student Profile</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                  VERIFIED
                </span>
              </button>

              <button
                onClick={() => setActiveTab('MY_APPS')}
                className={navItemClass('MY_APPS')}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 shrink-0" />
                  <span>My Apps</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-zinc-300">
                  {studentApps.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('PROJECTS')}
                className={navItemClass('PROJECTS')}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Projects</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('APK_DISTRIBUTION')}
                className={navItemClass('APK_DISTRIBUTION')}
              >
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span>APK Distribution</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-extrabold">
                  SANDBOX
                </span>
              </button>

              <button
                onClick={() => setActiveTab('PROMOTION_CENTER')}
                className={navItemClass('PROMOTION_CENTER')}
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Promotion Center</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                  BOOST
                </span>
              </button>

              <button
                onClick={() => setActiveTab('BILLING_CENTER')}
                className={navItemClass('BILLING_CENTER')}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Billing Center</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                  STAGE 2
                </span>
              </button>

              <button
                onClick={() => setActiveTab('REWARDS_CENTER')}
                className={navItemClass('REWARDS_CENTER')}
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 shrink-0 text-[#EC4899]" />
                  <span>Rewards Center</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EC4899]/20 text-[#F472B6] font-extrabold">
                  PERKS
                </span>
              </button>

              <button
                onClick={() => setActiveTab('ANALYTICS')}
                className={navItemClass('ANALYTICS')}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>Analytics</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('API_CENTER')}
                className={navItemClass('API_CENTER')}
              >
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 shrink-0 text-[#C084FC]" />
                  <span>API Center</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#9333EA]/30 text-[#C084FC] font-extrabold">
                  SDK
                </span>
              </button>

              <button
                onClick={() => setActiveTab('PURCHASE_HISTORY')}
                className={navItemClass('PURCHASE_HISTORY')}
              >
                <div className="flex items-center gap-3">
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>Purchase History</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('NOTIFICATIONS')}
                className={navItemClass('NOTIFICATIONS')}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>Notifications</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={navItemClass('SETTINGS')}
              >
                <div className="flex items-center gap-3">
                  <SettingsIcon className="w-4 h-4 shrink-0" />
                  <span>Settings</span>
                </div>
              </button>
            </nav>

            {/* Quick Submit APK action */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('PROJECTS');
                  setIsSubmitModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:from-[#A855F7] hover:to-[#F472B6] text-white font-extrabold text-xs transition-all shadow-lg shadow-[#9333EA]/25 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Submit Project APK</span>
              </button>
            </div>
          </aside>

          {/* Right Main Workspace */}
          <main className="flex-1 w-full min-w-0">
            {(activeTab === 'OVERVIEW' || activeTab === 'DASHBOARD') && (
              <StudentOverview
                user={user}
                studentApps={studentApps}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenSubmitModal={() => {
                  setActiveTab('PROJECTS');
                  setIsSubmitModalOpen(true);
                }}
              />
            )}

            {/* Student Profile with Stage 1 & Stage 2 Verification */}
            {activeTab === 'STUDENT_PROFILE' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#14151C] border border-white/10 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          user.avatarUrl ||
                          `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user.name || 'student')}`
                        }
                        alt={user.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-[#EC4899]/30 bg-[#0E0F15]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h2 className="text-xl font-black text-white">{user.name || 'Verified Scholar'}</h2>
                        <p className="text-xs text-[#F472B6] font-bold">{user.email}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{user.studentDetails?.institutionName || 'Accredited Educational Institution'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Stage 1 Academic Verified</span>
                      </span>
                    </div>
                  </div>

                  {/* Academic Credentials Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Institution</div>
                      <div className="text-sm font-bold text-white truncate">{user.studentDetails?.institutionName || 'Not specified'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Major / Field</div>
                      <div className="text-sm font-bold text-white truncate">{user.studentDetails?.major || 'Computer Science / Engineering'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Graduation Target</div>
                      <div className="text-sm font-bold text-white">{user.studentDetails?.graduationYear || '2026'}</div>
                    </div>
                  </div>

                  {/* PART F: Student Commercial Verification Level (Stage 2) */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C142B] to-[#12131C] border border-[#EC4899]/30 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">Stage 2 — Guardian / Teacher Verification</h3>
                          {user?.studentStage2Verified ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/30">
                              COMMERCIAL UNLOCK
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                          Required for students to monetize with In-App Products, publish Subscriptions, access Billing Analytics, and track revenue. Requires Guardian or Class Teacher authorization with photo proof.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                        <div className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Stage 1 (Active)</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">Publish educational apps, basic telemetry, promotion center, community rewards.</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                        <div className="font-extrabold text-[#F472B6] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Stage 2 (Commercial)</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">Unlock in-app products, subscription billing, billing analytics, and payout tracking.</p>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      {user?.studentStage2Verified ? (
                        <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold text-xs flex items-center gap-2 border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Stage 2 Verified — Commercial Privileges Active</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsStage2ModalOpen(true)}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:from-[#A855F7] hover:to-[#F472B6] text-white font-extrabold text-xs shadow-lg shadow-[#9333EA]/30 transition active:scale-95 flex items-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Apply for Stage 2 Guardian/Teacher Verification</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'PROJECTS' || activeTab === 'MY_APPS') && (
              <StudentProjectsList
                user={user}
                studentApps={studentApps}
                onRefresh={async () => {
                  await reloadUserProfile();
                }}
                isModalOpen={isSubmitModalOpen}
                onCloseModal={() => setIsSubmitModalOpen(false)}
                onOpenModal={() => setIsSubmitModalOpen(true)}
              />
            )}

            {(activeTab === 'APK_DISTRIBUTION' || activeTab === 'SANDBOX') && (
              <StudentTelemetrySandbox user={user} studentApps={studentApps} />
            )}

            {activeTab === 'PRODUCTS' && (
              <StudentInAppProductsTab studentApps={studentApps} />
            )}

            {(activeTab === 'PROMOTIONS' || activeTab === 'PROMOTION_CENTER') && (
              <StudentPromotionCenter studentApps={studentApps} />
            )}

            {(activeTab === 'BILLING' || activeTab === 'BILLING_CENTER') && (
              <StudentBillingCenter studentApps={studentApps} />
            )}

            {activeTab === 'REWARDS_CENTER' && (
              <div className="p-4 rounded-3xl bg-[#14151C] border border-white/10 shadow-xl">
                <RewardsCenterScreen />
              </div>
            )}

            {activeTab === 'ANALYTICS' && (
              <StudentAnalyticsTab studentApps={studentApps} />
            )}

            {activeTab === 'API_CENTER' && (
              <ApiCenterTab
                creatorUid={user.id}
                creatorName={user.name || 'Student'}
                creatorType="STUDENT"
              />
            )}

            {activeTab === 'PURCHASE_HISTORY' && (
              <div className="p-4 rounded-3xl bg-[#14151C] border border-white/10 shadow-xl">
                <PurchaseHistoryScreen />
              </div>
            )}

            {activeTab === 'NOTIFICATIONS' && (
              <div className="p-6 rounded-3xl bg-[#14151C] border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#EC4899]" />
                    <span>Academic & Publishing Notifications</span>
                  </h3>
                  <span className="text-xs text-zinc-400">All alerts up to date</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-300">
                  You are verified under AVANYX Student Scholar Program. Submit your project APKs through the distribution center or unlock Stage 2 commercial verification to start offering in-app products.
                </div>
              </div>
            )}

            {activeTab === 'SETTINGS' && (
              <div className="p-6 rounded-3xl bg-[#14151C] border border-white/10 space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-[#9333EA]" />
                  <span>Student Console Preferences</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-bold text-white">Default Submission Track</div>
                    <p className="text-[11px] text-zinc-400">Academic Education Category & Student Spotlight</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-bold text-white">SDK Telemetry</div>
                    <p className="text-[11px] text-zinc-400">Enabled for educational analytics and performance tracking</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'RESOURCES' && <StudentPackResources />}

            {activeTab === 'PERMISSIONS' && (
              <StudentPermissionsMatrix onApplyDeveloper={handleApplyDeveloper} />
            )}
          </main>
        </div>
      </div>

      {/* Stage 2 Commercial Verification Modal */}
      <StudentStage2Modal
        isOpen={isStage2ModalOpen}
        onClose={() => setIsStage2ModalOpen(false)}
        studentUid={user.id}
        studentName={user.name || 'Student'}
        studentEmail={user.email || ''}
        onSuccess={() => {
          setIsStage2ModalOpen(false);
          reloadUserProfile();
        }}
      />
    </div>
  );
};
