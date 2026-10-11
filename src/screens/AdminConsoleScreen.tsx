import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Terminal,
  GraduationCap,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  History,
  AlertTriangle,
  FileText,
  HelpCircle,
  Bell,
  Eye,
  Globe,
  Github,
  Mail,
  UserCheck,
  Building,
  School,
  Calendar,
  Layers,
  Package,
  Check,
  X,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  LayoutDashboard,
  Activity,
  FolderPlus,
  CreditCard,
  ArrowLeft,
  ChevronRight,
  Key,
  FileCheck2,
  TrendingUp,
  Download
} from 'lucide-react';
import { AdminPromotionManager } from '../components/admin/AdminPromotionManager';
import { AdminDashboardOverview } from '../components/admin/AdminDashboardOverview';
import { AdminCategoryManager } from '../components/admin/AdminCategoryManager';
import { AdminSystemHealth } from '../components/admin/AdminSystemHealth';
import { AdminPaymentConsole } from '../components/admin/AdminPaymentConsole';
import { AdminPaymentReview } from '../components/admin/AdminPaymentReview';
import { AdminPaymentAnalytics } from '../components/admin/AdminPaymentAnalytics';
import {
  fetchVerificationRequests,
  subscribeToVerificationRequests,
  reviewVerificationRequest,
  fetchAllUsers,
  adminUpdateUserRoleAndBadge,
  fetchAuditLogs,
  subscribeToAdminNotifications,
  isPrimaryAdminEmail,
  fetchAllApps,
  adminReviewApp,
  fetchAllDevelopers,
  adminModerateDeveloper,
  subscribeToCategories,
  fetchCategories,
  subscribeToPayments
} from '../services/firestoreService';
import {
  VerificationRequest,
  User,
  AuditLog,
  UserRole,
  VerificationBadge,
  VerificationStatus,
  StoreApp,
  DeveloperProfile,
  CategoryItem,
  PaymentRecord
} from '../types';

export interface AdminConsoleScreenProps {
  onExit?: () => void;
}

