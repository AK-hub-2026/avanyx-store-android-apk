import { StoreApp, AppCategory, AppReview, AppVersionDoc, DeveloperProfile } from '../../types';

export type DeveloperConsoleTab =
  | 'DASHBOARD'
  | 'DEVELOPER_PROFILE'
  | 'MY_APPS'
  | 'ALL_APPS'
  | 'RELEASES'
  | 'APK_DISTRIBUTION'
  | 'SUBMIT_APP'
  | 'PROMOTION_CENTER'
  | 'PROMOTION_MANAGER'
  | 'BILLING_CENTER'
  | 'BILLING'
  | 'PAYOUT_CENTER'
  | 'REVENUE_ANALYTICS'
  | 'API_CENTER'
  | 'PURCHASE_HISTORY'
  | 'NOTIFICATIONS'
  | 'NOTIFICATION_CENTER'
  | 'SETTINGS'
  | 'CONSOLE_SETTINGS'
  | 'TESTING'
  | 'MEDIA_STUDIO'
  | 'ANALYTICS'
  | 'DOWNLOAD_ANALYTICS'
  | 'REVIEWS_ANALYTICS'
  | 'RATINGS_ANALYTICS'
  | 'VIEWS_ANALYTICS'
  | 'REVIEWS_MODERATION'
  | 'CRASH_REPORTS'
  | 'VERIFICATION_REQUESTS'
  | 'APP_MODERATION_QUEUE'
  | 'SECURITY_SCAN'
  | 'STORAGE_USAGE'
  | 'POLICY_CENTER'
  // Play console placeholders (Coming soon)
  | 'REACH_DEVICES'
  | 'APP_BUNDLE_EXPLORER'
  | 'ANDROID_VITALS'
  | 'PRODUCTS_SKUS'
  | 'FINANCIAL_REPORTS'
  | 'INTERNAL_SHARING'
  | 'APP_INTEGRITY'
  | 'DEEP_LINKS';

export interface DeveloperNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
}

export interface CrashReportItem {
  id: string;
  appName: string;
  packageName: string;
  version: string;
  crashType: string;
  message: string;
  stackTrace: string;
  deviceModel: string;
  androidVersion: string;
  occurrences: number;
  lastOccurred: string;
  status: 'RESOLVED' | 'INVESTIGATING' | 'OPEN';
}

export interface SecurityScanResult {
  appId: string;
  appName: string;
  packageName: string;
  version: string;
  sha256: string;
  scanStatus: 'CLEAN' | 'WARNING' | 'FLAGGED';
  malwareDetected: boolean;
  adwareDetected: boolean;
  vulnerabilitiesCount: number;
  lastScanned: string;
  details: string[];
}

export interface CountryStat {
  code: string;
  name: string;
  flag: string;
  count: number;
  share: number;
}

export interface DeviceStat {
  name: string;
  count: number;
  share: number;
}

export interface AppRankingStat {
  appId: string;
  appName: string;
  iconUrl: string;
  packageName: string;
  category: string;
  version: string;
  downloads: number;
  views: number;
  rating: number;
  reviewsCount: number;
  ctr: number;
}

export interface DeveloperRealtimeAnalyticsData {
  downloads: {
    totalDownloads: number;
    growthRate: number;
    daily: Array<{ date: string; fullDate: string; label: string; downloads: number; direct: number; store: number }>;
    weekly: Array<{ week: string; label: string; downloads: number }>;
    monthly: Array<{ month: string; label: string; downloads: number }>;
  };
  ratings: {
    averageRating: number;
    totalRatingsCount: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
    distributionPercentages: { 1: number; 2: number; 3: number; 4: number; 5: number };
    trend: Array<{ date: string; label: string; avgRating: number; count: number }>;
  };
  reviews: {
    totalReviews: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    positivePercent: number;
    repliedCount: number;
    pendingReplyCount: number;
    timeline: AppReview[];
  };
  views: {
    totalViews: number;
    uniqueVisitors: number;
    repeatVisitors: number;
    ctr: number; // View to Download Conversion %
    dailyViews: Array<{ date: string; label: string; views: number; uniqueVisitors: number }>;
  };
  countries: {
    list: CountryStat[];
    topCountry: string;
    totalTrackedCountries: number;
  };
  devices: {
    brands: DeviceStat[];
    androidVersions: DeviceStat[];
    appVersions: DeviceStat[];
  };
  hourlyHeatmap: Array<{ hour: number; label: string; count: number }>;
  activityCalendar: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>;
  appRankings: AppRankingStat[];
}
