export type AppCategory =
  | 'GAMES'
  | 'PRODUCTIVITY'
  | 'TOOLS'
  | 'SECURITY'
  | 'SOCIAL'
  | 'MEDIA'
  | 'AI_AGENTS'
  | 'EDUCATION'
  | 'ENTERTAINMENT'
  | 'CASUAL'
  | 'ARCADE'
  | 'ACTION'
  | 'RACING'
  | 'FINANCE'
  | 'HEALTH'
  | 'SHOPPING'
  | 'LIFESTYLE'
  | 'CREATIVITY'
  | 'BUSINESS'
  | 'UTILITIES';

export type AppType = 'FREE' | 'PAID' | 'IN_APP_PURCHASE' | 'SUBSCRIPTION' | 'FREE_WITH_PREMIUM';

export interface StoreApp {
  id: string;
  name: string;
  packageName: string;
  developer: string;
  developerUid?: string;
  developerProfileId?: string;
  category: AppCategory;
  categoryId?: string;
  rating: number;
  reviewCount: number;
  downloads: string;
  downloadCount: number;
  views?: string;
  viewCount?: number;
  iconUrl: string;
  iconText?: string;
  iconBgColorHex?: string;
  bannerUrl: string;
  description: string;
  fullDescription?: string;
  features?: string[];
  screenshots: string[];
  version: string;
  versionCode?: number;
  apkSize: string;
  sizeMb?: number;
  downloadUrl?: string;
  isInstalled: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  isAiSpotlight?: boolean;
  isStudentSpotlight?: boolean;
  isGame?: boolean;
  price: number;
  appType?: AppType;
  tags: string[];
  releaseDate: string;
  securityScore: number; // e.g. 98% clean
  sha256Checksum: string;
  checksumSha256?: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED' | 'ARCHIVED';
  videoUrl?: string;
  privacyPolicyUrl?: string;
  termsConditionsUrl?: string;
  supportEmail?: string;
  websiteUrl?: string;
  contentRatingConfirmed?: boolean;
  permissionDeclared?: boolean;
  copyrightOwnershipDeclared?: boolean;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  acceptedVersion?: string;
  acceptedTimestamp?: string;
  createdAt?: string | any;
  updatedAt?: string | any;
  submittedAt?: string | any;
}

export interface CategoryItem {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  icon?: string;
  iconName?: string;
  description?: string;
  displayOrder?: number;
  appCount?: number;
  featured?: boolean;
}

