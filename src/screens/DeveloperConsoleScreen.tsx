import React, { useState, useEffect } from 'react';
import { User, StoreApp, AppReview, AppVersionDoc, DeveloperProfile, DeveloperApplication } from '../types';
import {
  subscribeToDeveloperApps,
  subscribeToAppReviews,
  subscribeToAppVersions,
  subscribeToDownloadEvents,
  subscribeToViewEvents,
  subscribeToRealtimeDeveloperAnalytics,
  fetchDeveloperProfile,
  deleteDeveloperApp,
  subscribeToDeveloperVerification,
  fetchDraftVerificationByUserId
} from '../services/firestoreService';
import { useStore } from '../context/StoreContext';
import { DeveloperConsoleTab, DeveloperRealtimeAnalyticsData } from '../components/developer/developerTypes';
import { DeveloperHeader } from '../components/developer/DeveloperHeader';
import { DeveloperSidebar } from '../components/developer/DeveloperSidebar';
import { AppSelectorDropdown } from '../components/developer/AppSelectorDropdown';
import { DashboardTab } from '../components/developer/DashboardTab';
import { SubmitAppTab } from '../components/developer/SubmitAppTab';
import { AllAppsTab } from '../components/developer/AllAppsTab';
import { ReleasesTab } from '../components/developer/ReleasesTab';
import { ReviewsModerationTab } from '../components/developer/ReviewsModerationTab';
import { CrashReportsTab } from '../components/developer/CrashReportsTab';
import { DownloadAnalyticsTab } from '../components/developer/DownloadAnalyticsTab';
import { RealtimeAnalyticsHub } from '../components/developer/RealtimeAnalyticsHub';
import { VerificationQueueTab } from '../components/developer/VerificationQueueTab';
import { AppModerationQueueTab } from '../components/developer/AppModerationQueueTab';
import { NotificationCenterTab } from '../components/developer/NotificationCenterTab';
import { SecurityScanTab } from '../components/developer/SecurityScanTab';
import { StorageUsageTab } from '../components/developer/StorageUsageTab';
import { TestingTracksTab } from '../components/developer/TestingTracksTab';
import { MediaStudioTab } from '../components/developer/MediaStudioTab';
import { DeveloperProfileTab } from '../components/developer/DeveloperProfileTab';
import { DeveloperBillingTab } from '../components/developer/DeveloperBillingTab';
import { DeveloperPromotionTab } from '../components/developer/DeveloperPromotionTab';
import { PolicyCenterTab } from '../components/developer/PolicyCenterTab';
import { ConsoleSettingsTab } from '../components/developer/ConsoleSettingsTab';
import { ComingSoonTab } from '../components/developer/ComingSoonTab';
import { ApiCenterTab } from '../components/common/ApiCenterTab';
import { PayoutCenterTab } from '../components/common/PayoutCenterTab';
import { PurchaseHistoryScreen } from './PurchaseHistoryScreen';
import { Layers, Sparkles, ShieldCheck, Clock, BadgeCheck, XCircle, FileText, KeyRound, Copy, Check, ChevronRight, AlertCircle } from 'lucide-react';

interface DeveloperConsoleScreenProps {
  user?: User;
  onExit?: () => void;
  initialAppId?: string;
  onOpenApp?: (app: StoreApp) => void;
}