export const AdminConsoleScreen: React.FC<AdminConsoleScreenProps> = ({ onExit }) => {
  const { user, isAuthenticated, firebaseUser, setCurrentTab } = useStore();

  const [activeTab, setActiveTab] = useState<
    | 'OVERVIEW'
    | 'APPS'
    | 'VERIFICATIONS'
    | 'DEVELOPERS'
    | 'STUDENTS'
    | 'PAYMENT_CONSOLE'
    | 'PAYMENT_REVIEW'
    | 'PAYMENT_ANALYTICS'
    | 'PROMOTIONS'
    | 'CATEGORIES'
    | 'DOWNLOADS_ANALYTICS'
    | 'AUDIT'
    | 'SYSTEM_HEALTH'
    | 'NOTIFICATIONS'
    | 'SETTINGS'
    | 'USERS'
  >('OVERVIEW');
  const [verificationSubQueue, setVerificationSubQueue] = useState<'ALL' | 'DEVELOPER' | 'STUDENT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [appsList, setAppsList] = useState<StoreApp[]>([]);
  const [developersList, setDevelopersList] = useState<DeveloperProfile[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Review modal state
  const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_INFO' | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // App Moderation Modal
  const [selectedApp, setSelectedApp] = useState<StoreApp | null>(null);
  const [appActionType, setAppActionType] = useState<'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED' | 'DRAFT' | null>(null);
  const [appModerationNotes, setAppModerationNotes] = useState('');

  // Developer Moderation Modal
  const [selectedDev, setSelectedDev] = useState<DeveloperProfile | null>(null);
  const [devActionType, setDevActionType] = useState<'VERIFY' | 'SUSPEND' | 'RESTORE' | null>(null);
  const [devModerationNotes, setDevModerationNotes] = useState('');

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('USER');
  const [targetBadge, setTargetBadge] = useState<VerificationBadge>('NONE');

  const isAuthoritativeAdmin = isAuthenticated && (user.realRole === 'ADMIN' || user.role === 'ADMIN' || isPrimaryAdminEmail(user.email));

  // Live real-time subscriptions
  useEffect(() => {
    if (!isAuthoritativeAdmin) return;

    const unsubVerifs = subscribeToVerificationRequests(
      (updatedRequests) => {
        setRequests(updatedRequests);
      },
      (err) => {
        console.warn('Realtime verification queue notice:', err);
      }
    );

    const unsubNotifs = subscribeToAdminNotifications((notifs) => {
      setAdminNotifications(notifs);
    });

    const unsubCats = subscribeToCategories(
      (cats) => {
        setCategoriesList(cats || []);
      },
      (err) => {
        console.warn('Realtime categories notice:', err);
      }
    );

    const unsubPayments = subscribeToPayments((payments) => {
      setPaymentsList(payments || []);
    });

    return () => {
      unsubVerifs();
      unsubNotifs();
      unsubCats();
      unsubPayments();
    };
  }, [isAuthoritativeAdmin]);

  const loadData = async () => {
    if (!isAuthoritativeAdmin) return;
    setLoading(true);
    setActionError(null);
    try {
      if (activeTab === 'OVERVIEW') {
        const [reqs, users, logs, apps, devs, cats] = await Promise.all([
          fetchVerificationRequests(),
          fetchAllUsers(),
          fetchAuditLogs(),
          fetchAllApps(),
          fetchAllDevelopers(),
          fetchCategories()
        ]);
        setRequests(reqs);
        setUsersList(users);
        setAuditLogs(logs);
        setAppsList(apps);
        setDevelopersList(devs);
        setCategoriesList(cats);
      } else if (activeTab === 'VERIFICATIONS') {
        const reqs = await fetchVerificationRequests();
        setRequests(reqs);
      } else if (activeTab === 'APPS' || activeTab === 'PROMOTIONS') {
        const apps = await fetchAllApps();
        setAppsList(apps);
      } else if (activeTab === 'DEVELOPERS') {
        const devs = await fetchAllDevelopers();
        setDevelopersList(devs);
      } else if (activeTab === 'USERS') {
        const users = await fetchAllUsers();
        setUsersList(users);
      } else if (activeTab === 'CATEGORIES') {
        const [cats, apps] = await Promise.all([fetchCategories(), fetchAllApps()]);
        setCategoriesList(cats);
        setAppsList(apps);
      } else if (activeTab === 'AUDIT') {
        const logs = await fetchAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, isAuthoritativeAdmin]);

  // Compute live pending counts
  const pendingDevCount = requests.filter(
    (r) => r.type === 'DEVELOPER' && (r.status === 'PENDING_REVIEW' || r.status === 'PENDING')
  ).length;
  const pendingStuCount = requests.filter(
    (r) => r.type === 'STUDENT' && (r.status === 'PENDING_REVIEW' || r.status === 'PENDING')
  ).length;
  const pendingAppCount = appsList.filter((a) => a.status === 'PENDING_REVIEW').length;
  const pendingPaymentsCount = paymentsList.filter(
    (p) => p.status === 'PAYMENT_SUBMITTED' || p.status === 'PAYMENT_PENDING'
  ).length;
  const totalPendingCount = pendingDevCount + pendingStuCount;

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    if (verificationSubQueue === 'DEVELOPER' && req.type !== 'DEVELOPER') return false;
    if (verificationSubQueue === 'STUDENT' && req.type !== 'STUDENT') return false;

    if (filterStatus !== 'ALL') {
      if (filterStatus === 'PENDING_REVIEW') {
        if (req.status !== 'PENDING_REVIEW' && req.status !== 'PENDING') return false;
      } else if (req.status !== filterStatus) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (req.displayName || req.userName || '').toLowerCase().includes(q);
      const matchEmail = (req.applicantEmail || req.userEmail || '').toLowerCase().includes(q);
      const matchUid = (req.applicantUid || req.userId || '').toLowerCase().includes(q);
      const matchOrg = (req.developerDetails?.organizationName || req.studentDetails?.institutionName || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchUid && !matchOrg) return false;
    }

    return true;
  });

  const handleExecuteReviewAction = async () => {
    if (!selectedReq || !firebaseUser || !actionType) return;
    setIsProcessing(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      let statusToSet: 'APPROVED' | 'REJECTED' | 'REQUEST_INFO' = 'APPROVED';
      if (actionType === 'REJECT') statusToSet = 'REJECTED';
      if (actionType === 'REQUEST_INFO') statusToSet = 'REQUEST_INFO';

      await reviewVerificationRequest(
        selectedReq.id,
        statusToSet,
        firebaseUser.uid,
        reviewerNotes || (statusToSet === 'APPROVED' ? 'Application meets all store developer standards.' : '')
      );

      setActionSuccess(
        `Successfully updated ${selectedReq.displayName || selectedReq.applicantEmail} to ${statusToSet}`
      );
      setSelectedReq(null);
      setActionType(null);
      setReviewerNotes('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to review verification application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteAppModeration = async () => {
    if (!selectedApp || !firebaseUser || !appActionType) return;
    setIsProcessing(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      await adminReviewApp(
        firebaseUser.uid,
        firebaseUser.email || user.email || 'admin@avanyx.store',
        selectedApp.id,
        appActionType,
        appModerationNotes,
        selectedApp.status,
        selectedApp.developerUid
      );
      setActionSuccess(`Application "${selectedApp.name}" moderation updated to ${appActionType}`);
      setSelectedApp(null);
      setAppActionType(null);
      setAppModerationNotes('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to moderate application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteDeveloperModeration = async () => {
    if (!selectedDev || !firebaseUser || !devActionType) return;
    setIsProcessing(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      await adminModerateDeveloper(
        firebaseUser.uid,
        firebaseUser.email || user.email || 'admin@avanyx.store',
        selectedDev.id,
        devActionType,
        devModerationNotes
      );
      setActionSuccess(`Developer "${selectedDev.displayName}" set to ${devActionType}`);
      setSelectedDev(null);
      setDevActionType(null);
      setDevModerationNotes('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to moderate developer profile');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveUserPermissions = async () => {
    if (!editingUser || !firebaseUser) return;
    // Guard against demoting primary administrator
    if (isPrimaryAdminEmail(editingUser.email) && targetRole !== 'ADMIN') {
      setActionError('Security Policy: Primary Administrator accounts cannot be demoted or changed from ADMIN role.');
      return;
    }

    setIsProcessing(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      await adminUpdateUserRoleAndBadge(
        editingUser.id,
        {
          role: targetRole,
          verificationBadge: targetBadge,
          developerStatus: targetRole === 'DEVELOPER' || targetRole === 'VERIFIED_DEVELOPER' || targetRole === 'ADMIN' ? 'VERIFIED' : 'NONE',
          studentStatus: targetRole === 'STUDENT' || targetRole === 'VERIFIED_STUDENT' ? 'VERIFIED' : 'NONE'
        },
        firebaseUser.uid
      );
      setActionSuccess(`Updated permissions for ${editingUser.name || editingUser.email}`);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user permissions');
    } finally {
      setIsProcessing(false);
    }
  };

  // Guard: Unauthorized Access
  if (!isAuthoritativeAdmin) {
    return (
      <div id="admin-access-restricted" className="py-16 text-center space-y-6 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20 shadow-xl">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
            Admin Access Restricted
          </h1>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
            The Admin Console is protected by strict server-side and Firestore security rules. Only authenticated accounts with verified <code className="font-mono text-[#6750A4] dark:text-[#D0BCFF]">ADMIN</code> privileges may review applications or modify roles.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-[#49454F] dark:text-[#CAC4D0]">Account:</span>
            <span className="font-bold">{user.email || 'Unauthenticated'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#49454F] dark:text-[#CAC4D0]">Assigned Role:</span>
            <span className="font-bold">{user.role}</span>
          </div>
        </div>
        <button
          id="btn-return-profile"
          onClick={() => setCurrentTab('PROFILE')}
          className="px-6 py-3 rounded-2xl bg-[#6750A4] text-white text-xs font-bold hover:bg-[#523e85] transition-all shadow-md"
        >
          Return to Profile
        </button>
      </div>
    );
  }

  return (
    <div id="admin-console-container" className="min-h-screen pb-20 max-w-7xl mx-auto space-y-4">
      {/* Top Header Bar with Breadcrumbs and Back to Store */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => onExit ? onExit() : setCurrentTab('HOME')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#49454F] dark:text-[#CAC4D0] hover:text-black dark:hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500">Admin Console</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-rose-600 dark:text-rose-400 font-extrabold">{activeTab.replace('_', ' ')}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Root Admin Active</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
      {/* Desktop Left Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between p-4 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-6 self-start lg:sticky lg:top-4">
        <div className="space-y-4">
          {/* Console Branding */}
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black tracking-tight text-[#1D1B20] dark:text-white flex items-center gap-1.5">
                  AVANYX Admin
                </div>
                <div className="text-[10px] font-mono text-[#49454F] dark:text-[#CAC4D0]">Security Console</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Root Admin Active</span>
            </div>
          </div>

          {/* Navigation Items (PART A: Admin Console Sidebar) */}
          <nav className="space-y-1">
            <button
              id="admin-nav-overview"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'OVERVIEW'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              id="admin-nav-verifications"
              onClick={() => setActiveTab('VERIFICATIONS')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'VERIFICATIONS'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="w-4 h-4" />
                <span>Verification Queue</span>
              </div>
              {totalPendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                  {totalPendingCount}
                </span>
              )}
            </button>

            <button
              id="admin-nav-developers"
              onClick={() => setActiveTab('DEVELOPERS')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'DEVELOPERS'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4" />
                <span>Developer Management</span>
              </div>
            </button>

            <button
              id="admin-nav-students"
              onClick={() => setActiveTab('STUDENTS')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'STUDENTS'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4" />
                <span>Student Management</span>
              </div>
              {pendingStuCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white font-bold">
                  {pendingStuCount}
                </span>
              )}
            </button>

            <button
              id="admin-nav-payment-console"
              onClick={() => setActiveTab('PAYMENT_CONSOLE')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'PAYMENT_CONSOLE'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Payment Console</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold">
                9 TABS
              </span>
            </button>

            <button
              id="admin-nav-payment-review"
              onClick={() => setActiveTab('PAYMENT_REVIEW')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'PAYMENT_REVIEW'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4" />
                <span>Payment Review</span>
              </div>
              {pendingPaymentsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                  {pendingPaymentsCount}
                </span>
              )}
            </button>

            <button
              id="admin-nav-payment-analytics"
              onClick={() => setActiveTab('PAYMENT_ANALYTICS')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'PAYMENT_ANALYTICS'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Payment Analytics</span>
              </div>
            </button>

            <button
              id="admin-nav-promotions"
              onClick={() => setActiveTab('PROMOTIONS')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'PROMOTIONS'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Promotion Manager</span>
              </div>
            </button>

            <button
              id="admin-nav-categories"
              onClick={() => setActiveTab('CATEGORIES')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'CATEGORIES'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderPlus className="w-4 h-4" />
                <span>Category Manager</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {categoriesList.length}
              </span>
            </button>

            <button
              id="admin-nav-downloads"
              onClick={() => setActiveTab('DOWNLOADS_ANALYTICS')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'DOWNLOADS_ANALYTICS'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Downloads Analytics</span>
              </div>
            </button>

            <button
              id="admin-nav-audit"
              onClick={() => setActiveTab('AUDIT')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'AUDIT'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4" />
                <span>Audit Logs</span>
              </div>
            </button>

            <button
              id="admin-nav-health"
              onClick={() => setActiveTab('SYSTEM_HEALTH')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'SYSTEM_HEALTH'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>System Health</span>
              </div>
            </button>

            <button
              id="admin-nav-notifications"
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </div>
              {adminNotifications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white font-bold">
                  {adminNotifications.length}
                </span>
              )}
            </button>

            <button
              id="admin-nav-settings"
              onClick={() => setActiveTab('SETTINGS')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'SETTINGS'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white shadow-lg shadow-[#9333EA]/30 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Footer Profile & Exit */}
        <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-3">
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B]">
            <img
              src={user.avatarUrl || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt="Admin"
              className="w-8 h-8 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#1D1B20] dark:text-white truncate">
                {user.name || 'Root Administrator'}
              </div>
              <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] truncate">
                {user.email}
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('HOME')}
            className="w-full py-2 px-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#1D1B20] dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Exit to Store</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 space-y-6">
        {/* Workspace Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm">
          <div>
            <h1 className="text-xl font-black text-[#1D1B20] dark:text-white flex items-center gap-2.5">
              {activeTab === 'OVERVIEW' && 'Dashboard Overview'}
              {activeTab === 'APPS' && 'App Moderation & Catalog Review'}
              {activeTab === 'VERIFICATIONS' && 'Identity & Credential Verification Queue'}
              {activeTab === 'PAYMENT_REVIEW' && 'Admin Payment Review Queue'}
              {activeTab === 'PAYMENT_CONSOLE' && 'Payment Console & Dynamic UPI QR Manager'}
              {activeTab === 'PAYMENT_ANALYTICS' && 'Revenue & Payment Analytics Dashboard'}
              {activeTab === 'DEVELOPERS' && 'Registered Developer Directory & Compliance'}
              {activeTab === 'USERS' && 'User Directory & Multi-Role Governance'}
              {activeTab === 'PROMOTIONS' && 'Store Promotions & Featured Banners'}
              {activeTab === 'CATEGORIES' && 'Store Category Taxonomy Manager'}
              {activeTab === 'SYSTEM_HEALTH' && 'Enterprise System Diagnostics & Live Telemetry'}
              {activeTab === 'AUDIT' && 'Authoritative Audit Trail'}
              {activeTab === 'NOTIFICATIONS' && 'System Alerts & Admin Notifications'}
            </h1>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Real-time Firestore stream active • Strictly enforced role-based permissions
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-admin-sync-data"
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] transition-all text-[#1D1B20] dark:text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Action Alerts */}
        {actionSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* TAB: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <AdminDashboardOverview
            appsList={appsList}
            usersList={usersList}
            requests={requests}
            categoriesList={categoriesList}
            auditLogs={auditLogs}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onSync={loadData}
            loading={loading}
          />
        )}

        {/* TAB: CATEGORIES */}
        {activeTab === 'CATEGORIES' && (
          <AdminCategoryManager
            categories={categoriesList}
            appsList={appsList}
            onRefresh={loadData}
          />
        )}

        {/* TAB: SYSTEM HEALTH */}
        {activeTab === 'SYSTEM_HEALTH' && (
          <AdminSystemHealth
            appsCount={appsList.length}
            usersCount={usersList.length}
            requestsCount={requests.length}
            categoriesCount={categoriesList.length}
            auditLogsCount={auditLogs.length}
          />
        )}

        {/* TAB: PROMOTIONS */}
        {activeTab === 'PROMOTIONS' && (
          <AdminPromotionManager appsList={appsList} onRefreshApps={loadData} />
        )}

        {/* TAB: PAYMENT REVIEW */}
        {activeTab === 'PAYMENT_REVIEW' && (
          <AdminPaymentReview
            adminUid={firebaseUser?.uid || user.id}
            adminEmail={firebaseUser?.email || user.email || 'admin@avanyx.store'}
          />
        )}

        {/* TAB: PAYMENT CONSOLE */}
        {activeTab === 'PAYMENT_CONSOLE' && (
          <AdminPaymentConsole adminUid={firebaseUser?.uid || user.id} />
        )}

        {/* TAB: PAYMENT ANALYTICS */}
        {activeTab === 'PAYMENT_ANALYTICS' && (
          <AdminPaymentAnalytics />
        )}

      {/* TAB 1: VERIFICATIONS QUEUE */}
      {activeTab === 'VERIFICATIONS' && (
        <div className="space-y-4">
          {/* Sub-Queue Tabs & Status Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
            {/* Separate Review Queues */}
            <div className="flex items-center gap-1.5 bg-[#F3EDF7] dark:bg-[#25262B] p-1 rounded-2xl">
              <button
                id="queue-tab-all"
                onClick={() => setVerificationSubQueue('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  verificationSubQueue === 'ALL'
                    ? 'bg-[#6750A4] text-white shadow-sm'
                    : 'text-[#49454F] dark:text-[#CAC4D0]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> All ({requests.length})
              </button>
              <button
                id="queue-tab-developer"
                onClick={() => setVerificationSubQueue('DEVELOPER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  verificationSubQueue === 'DEVELOPER'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[#49454F] dark:text-[#CAC4D0]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Developer Applications
                {pendingDevCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-emerald-700 font-black">
                    {pendingDevCount}
                  </span>
                )}
              </button>
              <button
                id="queue-tab-student"
                onClick={() => setVerificationSubQueue('STUDENT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  verificationSubQueue === 'STUDENT'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#49454F] dark:text-[#CAC4D0]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Student Verifications
                {pendingStuCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-blue-700 font-black">
                    {pendingStuCount}
                  </span>
                )}
              </button>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Pending Review', value: 'PENDING_REVIEW' },
                { label: 'Info Requested', value: 'REQUEST_INFO' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' }
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setFilterStatus(s.value)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    filterStatus === s.value
                      ? 'bg-[#6750A4] text-white'
                      : 'bg-[#F3EDF7] dark:bg-[#25262B] text-[#49454F] dark:text-[#CAC4D0]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center gap-3">
            <Search className="w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications by applicant name, email, UID, organization, or institution..."
              className="bg-transparent text-xs w-full text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#49454F] dark:text-[#CAC4D0] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Submissions List */}
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden divide-y divide-black/5 dark:divide-white/5 shadow-sm">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => {
                // Compute fields for PART D
                const logoOrAvatar =
                  (req.type === 'DEVELOPER'
                    ? (req.developerDetails as any)?.logoUrl || (req.developerDetails as any)?.avatarUrl
                    : (req.studentDetails as any)?.schoolLogoUrl || (req.studentDetails as any)?.idCardImageUrl) ||
                  (req as any).avatarUrl ||
                  (req as any).applicantAvatar;

                const fullName =
                  (req.type === 'DEVELOPER'
                    ? (req.developerDetails as any)?.fullName || (req.developerDetails as any)?.developerName
                    : (req.studentDetails as any)?.fullName || (req.studentDetails as any)?.studentName) ||
                  req.displayName ||
                  req.userName ||
                  (req as any).name ||
                  'Applicant';

                const studioOrSchool =
                  (req.type === 'DEVELOPER'
                    ? (req.developerDetails as any)?.studioName ||
                      (req.developerDetails as any)?.organizationName ||
                      (req.developerDetails as any)?.developerName ||
                      'Independent Developer Studio'
                    : (req.studentDetails as any)?.institutionName ||
                      (req.studentDetails as any)?.schoolName ||
                      'Educational Institution');

                const appEmail = req.applicantEmail || req.userEmail || (req as any).email || 'No email provided';
                const appToken = (req as any).applicationToken || req.caseId || (req as any).token || req.id;
                const submittedTimeStr = req.submittedAt ? new Date(req.submittedAt).toLocaleString() : 'N/A';

                const countryState =
                  req.type === 'DEVELOPER'
                    ? [req.developerDetails?.state, req.developerDetails?.country].filter(Boolean).join(', ') ||
                      req.developerDetails?.country ||
                      'India'
                    : [(req.studentDetails as any)?.state, req.studentDetails?.country].filter(Boolean).join(', ') ||
                      req.studentDetails?.country ||
                      'India';

                return (
                  <div
                    key={req.id}
                    id={`verification-row-${req.id}`}
                    className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Avatar / Logo */}
                      <div className="shrink-0 pt-0.5">
                        {logoOrAvatar ? (
                          <img
                            src={logoOrAvatar}
                            alt={fullName}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/20 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                              req.type === 'DEVELOPER'
                                ? 'bg-[#9333EA]/20 text-[#C084FC] border border-[#9333EA]/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {req.type === 'DEVELOPER' ? (
                              <Terminal className="w-6 h-6" />
                            ) : (
                              <GraduationCap className="w-6 h-6" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Info Body */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Top line badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
                              req.type === 'DEVELOPER'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {req.type === 'DEVELOPER' ? (
                              <Terminal className="w-3.5 h-3.5" />
                            ) : (
                              <GraduationCap className="w-3.5 h-3.5" />
                            )}
                            {req.type === 'DEVELOPER' ? 'Developer Application' : 'Student Verification'}
                          </span>

                          <h3 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5] truncate">
                            {fullName}
                          </h3>

                          {/* Status Tag */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : req.status === 'REQUEST_INFO'
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {req.status === 'PENDING_REVIEW' || req.status === 'PENDING'
                              ? 'Pending Review'
                              : req.status}
                          </span>
                        </div>

                        {/* Studio or School Name */}
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-300">
                          {req.type === 'DEVELOPER' ? (
                            <Building className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <School className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate">{studioOrSchool}</span>
                        </div>

                        {/* Metadata Grid (Email, Token, Submitted, Country/State) */}
                        <div className="text-xs text-[#49454F] dark:text-[#CAC4D0] space-y-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#6750A4]" />
                              <strong className="text-[#1D1B20] dark:text-[#E6E1E5]">
                                {appEmail}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">
                              <Key className="w-3 h-3 text-indigo-500" />
                              <span>Token: {appToken}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Submitted: {submittedTimeStr}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium">
                              <Globe className="w-3 h-3 text-emerald-500" />
                              <span>{countryState}</span>
                            </span>
                          </div>

                          {/* Specific Details Preview */}
                          {req.type === 'DEVELOPER' && req.developerDetails && (
                            <div className="flex items-center gap-3 flex-wrap pt-0.5 text-[11px]">
                              {req.developerDetails.websiteUrl && (
                                <a
                                  href={req.developerDetails.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#6750A4] dark:text-[#D0BCFF] underline flex items-center gap-0.5"
                                >
                                  <Globe className="w-3 h-3" /> Website
                                </a>
                              )}
                              {req.developerDetails.githubUrl && (
                                <a
                                  href={req.developerDetails.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#6750A4] dark:text-[#D0BCFF] underline flex items-center gap-0.5"
                                >
                                  <Github className="w-3 h-3" /> GitHub
                                </a>
                              )}
                            </div>
                          )}

                          {req.type === 'STUDENT' && req.studentDetails && (
                            <div className="flex items-center gap-3 flex-wrap pt-0.5 text-[11px]">
                              {req.studentDetails.studentIdNumber && (
                                <span>ID: <strong>{req.studentDetails.studentIdNumber}</strong></span>
                              )}
                              {req.studentDetails.graduationYear && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Grad: {req.studentDetails.graduationYear}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Reviewer Note preview if reviewed */}
                          {req.reviewerNotes && (
                            <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] italic">
                              Reviewer Note: "{req.reviewerNotes}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap shrink-0">
                      {/* View Details Button */}
                      <button
                        id={`btn-view-details-${req.id}`}
                        onClick={() => {
                          setSelectedReq(req);
                          setActionType(null);
                          setReviewerNotes(req.reviewerNotes || '');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Verification Details</span>
                      </button>

                      {/* Quick Action Buttons for Pending */}
                      {(req.status === 'PENDING_REVIEW' || req.status === 'PENDING' || req.status === 'REQUEST_INFO') && (
                        <>
                          <button
                            id={`btn-quick-approve-${req.id}`}
                            onClick={() => {
                              setSelectedReq(req);
                              setActionType('APPROVE');
                              setReviewerNotes('Approved by store administration.');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            id={`btn-quick-request-info-${req.id}`}
                            onClick={() => {
                              setSelectedReq(req);
                              setActionType('REQUEST_INFO');
                              setReviewerNotes('');
                            }}
                            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                            title="Request Additional Information"
                          >
                            <HelpCircle className="w-3.5 h-3.5" /> Request Info
                          </button>
                          <button
                            id={`btn-quick-reject-${req.id}`}
                            onClick={() => {
                              setSelectedReq(req);
                              setActionType('REJECT');
                              setReviewerNotes('');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-xs text-[#49454F] dark:text-[#CAC4D0]">
                No verification submissions found matching current queue and status filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: APPS MODERATION */}
      {activeTab === 'APPS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center gap-3">
            <Search className="w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps by name, package name, developer..."
              className="bg-transparent text-xs w-full text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none"
            />
          </div>

          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden divide-y divide-black/5 dark:divide-white/5 shadow-sm">
            {appsList
              .filter(
                (a) =>
                  a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  a.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  a.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  a.id.includes(searchQuery)
              )
              .map((app) => (
                <div
                  key={app.id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/5"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                          {app.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            app.status === 'PUBLISHED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : app.status === 'APPROVED'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : app.status === 'PENDING_REVIEW'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : app.status === 'REJECTED' || app.status === 'SUSPENDED'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-black/5 dark:bg-white/5 text-[#49454F] dark:text-[#CAC4D0]'
                          }`}
                        >
                          {app.status}
                        </span>
                        <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-mono">
                          v{app.version}
                        </span>
                      </div>
                      <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                        <code className="font-mono text-[11px]">{app.packageName}</code> • Dev: <strong className="text-[#1D1B20] dark:text-[#E6E1E5]">{app.developer}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setAppActionType('APPROVED');
                        setAppModerationNotes('Meets all application standards.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setAppActionType('PUBLISHED');
                        setAppModerationNotes('Published to store catalog.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setAppActionType('REJECTED');
                        setAppModerationNotes('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setAppActionType(app.status === 'SUSPENDED' ? 'PUBLISHED' : 'SUSPENDED');
                        setAppModerationNotes('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all shadow-sm"
                    >
                      {app.status === 'SUSPENDED' ? 'Restore' : 'Suspend'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB: DEVELOPERS DIRECTORY */}
      {activeTab === 'DEVELOPERS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center gap-3">
            <Search className="w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search developers by name, organization, UID..."
              className="bg-transparent text-xs w-full text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none"
            />
          </div>

          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden divide-y divide-black/5 dark:divide-white/5 shadow-sm">
            {developersList
              .filter(
                (d) =>
                  d.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (d.organizationName && d.organizationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  d.id.includes(searchQuery) ||
                  (d.developerUid && d.developerUid.includes(searchQuery))
              )
              .map((dev) => (
                <div
                  key={dev.id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={dev.logoUrl || dev.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                      alt={dev.displayName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                          {dev.displayName}
                        </h4>
                        {dev.verified && (
                          <span className="p-0.5 text-emerald-500" title="Verified Developer">
                            <BadgeCheck className="w-4 h-4" />
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            dev.developerStatus === 'VERIFIED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : dev.developerStatus === 'SUSPENDED'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {dev.developerStatus || (dev.verified ? 'VERIFIED' : 'NONE')}
                        </span>
                      </div>
                      <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                        Org: <strong className="text-[#1D1B20] dark:text-[#E6E1E5]">{dev.organizationName || 'Individual'}</strong> • UID: <code className="font-mono text-[11px]">{dev.developerUid}</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedDev(dev);
                        setDevActionType(dev.developerStatus === 'SUSPENDED' ? 'RESTORE' : 'SUSPEND');
                        setDevModerationNotes('');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        dev.developerStatus === 'SUSPENDED'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      {dev.developerStatus === 'SUSPENDED' ? 'Restore Developer' : 'Suspend Developer'}
                    </button>
                    {!dev.verified && (
                      <button
                        onClick={() => {
                          setSelectedDev(dev);
                          setDevActionType('VERIFY');
                          setDevModerationNotes('Verified by Administrator');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Grant Verified
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 2: USERS DIRECTORY */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex items-center gap-3">
            <Search className="w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or UID..."
              className="bg-transparent text-xs w-full text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none"
            />
          </div>

          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden divide-y divide-black/5 dark:divide-white/5 shadow-sm">
            {usersList
              .filter(
                (u) =>
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.id.includes(searchQuery)
              )
              .map((usr) => (
                <div
                  key={usr.id}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={usr.avatarUrl}
                      alt={usr.name}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-[#6750A4]/20"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                          {usr.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            usr.role === 'ADMIN'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : usr.role === 'VERIFIED_DEVELOPER' || usr.role === 'DEVELOPER'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : usr.role === 'VERIFIED_STUDENT' || usr.role === 'STUDENT'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : 'bg-black/5 dark:bg-white/5 text-[#49454F] dark:text-[#CAC4D0]'
                          }`}
                        >
                          {usr.role}
                        </span>
                        {usr.verificationBadge && usr.verificationBadge !== 'NONE' && (
                          <span className="p-0.5 text-emerald-500" title={`Badge: ${usr.verificationBadge}`}>
                            <BadgeCheck className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                        {usr.email} • UID: <code className="font-mono text-[11px]">{usr.id}</code>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingUser(usr);
                      setTargetRole(usr.role);
                      setTargetBadge(usr.verificationBadge || 'NONE');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] transition-all"
                  >
                    Manage Permissions
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
              <History className="w-4 h-4 text-[#6750A4]" />
              Security & Verification Audit Trail
            </h3>
            <span className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Total Records: {auditLogs.length}
            </span>
          </div>

          <div className="divide-y divide-black/5 dark:divide-white/5">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => {
                const isApproved = log.action === 'APPROVED' || log.action.includes('APPROVED');
                const isRejected = log.action === 'REJECTED' || log.action.includes('REJECTED');
                const isChanges = log.action === 'REQUEST_CHANGES' || log.action.includes('REQUEST_INFO');
                const isOtp = log.action.startsWith('OTP');
                const isDraft = log.action.startsWith('DRAFT');

                const badgeColor = isApproved
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : isRejected
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  : isChanges
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : isOtp
                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                  : isDraft
                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                  : 'bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] border-[#6750A4]/30';

                return (
                  <div key={log.id} className="py-3.5 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-black uppercase tracking-wider ${badgeColor}`}>
                          {log.action}
                        </span>
                        {log.verificationType && (
                          <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                            {log.verificationType}
                          </span>
                        )}
                        {log.applicationToken && log.applicationToken !== 'N/A' && (
                          <span className="text-[11px] font-mono text-[#6750A4] dark:text-[#D0BCFF] bg-[#6750A4]/10 px-2 py-0.5 rounded">
                            Token: {log.applicationToken}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-zinc-500">
                          UID: {log.userId || log.targetId || log.targetUserId || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-[#1D1B20] dark:text-[#E6E1E5] font-medium leading-relaxed">
                        {log.details || 'No additional details provided'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                        {log.adminEmail || log.adminId ? (
                          <span>
                            Admin: <strong className="text-[#1D1B20] dark:text-[#E6E1E5]">{log.adminEmail || log.adminId}</strong>
                          </span>
                        ) : (
                          <span>Actor: <strong className="text-[#1D1B20] dark:text-[#E6E1E5]">User Self-Service</strong></span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#49454F] dark:text-[#CAC4D0] whitespace-nowrap shrink-0 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-[#49454F] dark:text-[#CAC4D0]">
                No security audit logs recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: STUDENT MANAGEMENT */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name, email, institution, or student ID..."
                className="bg-transparent text-xs w-full text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {usersList.filter(u => u.role === 'STUDENT' || u.role === 'VERIFIED_STUDENT' || u.studentStatus === 'VERIFIED').length} Verified Scholars
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden divide-y divide-black/5 dark:divide-white/5 shadow-sm">
            {usersList
              .filter(
                (u) =>
                  u.role === 'STUDENT' ||
                  u.role === 'VERIFIED_STUDENT' ||
                  u.studentStatus === 'VERIFIED' ||
                  u.studentDetails ||
                  requests.some(r => r.type === 'STUDENT' && r.userId === u.id)
              )
              .filter(
                (u) =>
                  !searchQuery ||
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (u.studentDetails?.institutionName && u.studentDetails.institutionName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  u.id.includes(searchQuery)
              )
              .map((stu) => {
                const pendingReq = requests.find(r => r.type === 'STUDENT' && r.userId === stu.id);
                return (
                  <div
                    key={stu.id}
                    className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={stu.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(stu.name || 'student')}`}
                        alt={stu.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5]">
                            {stu.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            {stu.studentStatus === 'VERIFIED' ? 'STAGE 1 VERIFIED' : stu.studentStatus || 'STUDENT'}
                          </span>
                          {stu.studentStage2Verified && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EC4899]/15 text-[#EC4899] border border-[#EC4899]/30">
                              STAGE 2 COMMERCIAL
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                          {stu.email} • Institution: <strong className="text-[#1D1B20] dark:text-[#E6E1E5]">{stu.studentDetails?.institutionName || 'Accredited Academic Institution'}</strong>
                        </p>
                        {stu.studentDetails?.major && (
                          <p className="text-[11px] text-zinc-500 font-medium">
                            Major: {stu.studentDetails.major} • Grad Year: {stu.studentDetails.graduationYear || '2026'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {pendingReq && (
                        <button
                          onClick={() => {
                            setSelectedReq(pendingReq);
                            setActionType(null);
                            setReviewerNotes(pendingReq.reviewerNotes || '');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Review Request</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingUser(stu);
                          setTargetRole(stu.role);
                          setTargetBadge(stu.verificationBadge || 'NONE');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] hover:bg-[#E8DEF8] dark:hover:bg-[#34323B] transition-all"
                      >
                        Manage Student
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB: DOWNLOADS ANALYTICS */}
      {activeTab === 'DOWNLOADS_ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-1">
              <div className="text-xs font-bold text-zinc-400">Total Catalog Applications</div>
              <div className="text-2xl font-black text-[#1D1B20] dark:text-white">{appsList.length}</div>
            </div>
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-1">
              <div className="text-xs font-bold text-zinc-400">Aggregate Store Installs</div>
              <div className="text-2xl font-black text-emerald-500">
                {appsList.reduce((acc, app) => acc + (typeof app.downloads === 'number' ? app.downloads : parseInt(String(app.downloads || '0').replace(/[^0-9]/g, '')) || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-1">
              <div className="text-xs font-bold text-zinc-400">Security Clean Compliance</div>
              <div className="text-2xl font-black text-cyan-400">100%</div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-4">
            <h3 className="text-base font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-cyan-400" />
              <span>Top Installed Applications Across AVANYX Store</span>
            </h3>

            <div className="divide-y divide-black/5 dark:divide-white/5">
              {[...appsList]
                .sort((a, b) => {
                  const aVal = typeof a.downloads === 'number' ? a.downloads : parseInt(String(a.downloads || '0').replace(/[^0-9]/g, '')) || 0;
                  const bVal = typeof b.downloads === 'number' ? b.downloads : parseInt(String(b.downloads || '0').replace(/[^0-9]/g, '')) || 0;
                  return bVal - aVal;
                })
                .slice(0, 10)
                .map((app, idx) => (
                  <div key={app.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-black text-xs text-zinc-400">#{idx + 1}</span>
                      <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <div className="font-extrabold text-xs text-[#1D1B20] dark:text-white">{app.name}</div>
                        <div className="text-[11px] text-zinc-400">{app.packageName} • {app.developer}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-xs text-emerald-400">{app.downloads || 0} Installs</div>
                      <div className="text-[10px] text-zinc-400 font-mono">v{app.version || '1.0.0'}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-5">
            <div>
              <h3 className="text-base font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-[#9333EA]" />
                <span>AVANYX Platform & System Settings</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Authoritative configuration for store security and verification.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-2">
                <div className="text-xs font-bold text-white">Dynamic UPI QR Authority</div>
                <p className="text-[11px] text-zinc-400">Configured in Firestore collection: <code>payment_settings/global</code></p>
                <button
                  onClick={() => setActiveTab('PAYMENT_CONSOLE')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white font-extrabold text-xs shadow-md transition active:scale-95"
                >
                  Configure Dynamic UPI
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-2">
                <div className="text-xs font-bold text-white">Security Scan Policy</div>
                <p className="text-[11px] text-zinc-400">Enforce 100% SHA-256 binary validation on all APK submissions.</p>
                <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-extrabold text-[11px]">
                  Enforced (Zero-Trust)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADMIN NOTIFICATIONS */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#6750A4]" />
              Incoming Verification Notifications
            </h3>
            <span className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              Live Realtime Stream
            </span>
          </div>

          <div className="divide-y divide-black/5 dark:divide-white/5">
            {adminNotifications.length > 0 ? (
              adminNotifications.map((notif) => (
                <div key={notif.id} className="py-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {notif.title}
                    </div>
                    <p className="text-[#49454F] dark:text-[#CAC4D0]">
                      {notif.message}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#49454F] dark:text-[#CAC4D0] whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#49454F] dark:text-[#CAC4D0]">
                No admin notifications yet.
              </div>
            )}
          </div>
        </div>
      )}

      </main>

      {/* FULL VERIFICATION DETAILS & REVIEW MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-2xl w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                    selectedReq.type === 'DEVELOPER'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {selectedReq.type === 'DEVELOPER' ? (
                    <Terminal className="w-5 h-5" />
                  ) : (
                    <GraduationCap className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-[#E6E1E5]">
                    {selectedReq.type === 'DEVELOPER'
                      ? 'Developer Verification Application'
                      : 'Student Identity Verification'}
                  </h3>
                  <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                    Application ID: <code className="font-mono">{selectedReq.applicationId || selectedReq.id}</code>
                  </p>
                </div>
              </div>
              <button
                id="btn-close-details-modal"
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Applicant Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs">
              <div>
                <span className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] block">Applicant Name:</span>
                <strong className="text-[#1D1B20] dark:text-[#E6E1E5] text-sm">
                  {selectedReq.displayName || selectedReq.userName || 'N/A'}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] block">Applicant Email:</span>
                <strong className="text-[#1D1B20] dark:text-[#E6E1E5]">
                  {selectedReq.applicantEmail || selectedReq.userEmail}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] block">Applicant UID:</span>
                <code className="font-mono text-[11px] text-[#6750A4] dark:text-[#D0BCFF]">
                  {selectedReq.applicantUid || selectedReq.userId}
                </code>
              </div>
              <div>
                <span className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] block">Current Status:</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedReq.status === 'APPROVED'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : selectedReq.status === 'REJECTED'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {selectedReq.status}
                </span>
              </div>
            </div>

            {/* Aadhaar & Identity Verification Core Details */}
            <div className="space-y-3 border-t border-black/5 dark:border-white/5 pt-3">
              <h4 className="font-extrabold text-xs text-[#1D1B20] dark:text-[#E6E1E5] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Aadhaar & Identity Security
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                  <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Masked Aadhaar Token:</span>
                  <strong className="font-mono text-sm text-teal-700 dark:text-teal-300">
                    {selectedReq.aadhaarMasked ||
                      selectedReq.developerDetails?.aadhaarMasked ||
                      selectedReq.studentDetails?.aadhaarMasked ||
                      'Masked / Stored Securely'}
                  </strong>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Raw UIDAI number unexposed to public clients.</p>
                </div>

                <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Email OTP Status:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {selectedReq.emailVerified || selectedReq.studentDetails?.emailVerified !== false
                        ? 'OTP Verified'
                        : 'Verification Pending'}
                    </strong>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Verified applicant mailbox possession.</p>
                </div>
              </div>

            {/* Payment & Fee Verification Block (v3.5) */}
            <div className="space-y-3 border-t border-black/5 dark:border-white/5 pt-3">
              <h4 className="font-extrabold text-xs text-[#1D1B20] dark:text-[#E6E1E5] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Payment & Verification Fee Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Payment Status:</span>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedReq.paymentStatus === 'APPROVED'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : selectedReq.paymentStatus === 'REJECTED'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {selectedReq.paymentStatus || 'PENDING_PAYMENT'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Amount Paid:</span>
                  <strong className="text-[#1D1B20] dark:text-[#E6E1E5] text-sm">
                    ₹{selectedReq.amountPaid ?? (selectedReq.type === 'DEVELOPER' ? 1626 : 50)}
                  </strong>
                  {selectedReq.couponCode && (
                    <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                      Coupon: {selectedReq.couponCode}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">UPI Transaction ID / UTR:</span>
                  <code className="font-mono text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] block mt-1">
                    {selectedReq.transactionId || 'None / Not Provided'}
                  </code>
                </div>
              </div>

              {selectedReq.paymentScreenshotUrl && (
                <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1.5">
                  <span className="text-[11px] font-bold text-[#1D1B20] dark:text-[#E6E1E5]">Payment Screenshot Proof:</span>
                  <a
                    href={selectedReq.paymentScreenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full max-w-xs h-32 rounded-xl overflow-hidden bg-black/10 relative group"
                  >
                    <img
                      src={selectedReq.paymentScreenshotUrl}
                      alt="Payment Screenshot"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                      <ExternalLink className="w-4 h-4 mr-1" /> View Full Proof
                    </div>
                  </a>
                </div>
              )}
            </div>

              {/* Secure Document & Biometric Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Aadhaar Front */}
                {(selectedReq.aadhaarFrontUrl || selectedReq.developerDetails?.aadhaarFrontUrl || selectedReq.studentDetails?.aadhaarFrontUrl) && (
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
                    <span className="text-[11px] font-bold text-[#1D1B20] dark:text-white block">Aadhaar Front</span>
                    <a
                      href={selectedReq.aadhaarFrontUrl || selectedReq.developerDetails?.aadhaarFrontUrl || selectedReq.studentDetails?.aadhaarFrontUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-28 rounded-xl overflow-hidden bg-black/10 relative group"
                    >
                      <img
                        src={selectedReq.aadhaarFrontUrl || selectedReq.developerDetails?.aadhaarFrontUrl || selectedReq.studentDetails?.aadhaarFrontUrl}
                        alt="Aadhaar Front"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                        <ExternalLink className="w-4 h-4 mr-1" /> View Full
                      </div>
                    </a>
                  </div>
                )}

                {/* Live Selfie */}
                {(selectedReq.liveSelfieUrl || selectedReq.developerDetails?.liveSelfieUrl) && (
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
                    <span className="text-[11px] font-bold text-[#1D1B20] dark:text-white block">Live Selfie (Biometric)</span>
                    <a
                      href={selectedReq.liveSelfieUrl || selectedReq.developerDetails?.liveSelfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-28 rounded-xl overflow-hidden bg-black/10 relative group"
                    >
                      <img
                        src={selectedReq.liveSelfieUrl || selectedReq.developerDetails?.liveSelfieUrl}
                        alt="Live Selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                        <ExternalLink className="w-4 h-4 mr-1" /> View Full
                      </div>
                    </a>
                  </div>
                )}

                {/* Marksheet / TC */}
                {(selectedReq.marksheetUrl || selectedReq.studentDetails?.marksheetUrl || selectedReq.studentDetails?.documentUrl) && (
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
                    <span className="text-[11px] font-bold text-[#1D1B20] dark:text-white block">Class 10 Marksheet / TC</span>
                    <a
                      href={selectedReq.marksheetUrl || selectedReq.studentDetails?.marksheetUrl || selectedReq.studentDetails?.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-28 rounded-xl overflow-hidden bg-black/10 relative group flex items-center justify-center"
                    >
                      {(selectedReq.marksheetUrl || selectedReq.studentDetails?.marksheetUrl || selectedReq.studentDetails?.documentUrl)?.endsWith('.pdf') ? (
                        <div className="flex flex-col items-center text-zinc-500">
                          <FileText className="w-8 h-8 text-teal-600 mb-1" />
                          <span className="text-[10px] font-bold">PDF Document</span>
                        </div>
                      ) : (
                        <img
                          src={selectedReq.marksheetUrl || selectedReq.studentDetails?.marksheetUrl || selectedReq.studentDetails?.documentUrl}
                          alt="Marksheet Proof"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                        <ExternalLink className="w-4 h-4 mr-1" /> View Full
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Comprehensive Detail Fields */}
            {selectedReq.type === 'DEVELOPER' && selectedReq.developerDetails && (
              <div className="space-y-3 border-t border-black/5 dark:border-white/5 pt-3">
                <h4 className="font-extrabold text-xs text-[#1D1B20] dark:text-[#E6E1E5] uppercase tracking-wider">
                  Developer Credentials & Portfolio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#49454F] dark:text-[#CAC4D0] block">Organization / Studio:</span>
                    <strong>{selectedReq.developerDetails.organizationName || 'Independent Developer'}</strong>
                  </div>
                  <div>
                    <span className="text-[#49454F] dark:text-[#CAC4D0] block">Country / Region:</span>
                    <strong>{selectedReq.developerDetails.country || 'Global'}</strong>
                  </div>
                  <div>
                    <span className="text-[#49454F] dark:text-[#CAC4D0] block">Website URL:</span>
                    {selectedReq.developerDetails.websiteUrl ? (
                      <a
                        href={selectedReq.developerDetails.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6750A4] dark:text-[#D0BCFF] underline flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5" /> {selectedReq.developerDetails.websiteUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      'None specified'
                    )}
                  </div>
                  <div>
                    <span className="text-[#49454F] dark:text-[#CAC4D0] block">GitHub Profile / Repo:</span>
                    {selectedReq.developerDetails.githubUrl ? (
                      <a
                        href={selectedReq.developerDetails.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6750A4] dark:text-[#D0BCFF] underline flex items-center gap-1"
                      >
                        <Github className="w-3.5 h-3.5" /> {selectedReq.developerDetails.githubUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      'None specified'
                    )}
                  </div>
                </div>

                {selectedReq.developerDetails.description && (
                  <div className="text-xs">
                    <span className="text-[#49454F] dark:text-[#CAC4D0] block">Developer Bio / App Plans:</span>
                    <p className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 mt-1 leading-relaxed">
                      {selectedReq.developerDetails.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedReq.type === 'STUDENT' && selectedReq.studentDetails && (
              <div className="space-y-3 border-t border-black/5 dark:border-white/5 pt-3">
                <h4 className="font-extrabold text-xs text-[#1D1B20] dark:text-[#E6E1E5] uppercase tracking-wider">
                  Academic Verification Data
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#49454F] dark:text-[#CAC4D0] block">School / Institution:</span>
                    <strong>{selectedReq.studentDetails.institutionName || selectedReq.studentDetails.schoolName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[#49454F] dark:text-[#CAC4D0] block">Board of Examination:</span>
                    <strong>{selectedReq.studentDetails.board || 'CBSE'}</strong>
                  </div>
                  <div>
                    <span className="text-[#49454F] dark:text-[#CAC4D0] block">Class 10 Passing Year:</span>
                    <strong>{selectedReq.studentDetails.passingYear || selectedReq.studentDetails.graduationYear || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[#49454F] dark:text-[#CAC4D0] block">Student Email:</span>
                    <strong>{selectedReq.studentDetails.contactEmail || selectedReq.applicantEmail}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Document References / Uploads */}
            {((selectedReq.documentUrls && selectedReq.documentUrls.length > 0) ||
              selectedReq.studentDetails?.documentUrl ||
              selectedReq.developerDetails?.documentUrls) && (
              <div className="space-y-2 border-t border-black/5 dark:border-white/5 pt-3 text-xs">
                <h4 className="font-extrabold text-xs text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#6750A4]" /> Attached Verification Documents
                </h4>
                <div className="space-y-1.5">
                  {(selectedReq.documentUrls || []).concat(
                    selectedReq.studentDetails?.documentUrl ? [selectedReq.studentDetails.documentUrl] : []
                  ).map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-[#6750A4] dark:text-[#D0BCFF] hover:underline flex items-center justify-between truncate"
                    >
                      <span className="truncate">{url}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Review Decision Form */}
            <div className="border-t border-black/5 dark:border-white/5 pt-4 space-y-3">
              <h4 className="font-extrabold text-xs text-[#1D1B20] dark:text-[#E6E1E5]">
                Admin Review Decision
              </h4>

              {/* Action Buttons selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="btn-select-approve"
                  onClick={() => {
                    setActionType('APPROVE');
                    setReviewerNotes('Approved by store administration.');
                  }}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Verify
                </button>

                <button
                  type="button"
                  id="btn-select-request-info"
                  onClick={() => {
                    setActionType('REQUEST_INFO');
                    setReviewerNotes('');
                  }}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    actionType === 'REQUEST_INFO'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" /> Request Info
                </button>

                <button
                  type="button"
                  id="btn-select-reject"
                  onClick={() => {
                    setActionType('REJECT');
                    setReviewerNotes('');
                  }}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    actionType === 'REJECT'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> Reject Application
                </button>
              </div>

              {actionType && (
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0]">
                    {actionType === 'APPROVE'
                      ? 'Approval Notes (Optional - Sent to applicant)'
                      : actionType === 'REQUEST_INFO'
                      ? 'Specific Information / Documentation Requested (Sent to applicant):'
                      : 'Rejection Reason (Sent to applicant):'}
                  </label>
                  <textarea
                    id="input-reviewer-notes"
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    rows={3}
                    placeholder={
                      actionType === 'REQUEST_INFO'
                        ? 'e.g. Please provide a government ID or valid GitHub repository showcasing your Android development work.'
                        : actionType === 'REJECT'
                        ? 'e.g. Application details could not be verified with the registered educational institution.'
                        : 'Approval notes...'
                    }
                    className="w-full p-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]"
              >
                Close
              </button>

              {actionType && (
                <button
                  type="button"
                  id="btn-confirm-review-action"
                  disabled={isProcessing || (actionType === 'REQUEST_INFO' && !reviewerNotes.trim())}
                  onClick={handleExecuteReviewAction}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : actionType === 'REQUEST_INFO'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm {actionType}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Permissions Management Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#6750A4]" />
                Manage User Role & Badge
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs space-y-1">
              <div className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
                {editingUser.name} ({editingUser.email})
              </div>
              <div className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] font-mono">
                UID: {editingUser.id}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                  Assign Authoritative Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['USER', 'DEVELOPER', 'VERIFIED_DEVELOPER', 'STUDENT', 'VERIFIED_STUDENT', 'ADMIN'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTargetRole(r)}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all truncate ${
                        targetRole === r
                          ? 'border-[#6750A4] bg-[#6750A4] text-white shadow-sm'
                          : 'border-black/5 dark:border-white/5 bg-[#F3EDF7] dark:bg-[#25262B] text-[#49454F] dark:text-[#CAC4D0]'
                      }`}
                      title={r}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                  Verification Badge
                </label>
                <select
                  value={targetBadge}
                  onChange={(e: any) => setTargetBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                >
                  <option value="NONE">None</option>
                  <option value="VERIFIED">Verified Checkmark</option>
                  <option value="VERIFIED_DEVELOPER">Verified Developer</option>
                  <option value="VERIFIED_STUDENT">Verified Student</option>
                  <option value="ADMIN">Admin Badge</option>
                  <option value="OFFICIAL">Official Organization</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveUserPermissions}
                className="px-5 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold hover:bg-[#523e85] disabled:opacity-50"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Moderation Modal */}
      {selectedApp && appActionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Moderate App: {selectedApp.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setAppActionType(null);
                }}
                className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs space-y-1">
              <div>Package: <code className="font-mono font-bold">{selectedApp.packageName}</code></div>
              <div>Action: <strong className="text-purple-600 dark:text-purple-400 font-bold">{appActionType}</strong></div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                Reviewer / Audit Notes
              </label>
              <textarea
                value={appModerationNotes}
                onChange={(e) => setAppModerationNotes(e.target.value)}
                placeholder="Reason or notes for this moderation action..."
                className="w-full h-24 p-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedApp(null);
                  setAppActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteAppModeration}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : `Confirm ${appActionType}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Moderation Modal */}
      {selectedDev && devActionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-600" />
                Moderate Developer: {selectedDev.displayName}
              </h3>
              <button
                onClick={() => {
                  setSelectedDev(null);
                  setDevActionType(null);
                }}
                className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs space-y-1">
              <div>UID: <code className="font-mono">{selectedDev.developerUid}</code></div>
              <div>Action: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{devActionType}</strong></div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                Audit Notes / Reason
              </label>
              <textarea
                value={devModerationNotes}
                onChange={(e) => setDevModerationNotes(e.target.value)}
                placeholder="Reason or notes for developer moderation..."
                className="w-full h-24 p-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDev(null);
                  setDevActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteDeveloperModeration}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : `Confirm ${devActionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