export interface DeveloperProfile {
  id: string;
  ownerUid?: string;
  uid?: string;
  developerUid?: string;
  publicDeveloperId?: string;
  developerSlug?: string;
  displayName: string;
  organizationName?: string;
  shortDescription?: string;
  bio?: string;
  logoUrl?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  verified: boolean;
  verificationBadge?: VerificationBadge;
  publishedAppCount?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  developerStatus?: DeveloperStatus;
  officialWebsite?: string;
  websiteUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  whatsappUrl?: string;
  otherPublicLinks?: Array<{ label: string; url: string }>;
  contactEmail?: string;
  supportEmail?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppReview {
  id: string;
  appId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  helpfulCount?: number;
  developerReply?: {
    text: string;
    repliedAt: string;
    developerUid?: string;
  };
  isReported?: boolean;
  reportCount?: number;
  reportReason?: string;
}

export interface AppRating {
  id: string;
  appId: string;
  userId: string;
  rating: number;
  updatedAt: string;
}

export interface AppDownloadRecord {
  id: string;
  appId: string;
  appName?: string;
  developerUid?: string;
  userId?: string;
  timestamp: string;
  version?: string;
  deviceType?: string;
}

export interface DeveloperAnalyticsSummary {
  totalDownloads: number;
  totalApps: number;
  publishedApps: number;
  averageRating: number;
  totalReviews: number;
  totalViews: number;
  recentDownloads: Array<{ date: string; downloads: number }>;
  ratingDistribution: { [star: number]: number };
  versionAdoption: Array<{ version: string; count: number; percentage: number }>;
}

export interface FeaturedBanner {
  id: string;
  title: string;
  subtitle?: string;
  bannerImageUrl?: string;
  imageUrl?: string;
  targetAppId?: string;
  targetUrl?: string;
  targetType?: 'APP' | 'CATEGORY' | 'EXTERNAL';
  badgeText?: string;
  isActive: boolean;
  order?: number;
  displayOrder?: number;
  gradient?: string;
  ctaText?: string;
}

export type PromotionType =
  | 'HERO_BANNER'
  | 'TRENDING'
  | 'CATEGORY_SPOTLIGHT'
  | 'FEATURED_APP'
  | 'FESTIVAL_SPECIAL';
export type PromotionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED';

export interface PromotionRequest {
  id: string;
  developerUid: string;
  developerName?: string;
  developerEmail?: string;
  appId: string;
  appName: string;
  appIcon?: string;
  promotionType: PromotionType;
  targetCategory?: string;
  startDate: string;
  endDate: string;
  budgetBid?: number;
  bannerAssetUrl?: string;
  headline?: string;
  subheadline?: string;
  status: PromotionStatus;
  priority?: number;
  isActive?: boolean;
  reviewedBy?: string;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SponsoredApp {
  id: string;
  appId: string;
  appName: string;
  developerUid: string;
  promotionRequestId?: string;
  priority?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface CategorySpotlight {
  id: string;
  categoryId: string;
  appId: string;
  appName: string;
  developerUid: string;
  tagline?: string;
  bannerUrl?: string;
  priority?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface AppVersionDoc {
  id: string;
  appId: string;
  version: string;
  versionCode: number;
  downloadUrl: string;
  sizeMb: number;
  checksumSha256: string;
  releaseNotes: string;
  releaseDate: string;
  isMinimumSupported?: boolean;
}

export interface WishlistItem {
  id: string;
  userId: string;
  appId: string;
  addedAt: string;
}

export interface StoreSettings {
  id: string;
  maintenanceMode: boolean;
  featuredAppIds: string[];
  trendingAppIds: string[];
  bannerNotice?: string;
  minSupportedAppVersion?: string;
}

export type NotificationType = 'SECURITY' | 'PROMOTION' | 'SYSTEM' | 'UPDATE' | 'VERIFICATION' | 'TOKEN_GENERATED' | 'DRAFT_SAVED' | 'DRAFT_RESUMED';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: NotificationType | string;
  deepLinkAppId?: string;
  userId?: string;
  category?: string;
}

export type DownloadStatus = 'PREPARING' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'VERIFYING' | 'INSTALLED';

export interface DownloadTask {
  appId: string;
  appName: string;
  iconUrl: string;
  progress: number; // 0 to 100
  speed: string; // e.g., '12.4 MB/s' or '340 KB/s'
  status: DownloadStatus;
  totalSize: string;
  downloadedBytes: number;
  totalBytes: number;
  remainingTime?: string; // e.g., '14s left'
  downloadUrl?: string;
  errorReason?: string;
  startedAt?: number;
}

export type UserRole = 'USER' | 'DEVELOPER' | 'VERIFIED_DEVELOPER' | 'STUDENT' | 'VERIFIED_STUDENT' | 'ADMIN';
export type VerificationStatus = 'PENDING_REVIEW' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUEST_INFO' | 'SUSPENDED';
export type DeveloperStatus = 'NONE' | 'PENDING' | 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'REQUEST_INFO' | 'SUSPENDED';
export type StudentStatus = 'NONE' | 'PENDING' | 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'REQUEST_INFO';
export type AdminStatus = 'NONE' | 'ACTIVE' | 'SUSPENDED';
export type VerificationBadge = 'NONE' | 'VERIFIED' | 'VERIFIED_DEVELOPER' | 'VERIFIED_STUDENT' | 'ADMIN' | 'OFFICIAL';

// AVANYX Store v3.7.0 Production Billing API Types
export type BillingProductType = 'IN_APP' | 'SUBSCRIPTION';
export type BillingProductStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type BillingPurchaseStatus = 'SUCCESS' | 'PENDING_VERIFICATION' | 'FAILED' | 'CANCELLED';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_VERIFICATION';

export interface BillingProduct {
  id: string; // doc id = immutable productId
  productId: string; // permanent immutable identifier (e.g. 'premium_remove_ads')
  name: string;
  description: string;
  type: BillingProductType;
  price: number; // Final price in INR ₹
  originalPrice?: number;
  discountPercent?: number;
  billingPeriod?: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'LIFETIME';
  appId: string;
  appName: string;
  developerUid: string;
  developerName?: string;
  iconUrl?: string;
  features?: string[];
  status: BillingProductStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface BillingPurchase {
  id: string;
  purchaseToken: string; // Unique token (e.g. 'AVX-PUR-2026-ABC123')
  productId: string;
  productName: string;
  productType: BillingProductType;
  appId: string;
  appName: string;
  appIconUrl?: string;
  developerUid: string;
  developerName?: string;
  userUid: string;
  userEmail?: string;
  userName?: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponUsed?: string;
  paymentStatus: BillingPurchaseStatus;
  utr: string; // 12-digit transaction UTR
  paymentScreenshotUrl: string;
  upiId: string;
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  clientCallbackUrl?: string;
  verificationNotes?: string;
}

export interface BillingSubscription {
  id: string; // subscriptionId
  subscriptionId: string;
  planId: string;
  productId: string;
  productName: string;
  appId: string;
  appName: string;
  developerUid: string;
  userUid: string;
  userEmail?: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  autoRenew: boolean;
  nextBillingDate: string;
  lastPurchaseToken: string;
  amount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BillingNotification {
  id: string;
  userUid: string;
  userId?: string;
  purchaseToken: string;
  productId: string;
  productName?: string;
  appId?: string;
  status: BillingPurchaseStatus;
  type: 'PURCHASE' | 'SUBSCRIPTION' | 'REFUND' | 'SYSTEM';
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface BillingCallbackResponse {
  status: BillingPurchaseStatus;
  productId: string;
  purchaseToken: string;
  amount?: number;
  timestamp?: string;
  message?: string;
}

export type UpiIntentApp = 'GENERIC' | 'PHONEPE' | 'GPAY' | 'PAYTM' | 'BHIM';

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REJECTED';
export type PayoutMethod = 'UPI' | 'BANK_TRANSFER';

export interface DeveloperPayout {
  id: string; // payoutId (e.g. 'PAYOUT-2026-XXXX')
  payoutId: string;
  developerUid: string;
  developerName: string;
  developerEmail?: string;
  creatorType?: 'DEVELOPER' | 'STUDENT';
  amount: number; // Requested amount in INR ₹
  payoutMethod: PayoutMethod;
  upiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  accountHolderName?: string;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  transactionRef?: string; // UTR or Bank Reference
  paymentReceiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Single Dynamic UPI Source (payment_settings/global)
export interface GlobalPaymentSettings {
  id?: string;
  upiId: string;
  accountName: string;
  qrBase?: string;
  enabled: boolean;
  paymentTypes: {
    DEVELOPER_VERIFICATION: number;
    STUDENT_VERIFICATION: number;
    BANNER_PROMOTION: number;
    FEATURED_APP_PROMOTION: number;
    CATEGORY_SPOTLIGHT_PROMOTION: number;
    STORE_ADVERTISEMENT_PROMOTION: number;
    IN_APP_DEFAULT: number;
    SUBSCRIPTION_DEFAULT: number;
    [key: string]: number;
  };
  updatedAt?: any;
  updatedBy?: string;
}

// Creator API Key for API Center (developer_api_keys, student_api_keys)
export interface CreatorApiKey {
  id: string; // creatorUid
  creatorUid: string;
  creatorName: string;
  creatorType: 'DEVELOPER' | 'STUDENT';
  apiKey: string; // 'avx_live_sk_...'
  projectId: string; // 'avx-proj-...'
  sdkStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  billingStatus: 'ACTIVE' | 'RESTRICTED' | 'UNLINKED';
  purchaseCallbackUrl?: string;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastRotatedAt?: string;
}

// Student Stage 2: Guardian/Teacher Verified
export interface StudentStage2Verification {
  verifierType: 'GUARDIAN' | 'CLASS_TEACHER';
  relationship: 'PARENT' | 'GUARDIAN' | 'CLASS_TEACHER' | 'HOD' | 'MENTOR';
  verifierName: string;
  verifierContact: string;
  teacherIdOrParentId: string;
  verifierSelfieUrl: string;
  consentAccepted: boolean;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

export interface DeveloperPayoutSetting {
  id: string; // developerUid
  developerUid: string;
  payoutMethod: PayoutMethod;
  upiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  accountHolderName?: string;
  phone?: string;
  panNumber?: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string; // planId
  planId: string;
  productId: string;
  name: string;
  appId: string;
  appName: string;
  developerUid: string;
  price: number;
  billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';
  trialDays?: number;
  features: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface BillingPurchaseRequest {
  productId: string;
  price?: number;
  type?: BillingProductType;
  appId?: string;
  appName?: string;
  productName?: string;
  description?: string;
  iconUrl?: string;
  developerUid?: string;
  developerName?: string;
  features?: string[];
  couponCode?: string;
  clientCallbackUrl?: string;
  onCallback?: (response: BillingCallbackResponse) => void;
}

// AVANYX Store v3.6 Production Payment Center Types
export type PaymentType =
  | 'DEVELOPER_VERIFICATION'
  | 'STUDENT_VERIFICATION'
  | 'BANNER_PROMOTION'
  | 'FEATURED_APP_PROMOTION'
  | 'CATEGORY_SPOTLIGHT_PROMOTION'
  | 'STORE_ADVERTISEMENT_PROMOTION';

export type PaymentStatus =
  | 'DRAFT'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REQUEST_PROOF';

export interface PaymentSetting {
  id: string; // paymentType as doc id (e.g. 'DEVELOPER_VERIFICATION')
  paymentType: PaymentType;
  title: string;
  description: string;
  upiId: string;
  qrImageUrl: string;
  amount: number;
  accountName: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export interface CouponCode {
  id: string; // couponCode (e.g. 'AVXLAUNCH200')
  code: string;
  discountAmount: number; // max ₹200
  description: string;
  validUntil: string; // ISO date '2027-12-31T23:59:59.999Z'
  enabled: boolean;
  usedCount?: number;
  currentUses?: number;
  maxUses?: number;
  developerOnly?: boolean;
  minimumAmount?: number;
  usedBy?: string[]; // developer user IDs
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  applicantName: string;
  studioOrSchool: string;
  verificationType: 'DEVELOPER' | 'STUDENT' | 'PROMOTION';
  paymentType: PaymentType;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  amount?: number;
  amountPaid?: number;
  couponUsed?: string;
  couponCode?: string;
  upiId: string;
  accountName?: string;
  utr: string; // 12-digit transaction ID (Required, unique)
  transactionId?: string;
  paymentScreenshotUrl: string; // Required
  applicationToken: string;
  status: PaymentStatus;
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  timestamp: string; // ISO
  createdAt?: any;
  updatedAt?: any;
  metadataChecksum?: string;
}

export interface PaymentAnalyticsSummary {
  totalRevenue: number;
  developerRevenue: number;
  studentRevenue: number;
  promotionRevenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  verifiedPaymentsCount: number;
  rejectedPaymentsCount: number;
  requestProofCount: number;
  couponsUsedCount: number;
  totalDiscountsGiven: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  totalTransactionsCount: number;
}

export interface DeveloperDetails {
  status?: DeveloperStatus | string;
  caseId?: string;
  applicationToken?: string;
  developerName?: string;
  displayName?: string;
  fullLegalName?: string;
  organizationName?: string;
  dob?: string;
  country?: string;
  state?: string;
  contactEmail?: string;
  supportEmail?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  verifiedPhone?: string;
  phoneVerifiedAt?: string;
  phoneVerificationDeferred?: boolean;
  phoneVerificationStatus?: string;
  websiteUrl?: string;
  githubUrl?: string;
  description?: string;
  profileLogoUrl?: string;
  bannerUrl?: string;
  aadhaarMasked?: string;
  aadhaarFrontUrl?: string;
  liveSelfieUrl?: string;
  panNumber?: string;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  contentPolicyAccepted?: boolean;
  appDistributionAccepted?: boolean;
  acceptedVersion?: string;
  acceptedTimestamp?: string;
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  confirmOwnership?: boolean;
  documentUrls?: string[];
  requestedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByAdminUid?: string;
  reviewerNotes?: string;
  notes?: string;
}

export interface StudentDetails {
  status?: StudentStatus | string;
  caseId?: string;
  applicationToken?: string;
  studentName?: string;
  fullName?: string;
  dob?: string;
  aadhaarMasked?: string;
  aadhaarFrontUrl?: string;
  marksheetUrl?: string;
  schoolName?: string;
  institutionName?: string;
  institution?: string;
  board?: 'UP Board' | 'CBSE' | 'ICSE' | 'Other' | string;
  boardOther?: string;
  passingYear?: string;
  studentIdNumber?: string;
  graduationYear?: string;
  major?: string;
  fieldOfStudy?: string;
  documentUrl?: string;
  documentUrls?: string[];
  country?: string;
  contactEmail?: string;
  studentEmail?: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  verifiedPhone?: string;
  phoneVerifiedAt?: string;
  phoneVerificationDeferred?: boolean;
  phoneVerificationStatus?: string;
  bio?: string;
  isUnder18?: boolean;
  canMonetize?: boolean;
  agreeTerms?: boolean;
  confirm10thPass?: boolean;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  contentPolicyAccepted?: boolean;
  studentAgreementAccepted?: boolean;
  acceptedVersion?: string;
  acceptedTimestamp?: string;
  badge?: string;
  requestedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByAdminUid?: string;
  reviewerNotes?: string;
  notes?: string;
}

export interface DeveloperApplication {
  id: string;
  caseId?: string;
  applicationId: string;
  applicationToken?: string;
  applicantUid: string;
  applicantEmail: string;
  displayName: string;
  developerName: string;
  fullLegalName?: string;
  organizationName?: string;
  dob?: string;
  country: string;
  state?: string;
  contactEmail: string;
  supportEmail?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  websiteUrl?: string;
  githubUrl?: string;
  description: string;
  profileLogoUrl?: string;
  bannerUrl?: string;
  aadhaarMasked?: string;
  aadhaarFrontUrl?: string;
  liveSelfieUrl?: string;
  panNumber?: string;
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  confirmOwnership?: boolean;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  contentPolicyAccepted?: boolean;
  appDistributionAccepted?: boolean;
  acceptedVersion?: string;
  acceptedTimestamp?: string;
  requestedRole: UserRole;
  submittedAt: string;
  updatedAt: string;
  status: VerificationStatus;
  paymentStatus?: 'PENDING_PAYMENT' | 'PAID_PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  transactionId?: string;
  couponCode?: string;
  amountPaid?: number;
  paidAt?: string;
  paymentScreenshotUrl?: string;
  documentUrls?: string[];
  notes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByAdminUid?: string;
  reviewerNotes?: string;
  moderationHistory?: Array<{
    action: string;
    adminUid: string;
    timestamp: string;
    note?: string;
    previousStatus?: string;
    newStatus?: string;
  }>;
  // Legacy aliases
  userId?: string;
  email?: string;
  createdAt?: string;
}

export interface StudentVerificationRequest {
  id: string;
  caseId?: string;
  requestId: string;
  applicationId?: string;
  applicationToken?: string;
  applicantUid: string;
  applicantEmail: string;
  displayName: string;
  studentName: string;
  fullName?: string;
  dob?: string;
  aadhaarMasked?: string;
  aadhaarFrontUrl?: string;
  marksheetUrl?: string;
  schoolName?: string;
  institution: string;
  institutionName?: string;
  board?: 'UP Board' | 'CBSE' | 'ICSE' | 'Other' | string;
  boardOther?: string;
  passingYear?: string;
  studentIdNumber?: string;
  graduationYear?: string;
  documentUrl?: string;
  documentUrls?: string[];
  contactEmail?: string;
  studentEmail?: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  bio?: string;
  isUnder18?: boolean;
  canMonetize?: boolean;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  contentPolicyAccepted?: boolean;
  studentAgreementAccepted?: boolean;
  acceptedVersion?: string;
  acceptedTimestamp?: string;
  country?: string;
  requestedRole: UserRole;
  submittedAt: string;
  updatedAt: string;
  status: VerificationStatus;
  paymentStatus?: 'PENDING_PAYMENT' | 'PAID_PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  transactionId?: string;
  couponCode?: string;
  amountPaid?: number;
  paidAt?: string;
  paymentScreenshotUrl?: string;
  notes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByAdminUid?: string;
  reviewerNotes?: string;
  moderationHistory?: Array<{
    action: string;
    adminUid: string;
    timestamp: string;
    note?: string;
    previousStatus?: string;
    newStatus?: string;
  }>;
  // Legacy aliases
  userId?: string;
  createdAt?: string;
}

export interface DeveloperRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  fullLegalName?: string;
  organizationName: string;
  dob?: string;
  country?: string;
  state?: string;
  websiteUrl: string;
  githubUrl: string;
  supportEmail?: string;
  emailVerified?: boolean;
  description?: string;
  profileLogoUrl?: string;
  bannerUrl?: string;
  aadhaarMasked?: string;
  panNumber?: string;
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  confirmOwnership?: boolean;
  status: VerificationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
}

export interface StudentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  fullName?: string;
  dob?: string;
  aadhaarMasked?: string;
  institutionName: string;
  board?: string;
  boardOther?: string;
  passingYear?: string;
  studentIdNumber: string;
  graduationYear: string;
  documentUrl?: string;
  studentEmail?: string;
  emailVerified?: boolean;
  bio?: string;
  isUnder18?: boolean;
  canMonetize?: boolean;
  status: VerificationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
}

export interface VerificationRequest {
  id: string;
  caseId?: string;
  applicationId: string;
  requestId?: string;
  type: 'DEVELOPER' | 'STUDENT';
  applicantUid: string;
  applicantEmail: string;
  displayName: string;
  requestedRole: UserRole;
  status: VerificationStatus;
  paymentStatus?: 'PENDING_PAYMENT' | 'PAID_PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  transactionId?: string;
  couponCode?: string;
  amountPaid?: number;
  paidAt?: string;
  paymentScreenshotUrl?: string;
  submittedAt: string;
  updatedAt?: string;
  developerDetails?: DeveloperDetails;
  studentDetails?: StudentDetails;
  documentUrls?: string[];
  aadhaarMasked?: string;
  aadhaarFrontUrl?: string;
  liveSelfieUrl?: string;
  marksheetUrl?: string;
  emailVerified?: boolean;
  schoolName?: string;
  notes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByAdminUid?: string;
  reviewerNotes?: string;
  moderationHistory?: Array<{
    action: string;
    adminUid: string;
    timestamp: string;
    note?: string;
    previousStatus?: string;
    newStatus?: string;
  }>;
  // Legacy compatibility fields
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminUid?: string;
  adminId?: string | null;
  adminEmail?: string;
  performedBy?: string;
  action: string;
  targetId?: string;
  targetUserId?: string;
  targetName?: string;
  userId?: string;
  applicationToken?: string;
  verificationType?: string;
  details: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  verifiedPhone?: string;
  phoneVerifiedAt?: string;
  organizationName?: string;
  role: UserRole;
  realRole: UserRole; // Authoritative role verified by backend / Firestore
  activeViewRole?: UserRole; // Role view mode for Admin view-switching
  avatarUrl: string;
  avatar?: string;
  bio?: string;
  websiteUrl?: string;
  country?: string;
  verifiedDeveloper: boolean;
  developerStatus: DeveloperStatus;
  studentStatus: StudentStatus;
  studentStage2Verified?: boolean;
  studentStage2?: StudentStage2Verification;
  adminStatus: AdminStatus;
  verificationBadge: VerificationBadge;
  developerDetails?: DeveloperDetails;
  studentDetails?: StudentDetails;
  developerKey?: string;
  emailVerified?: boolean;
  authProvider?: string;
  status?: string;
  securityScore?: number;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type NavigationTab =
  | 'INTRO'
  | 'HOME'
  | 'GAMES'
  | 'APPS'
  | 'DOWNLOADS'
  | 'SECURITY_ALERTS'
  | 'DEV_CONSOLE'
  | 'DEVELOPER_APPLY'
  | 'STUDENT_CONSOLE'
  | 'STUDENT_APPLY'
  | 'ADMIN_CONSOLE'
  | 'GMAIL'
  | 'SETTINGS'
  | 'ACCOUNT_SETTINGS'
  | 'NOTIFICATIONS'
  | 'PROFILE'
  | 'APP_DETAILS'
  | 'DEVELOPER_PROFILE'
  | 'LOGIN'
  | 'SIGNUP'
  | 'ACCOUNT'
  | 'ADMIN_OAUTH'
  | 'PURCHASE_HISTORY'
  | 'REWARDS_CENTER'
  | 'IDENTITY';

// AVANYX Store v3.7.2 Commission Settings
export interface CommissionSettings {
  id: string; // 'global'
  appSaleCommission: number; // default 10%
  inAppCommission: number; // default 10%
  subscriptionCommission: number; // default 10%
  promotionCommission: number; // default 5%
  updatedAt: string;
  updatedBy?: string;
}

// AVANYX Store v3.7.2 Download Analytics
export type DownloadAnalyticsEventType =
  | 'DOWNLOAD_START'
  | 'DOWNLOAD_COMPLETE'
  | 'INSTALL'
  | 'UPDATE'
  | 'DOWNLOAD_FAILED';

export interface DownloadAnalyticsEvent {
  id?: string;
  appId: string;
  appName: string;
  developerUid: string;
  userId?: string;
  eventType: DownloadAnalyticsEventType;
  downloadSpeedKbps?: number;
  downloadSpeedFormatted?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  country: string;
  androidVersion?: string;
  browser?: string;
  platform?: string;
  errorReason?: string;
  timestamp: string;
}

// AVANYX Store v3.7.2 Rewards Center (No Wallet)
export type RewardTier = 'STUDENT_CREATOR' | 'EXPLORER' | 'PRO_DEVELOPER' | 'TOP_BUILDER';

export interface RewardAccount {
  id?: string;
  userId: string;
  points: number;
  tier: RewardTier;
  totalEarned: number;
  updatedAt: string;
}

export type RewardType =
  | 'FESTIVAL_REWARD'
  | 'REFERRAL_REWARD'
  | 'DOWNLOAD_REWARD'
  | 'DEVELOPER_REWARD'
  | 'COUPON_CLAIM';

export interface RewardHistoryItem {
  id: string;
  userId: string;
  rewardType: RewardType;
  amount: number;
  title: string;
  description: string;
  timestamp: string;
  claimed: boolean;
  metadata?: any;
}

export interface UserCoupon {
  id: string;
  userId: string;
  couponCode: string;
  discountPercent?: number;
  discountAmount?: number;
  title: string;
  category: 'ALL' | 'IN_APP' | 'PAID_APP' | 'PROMOTION';
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  minSpend?: number;
}

// AVANYX Store v3.7.2 Billing Popup Audit Log
export interface BillingAuditStep {
  completed: boolean;
  timestamp?: string;
  details?: string;
}

export interface BillingAuditLog {
  id: string;
  auditId: string;
  purchaseToken?: string;
  productId: string;
  productName?: string;
  appId?: string;
  userUid?: string;
  timestamp: string;
  steps: {
    popupOpened: BillingAuditStep;
    upiIntentLaunched: BillingAuditStep;
    qrLoaded: BillingAuditStep;
    purchaseRecordCreated: BillingAuditStep;
    notificationDelivered: BillingAuditStep;
  };
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  failureReason?: string;
  deviceInfo?: string;
}