export const DeveloperConsoleScreen: React.FC<DeveloperConsoleScreenProps> = ({
  user: propUser,
  onExit: propOnExit,
  initialAppId,
  onOpenApp: propOnOpenApp
}) => {
  const store = useStore();
  const user = propUser || store.user;
  const onExit = propOnExit || (() => store.setCurrentTab('HOME'));
  const onOpenApp = propOnOpenApp || ((app: StoreApp) => store.openAppDetails(app.id));

  const activeUid = user.id || 'dev-local-user';

  // Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<DeveloperConsoleTab>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string>(initialAppId || 'ALL');

  // Realtime Firestore Data
  const [developerApps, setDeveloperApps] = useState<StoreApp[]>([]);
  const [allReviews, setAllReviews] = useState<AppReview[]>([]);
  const [appVersions, setAppVersions] = useState<AppVersionDoc[]>([]);
  const [downloadEvents, setDownloadEvents] = useState<any[]>([]);
  const [viewEvents, setViewEvents] = useState<any[]>([]);
  const [devProfile, setDevProfile] = useState<DeveloperProfile | null>(null);
  const [analyticsData, setAnalyticsData] = useState<DeveloperRealtimeAnalyticsData | undefined>(undefined);
  const [liveVerificationApp, setLiveVerificationApp] = useState<DeveloperApplication | null>(null);
  const [draftVerificationData, setDraftVerificationData] = useState<any | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // 0. Live Developer Verification & Draft Subscription (PART C)
  useEffect(() => {
    if (!activeUid) return;
    const unsubVerif = subscribeToDeveloperVerification(activeUid, (app) => {
      setLiveVerificationApp(app);
    });
    fetchDraftVerificationByUserId(activeUid, 'DEVELOPER')
      .then((draft) => {
        if (draft) setDraftVerificationData(draft);
      })
      .catch((err) => console.warn('[DeveloperConsole] Draft check:', err));

    return () => unsubVerif();
  }, [activeUid]);

  // 1. Subscribe to ONLY developer-owned apps in Firestore
  useEffect(() => {
    if (!activeUid) return;
    const unsub = subscribeToDeveloperApps(activeUid, (apps) => {
      setDeveloperApps(apps);
    });
    return () => unsub();
  }, [activeUid]);

  // 2. Fetch Developer Profile
  useEffect(() => {
    let mounted = true;
    fetchDeveloperProfile(activeUid).then((profile) => {
      if (mounted && profile) setDevProfile(profile);
    });
    return () => {
      mounted = false;
    };
  }, [activeUid]);

  // 3. Multi-Stream Real-Time Analytics Subscription
  useEffect(() => {
    if (!activeUid) return;
    const unsub = subscribeToRealtimeDeveloperAnalytics(
      activeUid,
      selectedAppId,
      (data) => {
        setAnalyticsData(data);
      }
    );
    return () => unsub();
  }, [activeUid, selectedAppId]);

  // 4. Determine active selected app
  const activeApp = selectedAppId !== 'ALL'
    ? developerApps.find((a) => a.id === selectedAppId) || developerApps[0]
    : developerApps[0];

  // 5. Subscribe to Reviews for active app
  useEffect(() => {
    if (!activeApp?.id) {
      setAllReviews([]);
      return;
    }
    const unsub = subscribeToAppReviews(activeApp.id, (revs) => {
      setAllReviews(revs);
    });
    return () => unsub();
  }, [activeApp?.id]);

  // 6. Subscribe to Versions for active app
  useEffect(() => {
    if (!activeApp?.id) {
      setAppVersions([]);
      return;
    }
    const unsub = subscribeToAppVersions(activeApp.id, (versions) => {
      setAppVersions(versions);
    });
    return () => unsub();
  }, [activeApp?.id]);

  // 7. Subscribe to download and view events for real-time telemetry
  useEffect(() => {
    const targetId = activeApp?.id || 'ALL';
    const unsubDl = subscribeToDownloadEvents(targetId, (evts) => {
      setDownloadEvents(evts);
    });
    const unsubVw = subscribeToViewEvents(targetId, (evts) => {
      setViewEvents(evts);
    });
    return () => {
      unsubDl();
      unsubVw();
    };
  }, [activeApp?.id]);

  // Real-time aggregates
  const getAppDownloadNumber = (app?: StoreApp): number => {
    if (!app) return 0;
    if (typeof app.downloadCount === 'number') return app.downloadCount;
    const parsed = parseInt(String(app.downloads || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getAppViewNumber = (app?: StoreApp): number => {
    if (!app) return 0;
    if (typeof app.viewCount === 'number') return app.viewCount;
    const parsed = parseInt(String(app.views || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalDownloads: number = activeApp
    ? getAppDownloadNumber(activeApp)
    : developerApps.reduce((acc: number, a) => acc + getAppDownloadNumber(a), 0);

  const totalViews: number = activeApp
    ? Math.max(getAppViewNumber(activeApp), viewEvents.length, analyticsData?.views?.totalViews || 0)
    : Math.max(
        developerApps.reduce((acc: number, a) => acc + getAppViewNumber(a), 0),
        viewEvents.length,
        analyticsData?.views?.totalViews || 0
      );

  const averageRating = allReviews.length > 0
    ? (allReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / allReviews.length).toFixed(1)
    : (activeApp?.rating ? activeApp.rating.toFixed(1) : '5.0');

  // Compute Verification Status & Details for Live Sync (PART C)
  const appToken =
    liveVerificationApp?.caseId ||
    liveVerificationApp?.applicationToken ||
    draftVerificationData?.token ||
    draftVerificationData?.applicationToken ||
    (user.developerDetails as any)?.applicationToken ||
    '';

  const rawDevStatus = (
    liveVerificationApp?.status ||
    user.developerStatus ||
    (draftVerificationData ? 'DRAFT' : 'NOT_APPLIED')
  ).toUpperCase();

  const isDevApproved =
    rawDevStatus === 'APPROVED' ||
    rawDevStatus === 'VERIFIED' ||
    user.role === 'DEVELOPER' ||
    user.role === 'ADMIN' ||
    user.developerStatus === 'VERIFIED';
  const isDevPending = rawDevStatus === 'PENDING_REVIEW' || rawDevStatus === 'PENDING';
  const isDevRejected = rawDevStatus === 'REJECTED';
  const isDevDraft = !isDevApproved && !isDevPending && !isDevRejected && !!draftVerificationData;

  const devSubmittedDate = liveVerificationApp?.submittedAt
    ? new Date(liveVerificationApp.submittedAt).toLocaleString()
    : (user.developerDetails as any)?.requestedAt
    ? new Date((user.developerDetails as any).requestedAt).toLocaleString()
    : draftVerificationData?.savedAt
    ? new Date(draftVerificationData.savedAt).toLocaleString()
    : 'N/A';

  const devReviewNotes =
    (liveVerificationApp as any)?.rejectionReason ||
    (liveVerificationApp as any)?.adminNotes ||
    (liveVerificationApp as any)?.reviewerNotes ||
    (user.developerDetails as any)?.rejectionReason ||
    (user.developerDetails as any)?.reviewNotes ||
    (isDevApproved ? 'Approved by AVANYX Administration. Developer publishing privileges active.' : '');

  const handleCopyAppToken = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!appToken) return;
    navigator.clipboard.writeText(appToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="h-screen w-full bg-[#0F1015] text-zinc-100 flex flex-col font-sans overflow-hidden select-none">
      {/* 1. Top App Bar (Sticky 64px, Google Play Console Inspired) */}
      <DeveloperHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onExitToStore={onExit}
        unreadNotificationsCount={2}
        onOpenNotifications={() => setActiveTab('NOTIFICATION_CENTER')}
        onOpenHelp={() => setActiveTab('POLICY_CENTER')}
      />

      {/* 2. Sub-Header Filter Chip & Context Bar with Professional App Selector */}
      <div className="h-14 px-4 md:px-6 bg-[#13141E]/95 border-b border-white/5 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md z-30">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* Professional App Selector Dropdown (Play Console Inspired) */}
          <AppSelectorDropdown
            developerApps={developerApps}
            selectedAppId={selectedAppId}
            onSelectApp={setSelectedAppId}
            onAddNewApp={() => setActiveTab('SUBMIT_APP')}
          />

          {/* Quick Active App Target Indicator */}
          {selectedAppId !== 'ALL' && activeApp && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#9333EA]/15 border border-[#9333EA]/30 text-xs font-semibold text-[#C084FC]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Scope: <strong>{activeApp.name}</strong></span>
              <span className="text-zinc-500 font-mono text-[11px]">v{activeApp.version || '1.0.0'}</span>
            </div>
          )}
        </div>

        {/* Live Firestore Telemetry Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Telemetry Live</span>
            <span className="sm:hidden">Live</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <DeveloperSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          appsCount={developerApps.length}
          unreadNotificationsCount={2}
          pendingReviewsCount={allReviews.filter((r) => !r.developerReply).length}
          crashesCount={0}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0C0D12] text-zinc-100">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Live Developer Verification & Status Banner (PART C) */}
            <div
              onClick={() => setActiveTab('VERIFICATION_REQUESTS')}
              className={`p-4 md:p-5 rounded-2xl border transition cursor-pointer ${
                isDevApproved
                  ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                  : isDevPending
                  ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                  : isDevRejected
                  ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                  : isDevDraft
                  ? 'bg-blue-950/20 border-blue-500/30 hover:border-blue-500/50'
                  : 'bg-[#181924] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start md:items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isDevApproved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isDevPending
                        ? 'bg-amber-500/20 text-amber-400'
                        : isDevRejected
                        ? 'bg-rose-500/20 text-rose-400'
                        : isDevDraft
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-[#6750A4]/20 text-[#D0BCFF]'
                    }`}
                  >
                    {isDevApproved ? (
                      <BadgeCheck className="w-6 h-6" />
                    ) : isDevPending ? (
                      <Clock className="w-6 h-6 animate-spin" />
                    ) : isDevRejected ? (
                      <XCircle className="w-6 h-6" />
                    ) : isDevDraft ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <ShieldCheck className="w-6 h-6" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm md:text-base font-black text-white">
                        Developer Application Status:
                      </h2>
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isDevApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isDevPending
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : isDevRejected
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isDevDraft
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {isDevApproved
                          ? 'APPROVED'
                          : isDevPending
                          ? 'PENDING REVIEW'
                          : isDevRejected
                          ? 'REJECTED'
                          : isDevDraft
                          ? 'DRAFT'
                          : 'NOT APPLIED'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      {appToken && (
                        <div className="flex items-center gap-1.5 font-mono text-[#D0BCFF]">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{appToken}</span>
                          <button
                            type="button"
                            onClick={handleCopyAppToken}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition"
                            title="Copy Token"
                          >
                            {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                      {devSubmittedDate !== 'N/A' && (
                        <span className="text-zinc-500 font-sans">
                          {isDevDraft ? 'Last Saved:' : 'Submitted:'} <strong className="text-zinc-300 font-semibold">{devSubmittedDate}</strong>
                        </span>
                      )}
                    </div>

                    {devReviewNotes && (
                      <p className="text-xs text-zinc-300 pt-0.5">
                        <strong className="text-zinc-400 font-bold">Review Notes:</strong> {devReviewNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <span className="text-xs font-bold text-[#C084FC] flex items-center gap-1">
                    <span>View Verification Hub</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
            {activeTab === 'DASHBOARD' && (
              <DashboardTab
                activeApp={activeApp}
                developerApps={developerApps}
                totalDownloads={totalDownloads}
                totalViews={totalViews}
                averageRating={averageRating}
                totalReviewsCount={allReviews.length}
                liveEvents={downloadEvents}
                liveViewEvents={viewEvents}
                realtimeReviews={allReviews}
                appVersionsList={appVersions}
                analyticsData={analyticsData}
                setActiveTab={setActiveTab}
                openAppDetails={onOpenApp}
              />
            )}

            {(activeTab === 'ALL_APPS' || activeTab === 'MY_APPS') && (
              <AllAppsTab
                developerApps={developerApps}
                user={user}
                setActiveTab={setActiveTab}
                setSelectedAppId={setSelectedAppId}
                openAppDetails={onOpenApp}
              />
            )}

            {(activeTab === 'BILLING' || activeTab === 'BILLING_CENTER' || activeTab === 'PRODUCTS_SKUS' || activeTab === 'FINANCIAL_REPORTS') && (
              <DeveloperBillingTab />
            )}

            {(activeTab === 'SUBMIT_APP' || activeTab === 'APK_DISTRIBUTION') && (
              <SubmitAppTab
                user={user}
                activeUid={activeUid}
                onSuccessPublished={() => setActiveTab('ALL_APPS')}
              />
            )}

            {activeTab === 'PAYOUT_CENTER' && (
              <PayoutCenterTab
                creatorUid={activeUid}
                creatorName={user.name || 'Developer'}
                creatorEmail={user.email}
                creatorType="DEVELOPER"
              />
            )}

            {activeTab === 'API_CENTER' && (
              <ApiCenterTab
                creatorUid={activeUid}
                creatorName={user.name || 'Developer'}
                creatorType="DEVELOPER"
              />
            )}

            {activeTab === 'PURCHASE_HISTORY' && (
              <div className="p-4 rounded-3xl bg-[#14151C] border border-white/10">
                <PurchaseHistoryScreen />
              </div>
            )}

            {activeTab === 'RELEASES' && (
              <ReleasesTab
                activeApp={activeApp}
                developerApps={developerApps}
                appVersionsList={appVersions}
                user={user}
                activeUid={activeUid}
              />
            )}

            {activeTab === 'REVIEWS_MODERATION' && (
              <ReviewsModerationTab
                reviews={allReviews}
                developerApps={developerApps}
                activeUid={activeUid}
              />
            )}

            {activeTab === 'CRASH_REPORTS' && (
              <CrashReportsTab
                developerApps={developerApps}
                activeApp={activeApp}
              />
            )}

            {(activeTab === 'ANALYTICS' || activeTab === 'DOWNLOAD_ANALYTICS' || activeTab === 'REVENUE_ANALYTICS') && (
              <RealtimeAnalyticsHub
                developerApps={developerApps}
                activeApp={activeApp}
                selectedAppId={selectedAppId}
                analyticsData={analyticsData}
                activeUid={activeUid}
                initialSubTab="DOWNLOADS"
                onSelectApp={setSelectedAppId}
                openAppDetails={onOpenApp}
                downloadEvents={downloadEvents}
                viewEvents={viewEvents}
              />
            )}

            {activeTab === 'REVIEWS_ANALYTICS' && (
              <RealtimeAnalyticsHub
                developerApps={developerApps}
                activeApp={activeApp}
                selectedAppId={selectedAppId}
                analyticsData={analyticsData}
                activeUid={activeUid}
                initialSubTab="REVIEWS"
                onSelectApp={setSelectedAppId}
                openAppDetails={onOpenApp}
                downloadEvents={downloadEvents}
                viewEvents={viewEvents}
              />
            )}

            {activeTab === 'RATINGS_ANALYTICS' && (
              <RealtimeAnalyticsHub
                developerApps={developerApps}
                activeApp={activeApp}
                selectedAppId={selectedAppId}
                analyticsData={analyticsData}
                activeUid={activeUid}
                initialSubTab="RATINGS"
                onSelectApp={setSelectedAppId}
                openAppDetails={onOpenApp}
                downloadEvents={downloadEvents}
                viewEvents={viewEvents}
              />
            )}

            {activeTab === 'VIEWS_ANALYTICS' && (
              <RealtimeAnalyticsHub
                developerApps={developerApps}
                activeApp={activeApp}
                selectedAppId={selectedAppId}
                analyticsData={analyticsData}
                activeUid={activeUid}
                initialSubTab="VIEWS"
                onSelectApp={setSelectedAppId}
                openAppDetails={onOpenApp}
                downloadEvents={downloadEvents}
                viewEvents={viewEvents}
              />
            )}

            {activeTab === 'VERIFICATION_REQUESTS' && (
              <VerificationQueueTab
                user={user}
                activeUid={activeUid}
                developerProfile={devProfile}
              />
            )}

            {activeTab === 'APP_MODERATION_QUEUE' && (
              <AppModerationQueueTab
                developerApps={developerApps}
                user={user}
              />
            )}

            {(activeTab === 'NOTIFICATION_CENTER' || activeTab === 'NOTIFICATIONS') && (
              <NotificationCenterTab />
            )}

            {activeTab === 'SECURITY_SCAN' && (
              <SecurityScanTab
                developerApps={developerApps}
                activeApp={activeApp}
              />
            )}

            {activeTab === 'STORAGE_USAGE' && (
              <StorageUsageTab
                developerApps={developerApps}
              />
            )}

            {activeTab === 'TESTING' && (
              <TestingTracksTab
                developerApps={developerApps}
                activeApp={activeApp}
                user={user}
              />
            )}

            {activeTab === 'MEDIA_STUDIO' && (
              <MediaStudioTab
                activeUid={activeUid}
              />
            )}

            {activeTab === 'DEVELOPER_PROFILE' && (
              <DeveloperProfileTab
                user={user}
                activeUid={activeUid}
                developerProfile={devProfile}
              />
            )}

            {(activeTab === 'PROMOTION_MANAGER' || activeTab === 'PROMOTION_CENTER') && (
              <DeveloperPromotionTab
                developerUid={activeUid}
                developerApps={developerApps}
                onNavigateToApp={(appId) => {
                  const target = developerApps.find(a => a.id === appId);
                  if (target) onOpenApp(target);
                }}
              />
            )}

            {activeTab === 'POLICY_CENTER' && (
              <PolicyCenterTab />
            )}

            {(activeTab === 'CONSOLE_SETTINGS' || activeTab === 'SETTINGS') && (
              <ConsoleSettingsTab
                user={user}
              />
            )}

            {/* Play Console Extended Placeholders (Clean Coming Soon) */}
            {(activeTab === 'REACH_DEVICES' ||
              activeTab === 'APP_BUNDLE_EXPLORER' ||
              activeTab === 'ANDROID_VITALS' ||
              activeTab === 'PRODUCTS_SKUS' ||
              activeTab === 'FINANCIAL_REPORTS' ||
              activeTab === 'INTERNAL_SHARING') && (
              <ComingSoonTab
                tab={activeTab}
                onBackToDashboard={() => setActiveTab('DASHBOARD')}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
