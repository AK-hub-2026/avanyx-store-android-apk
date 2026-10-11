import React, { useState, useRef } from 'react';
import { AppCategory, User, AppType } from '../../types';
import {
  UploadCloud,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Image as ImageIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Lock,
  RefreshCw
} from 'lucide-react';
import { uploadMediaToSupabase, SUPABASE_BUCKETS, SupabaseBucketName } from '../../services/supabaseStorage';
import { submitAppForReview, isPrimaryAdminEmail } from '../../services/firestoreService';
import {
  runAiVerificationPipeline,
  AiVerificationReport,
  validatePackageNameFormat
} from '../../services/aiVerificationPipeline';
import { LegalAgreementModal, LegalDocType } from '../verification/LegalAgreementModal';

interface SubmitAppTabProps {
  user: User;
  activeUid: string;
  onSuccessPublished: () => void;
}

const COMMON_ANDROID_PERMISSIONS = [
  { id: 'android.permission.INTERNET', label: 'Internet Access (INTERNET)', desc: 'Allows app to open network sockets' },
  { id: 'android.permission.ACCESS_NETWORK_STATE', label: 'Network State (ACCESS_NETWORK_STATE)', desc: 'Allows app to view connection status' },
  { id: 'android.permission.POST_NOTIFICATIONS', label: 'Notifications (POST_NOTIFICATIONS)', desc: 'Allows sending system push notifications' },
  { id: 'android.permission.CAMERA', label: 'Camera Access (CAMERA)', desc: 'Required for capturing images or video' },
  { id: 'android.permission.READ_EXTERNAL_STORAGE', label: 'Read Storage (READ_EXTERNAL_STORAGE)', desc: 'Allows reading files and media' },
  { id: 'android.permission.WRITE_EXTERNAL_STORAGE', label: 'Write Storage (WRITE_EXTERNAL_STORAGE)', desc: 'Allows saving files to disk' },
  { id: 'android.permission.ACCESS_FINE_LOCATION', label: 'GPS Location (ACCESS_FINE_LOCATION)', desc: 'Precise device GPS coordinates' },
  { id: 'android.permission.RECORD_AUDIO', label: 'Microphone (RECORD_AUDIO)', desc: 'Allows recording audio input' },
  { id: 'android.permission.VIBRATE', label: 'Vibrate (VIBRATE)', desc: 'Allows haptic feedback' },
  { id: 'android.permission.WAKE_LOCK', label: 'Wake Lock (WAKE_LOCK)', desc: 'Prevents screen from sleeping' },
  { id: 'android.permission.BLUETOOTH', label: 'Bluetooth (BLUETOOTH)', desc: 'Allows device pairing and peripherals' }
];

export const SubmitAppTab: React.FC<SubmitAppTabProps> = ({
  user,
  activeUid,
  onSuccessPublished
}) => {
  const isAdmin = user.realRole === 'ADMIN' || isPrimaryAdminEmail(user.email || '');

  // Form State
  const [name, setName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [developerName, setDeveloperName] = useState(user.name || 'AVANYX Verified Developer');
  const [category, setCategory] = useState<AppCategory>('PRODUCTIVITY');
  const [version, setVersion] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState('1');
  const [apkSize, setApkSize] = useState('24.5');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sha256Checksum, setSha256Checksum] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [screenshotInputUrl, setScreenshotInputUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=800'
  ]);
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('Clean modern interface\nOptimized battery performance\nZero tracking privacy');
  const [changelog, setChangelog] = useState('Initial production release on Avanyx Store.');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.POST_NOTIFICATIONS'
  ]);
  const [tags, setTags] = useState('utility, tools, fast, secure');

  // Monetization & Student Under-18 Policy State
  const isStudentPublisher = user.role === 'STUDENT' || user.studentStatus === 'VERIFIED';
  const isVerifiedDeveloper = user.role === 'DEVELOPER' || user.developerStatus === 'VERIFIED' || user.verifiedDeveloper;
  const isUnder18Student = isStudentPublisher && !isVerifiedDeveloper;

  const [selectedAppType, setSelectedAppType] = useState<AppType>('FREE');
  const [appPrice, setAppPrice] = useState<string>('99.00');

  // Legal Compliance & Agreement (v3.4.2)
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
  const [termsConditionsUrl, setTermsConditionsUrl] = useState('');
  const [supportEmail, setSupportEmail] = useState(user.email || '');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contentRatingConfirmed, setContentRatingConfirmed] = useState(false);
  const [permissionDeclared, setPermissionDeclared] = useState(false);
  const [copyrightOwnershipDeclared, setCopyrightOwnershipDeclared] = useState(false);
  const [agreeAppSubmissionTerms, setAgreeAppSubmissionTerms] = useState(false);

  // Legal Modal
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocType>('APP_SUBMISSION_AGREEMENT');

  // Uploading / Submission State
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // AI Verification Pre-Flight State
  const [isPreFlightRunning, setIsPreFlightRunning] = useState(false);
  const [preFlightStage, setPreFlightStage] = useState<string>('IDLE');
  const [preFlightReport, setPreFlightReport] = useState<AiVerificationReport | null>(null);

  const handleRunPreFlight = async () => {
    if (!name.trim() || !packageName.trim()) {
      setSubmitError('Please enter at least an App Name and Package Name before running AI Verification.');
      return;
    }

    setSubmitError(null);
    setIsPreFlightRunning(true);
    setPreFlightStage('MANIFEST');

    try {
      const report = await runAiVerificationPipeline(
        {
          name,
          packageName,
          version,
          apkSizeMb: parseFloat(apkSize) || 24.5,
          downloadUrl,
          checksumSha256: sha256Checksum,
          permissions: selectedPermissions,
          screenshots,
          description: fullDescription || shortDescription,
          category
        },
        (stage) => setPreFlightStage(stage)
      );

      setPreFlightReport(report);
      if (!sha256Checksum.trim()) {
        setSha256Checksum(report.checksumSha256);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'AI verification pre-flight error.');
    } finally {
      setIsPreFlightRunning(false);
    }
  };

  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // File Upload Helper
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'ICON' | 'BANNER' | 'SCREENSHOT') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      let bucket: SupabaseBucketName = SUPABASE_BUCKETS.APP_ICONS;
      if (target === 'BANNER') bucket = SUPABASE_BUCKETS.APP_BANNERS;
      if (target === 'SCREENSHOT') bucket = SUPABASE_BUCKETS.APP_SCREENSHOTS;

      const result = await uploadMediaToSupabase(bucket, file, activeUid);
      const publicUrl = result.publicUrl;

      if (target === 'ICON') setIconUrl(publicUrl);
      if (target === 'BANNER') setBannerUrl(publicUrl);
      if (target === 'SCREENSHOT') {
        if (screenshots.length >= 8) {
          alert('Maximum 8 screenshots allowed.');
        } else {
          setScreenshots((prev) => [...prev, publicUrl]);
        }
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Error uploading file'}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddScreenshotUrl = () => {
    if (!screenshotInputUrl.trim()) return;
    if (screenshots.length >= 8) {
      alert('Maximum 8 screenshots allowed.');
      return;
    }
    setScreenshots((prev) => [...prev, screenshotInputUrl.trim()]);
    setScreenshotInputUrl('');
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveScreenshot = (index: number, direction: 'LEFT' | 'RIGHT') => {
    const newScreenshots = [...screenshots];
    const targetIndex = direction === 'LEFT' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newScreenshots.length) return;
    const temp = newScreenshots[index];
    newScreenshots[index] = newScreenshots[targetIndex];
    newScreenshots[targetIndex] = temp;
    setScreenshots(newScreenshots);
  };

  const handleGenerateChecksum = () => {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    setSha256Checksum(hash);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !packageName.trim() || !downloadUrl.trim()) {
      setSubmitError('App Name, Package Name, and Direct APK Download URL are required.');
      return;
    }

    if (screenshots.length < 3) {
      setSubmitError('A minimum of 3 screenshots are required for store publication.');
      return;
    }

    if (!privacyPolicyUrl.trim()) {
      setSubmitError('Privacy Policy URL is mandatory for app submission.');
      return;
    }

    if (!/^https?:\/\/.+/i.test(privacyPolicyUrl.trim())) {
      setSubmitError('Please enter a valid HTTP/HTTPS Privacy Policy URL.');
      return;
    }

    if (!supportEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim())) {
      setSubmitError('A valid Support Email is mandatory for app publication.');
      return;
    }

    if (!contentRatingConfirmed || !permissionDeclared || !copyrightOwnershipDeclared || !agreeAppSubmissionTerms) {
      setSubmitError('Please review and check all required legal declarations and agreements.');
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);

    try {
      const featuresList = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const tagsList = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const completionTime = new Date().toISOString();

      await submitAppForReview({
        name: name.trim(),
        packageName: packageName.trim(),
        developer: developerName.trim() || user.name,
        developerUid: activeUid,
        category: category,
        iconUrl: iconUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(packageName)}`,
        bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1024',
        screenshots: screenshots,
        videoUrl: videoUrl,
        sizeMb: parseFloat(apkSize) || 24.5,
        isGame: category === 'GAMES',
        downloadUrl: downloadUrl.trim(),
        checksumSha256: sha256Checksum.trim() || '',
        version: version.trim() || '1.0.0',
        versionCode: parseInt(versionCode, 10) || 1,
        changelog: changelog.trim(),
        fullDescription: fullDescription.trim() || shortDescription.trim(),
        features: featuresList,
        tags: tagsList,
        price: (!isUnder18Student && selectedAppType === 'PAID') ? (parseFloat(appPrice) || 99) : 0,
        appType: selectedAppType,
        directPublish: isAdmin,
        privacyPolicyUrl: privacyPolicyUrl.trim(),
        termsConditionsUrl: termsConditionsUrl.trim() || undefined,
        supportEmail: supportEmail.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        contentRatingConfirmed: true,
        permissionDeclared: true,
        copyrightOwnershipDeclared: true,
        termsAccepted: true,
        privacyAccepted: true,
        acceptedVersion: 'v3.4.2',
        acceptedTimestamp: completionTime
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        onSuccessPublished();
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Hidden File Inputs for Supabase Media Upload */}
      <input
        type="file"
        ref={iconInputRef}
        onChange={(e) => handleDirectUpload(e, 'ICON')}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={(e) => handleDirectUpload(e, 'BANNER')}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={screenshotInputRef}
        onChange={(e) => handleDirectUpload(e, 'SCREENSHOT')}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#9333EA]/20 border border-[#9333EA]/40 text-[#C084FC] flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              {isAdmin ? 'Administrator Application Publisher & Direct Release' : 'Submit New Application for Review'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isAdmin
                ? 'Admins bypass moderation and publish directly to the live store with verified status.'
                : 'Provide package details, graphics, and direct APK download URLs to publish on AVANYX Store.'}
            </p>
          </div>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Application successfully submitted! Redirecting to All Applications...</span>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. APP IDENTITY & CATEGORY */}
        {/* ========================================================================= */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#C084FC]">
            <Layers className="w-4 h-4" />
            <span>1. App Identity & Category</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                App Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AVANYX Store"
                className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Android Package Name *
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="e.g. com.avanyx.appstore.dev"
                className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Developer Studio Display Name *
              </label>
              <input
                type="text"
                value={developerName}
                onChange={(e) => setDeveloperName(e.target.value)}
                placeholder="e.g. AVANYX || ∞|| Alok king"
                className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Store Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AppCategory)}
                className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white focus:outline-none focus:border-[#9333EA]"
              >
                <option value="PRODUCTIVITY">Tools & Utilities / Productivity</option>
                <option value="GAMES">Games & Entertainment</option>
                <option value="SOCIAL">Social & Community</option>
                <option value="MEDIA">Media & Video</option>
                <option value="FINANCE">Finance & Business</option>
                <option value="EDUCATION">Education & Learning</option>
                <option value="AI_AGENTS">AI Agents & Intelligence</option>
                <option value="LIFESTYLE">Lifestyle & Health</option>
              </select>
            </div>
          </div>

          {/* Pricing & Monetization Model (Under-18 Student Rule enforced) */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <label className="block text-xs font-bold text-zinc-300">
              Monetization & Pricing Model *
            </label>

            {isUnder18Student && (
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-teal-300">
                    🎓 Student Publisher Policy (Under 18 Protection)
                  </p>
                  <p className="text-[11px] text-teal-100/80 leading-relaxed">
                    Student accounts under 18 can publish free applications only. Paid apps, subscriptions, and commercial payouts are disabled until you complete Developer Verification (18+).
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. FREE */}
              <button
                type="button"
                onClick={() => setSelectedAppType('FREE')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedAppType === 'FREE'
                    ? 'bg-purple-500/15 border-purple-500 text-white font-bold ring-1 ring-purple-500/50'
                    : 'bg-[#0F1015] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs">FREE</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">100% Free</span>
                </div>
                <p className="text-[11px] text-zinc-400">Available to all users without any payment.</p>
              </button>

              {/* 2. PAID */}
              <button
                type="button"
                disabled={isUnder18Student}
                onClick={() => {
                  if (!isUnder18Student) {
                    setSelectedAppType('PAID');
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isUnder18Student
                    ? 'opacity-40 cursor-not-allowed bg-[#0F1015] border-white/5 text-zinc-500'
                    : selectedAppType === 'PAID'
                    ? 'bg-purple-500/15 border-purple-500 text-white font-bold ring-1 ring-purple-500/50'
                    : 'bg-[#0F1015] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    {isUnder18Student && <Lock className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>PAID</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {isUnder18Student ? 'Locked (18+)' : 'Upfront Buy'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isUnder18Student ? 'Requires 18+ Verification.' : 'Opens AVANYX Billing before download.'}
                </p>
              </button>

              {/* 3. IN_APP_PURCHASE */}
              <button
                type="button"
                onClick={() => setSelectedAppType('IN_APP_PURCHASE')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedAppType === 'IN_APP_PURCHASE'
                    ? 'bg-purple-500/15 border-purple-500 text-white font-bold ring-1 ring-purple-500/50'
                    : 'bg-[#0F1015] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs">IN_APP_PURCHASE</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">In-App Store</span>
                </div>
                <p className="text-[11px] text-zinc-400">Free to download, sells digital items or upgrades.</p>
              </button>

              {/* 4. SUBSCRIPTION */}
              <button
                type="button"
                disabled={isUnder18Student}
                onClick={() => {
                  if (!isUnder18Student) {
                    setSelectedAppType('SUBSCRIPTION');
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isUnder18Student
                    ? 'opacity-40 cursor-not-allowed bg-[#0F1015] border-white/5 text-zinc-500'
                    : selectedAppType === 'SUBSCRIPTION'
                    ? 'bg-purple-500/15 border-purple-500 text-white font-bold ring-1 ring-purple-500/50'
                    : 'bg-[#0F1015] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    {isUnder18Student && <Lock className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>SUBSCRIPTION</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                    {isUnder18Student ? 'Locked (18+)' : 'Recurring'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isUnder18Student ? 'Requires 18+ Verification.' : 'Monthly or annual recurring plans.'}
                </p>
              </button>

              {/* 5. FREE_WITH_PREMIUM */}
              <button
                type="button"
                onClick={() => setSelectedAppType('FREE_WITH_PREMIUM')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedAppType === 'FREE_WITH_PREMIUM'
                    ? 'bg-purple-500/15 border-purple-500 text-white font-bold ring-1 ring-purple-500/50'
                    : 'bg-[#0F1015] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs">FREE_WITH_PREMIUM</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">Freemium</span>
                </div>
                <p className="text-[11px] text-zinc-400">Generous free tier with optional premium unlock.</p>
              </button>
            </div>

            {!isUnder18Student && selectedAppType === 'PAID' && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-300">Price (INR ₹):</span>
                <input
                  type="number"
                  step="1"
                  min="9"
                  max="9999"
                  value={appPrice}
                  onChange={(e) => setAppPrice(e.target.value)}
                  className="w-32 px-3 py-2 rounded-xl bg-[#0F1015] border border-white/10 text-xs text-white focus:outline-none focus:border-[#9333EA]"
                />
                <span className="text-xs text-zinc-400">Opens Billing SDK for ₹{appPrice} before install</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. APK BINARY & DISTRIBUTION (GITHUB RELEASES) */}
        {/* ========================================================================= */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#C084FC]">
            <FileCode className="w-4 h-4" />
            <span>2. APK Binary & Distribution (GitHub Releases)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Version (e.g. 1.0.0) *
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Version Code (e.g. 1) *
              </label>
              <input
                type="number"
                value={versionCode}
                onChange={(e) => setVersionCode(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Size in MB (e.g. 24.5) *
              </label>
              <input
                type="text"
                value={apkSize}
                onChange={(e) => setApkSize(e.target.value)}
                placeholder="24.5"
                className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              Direct GitHub Release APK Download URL *
            </label>
            <input
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://github.com/AK-hub-2026/avanyx-store-web/releases/download/v1.0.0/app-release.apk"
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-300">
                Authoritative SHA-256 Checksum
              </label>
              <button
                type="button"
                onClick={handleGenerateChecksum}
                className="text-[11px] font-bold text-[#C084FC] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate Checksum</span>
              </button>
            </div>
            <input
              type="text"
              value={sha256Checksum}
              onChange={(e) => setSha256Checksum(e.target.value)}
              placeholder="64-character hexadecimal SHA-256 hash string..."
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. VISUAL ASSETS & SCREENSHOTS */}
        {/* ========================================================================= */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#C084FC]">
            <ImageIcon className="w-4 h-4" />
            <span>3. Visual Assets & Screenshots</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* App Icon Upload */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-300">
                App Icon (512×512 PNG/WebP)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0F1015] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {iconUrl ? (
                    <img src={iconUrl} alt="App Icon" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="url"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="https://... or upload to Supabase"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                  />
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#C084FC]" />
                    <span>Upload Icon to Supabase</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Banner Upload */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-300">
                Feature Banner (1024×500 Graphic)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded-2xl bg-[#0F1015] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Feature Banner" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://... or upload banner"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#C084FC]" />
                    <span>Upload Banner to Supabase</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Screenshots Gallery Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-300">
                    Application Screenshots (Required: Min 3, Max 8) *
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      screenshots.length >= 3
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {screenshots.length} / 8 Uploaded {screenshots.length >= 3 ? '(Ready)' : '(Need min 3)'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Screenshots are mandatory for store publication. Upload PNG, JPG, or WebP images.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => screenshotInputRef.current?.click()}
                  disabled={screenshots.length >= 8 || isUploading}
                  className="px-4 py-2 rounded-xl bg-[#9333EA]/20 hover:bg-[#9333EA]/30 border border-[#9333EA]/40 text-[#C084FC] text-xs font-extrabold transition flex items-center gap-2 disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Screenshots (PNG/JPG/WebP)</span>
                </button>
              </div>
            </div>

            {/* URL input helper */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={screenshotInputUrl}
                onChange={(e) => setScreenshotInputUrl(e.target.value)}
                placeholder="Or paste screenshot image URL..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
              />
              <button
                type="button"
                onClick={handleAddScreenshotUrl}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition"
              >
                Add URL
              </button>
            </div>

            {/* Screenshot Grid Cards (Matching Screenshot 1) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {screenshots.map((sUrl, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl bg-[#0F1015] border border-white/10 overflow-hidden flex flex-col group hover:border-[#9333EA]/50 transition"
                >
                  {/* Top Badge: #1 Cover */}
                  <div className="absolute top-2 left-2 z-10">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide ${
                        idx === 0 ? 'bg-[#9333EA] text-white shadow-md' : 'bg-black/60 text-zinc-300'
                      }`}
                    >
                      {idx === 0 ? '#1 • Cover' : `#${idx + 1}`}
                    </span>
                  </div>

                  {/* Screenshot Thumbnail */}
                  <div className="aspect-[9/16] w-full bg-black/40 overflow-hidden">
                    <img
                      src={sUrl}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  {/* Bottom Controls (Move left, Move right, Delete) */}
                  <div className="p-2 bg-[#161722] border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveScreenshot(idx, 'LEFT')}
                        disabled={idx === 0}
                        className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center disabled:opacity-30"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveScreenshot(idx, 'RIGHT')}
                        disabled={idx === screenshots.length - 1}
                        className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center disabled:opacity-30"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(idx)}
                      className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition"
                      title="Remove screenshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. STORE LISTING COPY & PERMISSIONS */}
        {/* ========================================================================= */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#161722] border border-white/10 space-y-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#C084FC]">
            <FileCode className="w-4 h-4" />
            <span>4. Store Listing Copy</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              Full Application Description *
            </label>
            <textarea
              rows={4}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed description of features, compatibility, and core value..."
              className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Key Features (One per line)
              </label>
              <textarea
                rows={3}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="Clean modern interface&#10;Optimized battery performance&#10;Zero tracking privacy"
                className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Release Changelog / What's New
              </label>
              <textarea
                rows={3}
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Initial production release on Avanyx Store."
                className="w-full px-4 py-3 rounded-2xl bg-[#0F1015] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9333EA]"
              />
            </div>
          </div>

          {/* Android Permissions Selector */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <label className="block text-xs font-bold text-zinc-300">
              System Permissions Required
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {COMMON_ANDROID_PERMISSIONS.map((perm) => {
                const isSelected = selectedPermissions.includes(perm.id);
                return (
                  <div
                    key={perm.id}
                    onClick={() => togglePermission(perm.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#9333EA]/20 border-[#9333EA] text-white shadow-sm'
                        : 'bg-[#0F1015] border-white/5 text-zinc-400 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center ${
                          isSelected ? 'bg-[#9333EA] text-white' : 'border border-zinc-600'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span className="font-bold text-xs truncate">{perm.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4.5. AI VERIFICATION PIPELINE PRE-FLIGHT CHECK */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-3xl bg-[#141520] border border-white/10 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AI Verification Pipeline Pre-Flight</span>
              </div>
              <h3 className="text-base font-black text-white">Automated Policy & Binary Clearance</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Run our automated static scanner to verify package name syntax, permissions compliance, and Play Protect safety before final submission.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunPreFlight}
              disabled={isPreFlightRunning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {isPreFlightRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning ({preFlightStage})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Pre-Flight Check</span>
                </>
              )}
            </button>
          </div>

          {/* Pre-flight Report Display */}
          {preFlightReport && (
            <div className="p-4 rounded-2xl bg-[#0F1015] border border-emerald-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    AI Pipeline Verdict: {preFlightReport.overallVerdict === 'CLEARED' ? 'CLEARED FOR STORE' : 'PASSED WITH ADVISORY'}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-extrabold">
                  Score: {preFlightReport.overallScore}/100
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400">
                {preFlightReport.stages.map((st) => (
                  <div key={st.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">{st.name}</span>
                      <span className="text-[10px] text-zinc-400">{st.details[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. LEGAL COMPLIANCE & APP SUBMISSION AGREEMENT (v3.4.2) */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-3xl bg-[#141520] border border-white/10 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-purple-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>5. Legal Compliance & App Submission Agreement</span>
              </div>
              <h3 className="text-base font-black text-white">Policies, Support & Developer Declarations</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every application published to AVANYX Store must provide public privacy policies, support contacts, and legal declarations.
              </p>
            </div>
            <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 self-start sm:self-center">
              Required (v3.4.2)
            </span>
          </div>

          {/* Clickable Legal Docs Bar */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <span className="text-xs font-bold text-zinc-300 block">Review Official AVANYX Store Policies:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedLegalDoc('APP_SUBMISSION_AGREEMENT');
                  setIsLegalModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>App Submission Agreement</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLegalDoc('DEVELOPER_TERMS');
                  setIsLegalModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Developer Terms & Conditions</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLegalDoc('DEVELOPER_PRIVACY');
                  setIsLegalModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Developer Privacy Policy</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLegalDoc('CONTENT_POLICY');
                  setIsLegalModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Content & App Policy</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>
            </div>
          </div>

          {/* Legal URLs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between mb-1.5">
                <span>Privacy Policy URL *</span>
                <span className="text-[10px] text-purple-400 font-extrabold uppercase">Required</span>
              </label>
              <input
                type="url"
                required
                value={privacyPolicyUrl}
                onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                placeholder="https://example.com/privacy-policy"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-purple-500 transition"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Direct public URL detailing user data collection and storage.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between mb-1.5">
                <span>Support Email *</span>
                <span className="text-[10px] text-purple-400 font-extrabold uppercase">Required</span>
              </label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@yourdomain.com"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-purple-500 transition"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Official contact email displayed to store users for issue reporting.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between mb-1.5">
                <span>Terms & Conditions URL</span>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Recommended</span>
              </label>
              <input
                type="url"
                value={termsConditionsUrl}
                onChange={(e) => setTermsConditionsUrl(e.target.value)}
                placeholder="https://example.com/terms"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-purple-500 transition"
              />
              <p className="text-[10px] text-zinc-400 mt-1">End User License Agreement (EULA) or terms of service.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between mb-1.5">
                <span>Developer / Project Website URL</span>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Recommended</span>
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-purple-500 transition"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Official homepage or GitHub repository for the application.</p>
            </div>
          </div>

          {/* Declarations Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition">
              <input
                type="checkbox"
                required
                checked={contentRatingConfirmed}
                onChange={(e) => setContentRatingConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white">Content Rating Confirmation:</strong> I confirm this app contains no malware, hate speech, illegal material, unauthorized gambling, or predatory adware, and is accurately categorized.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition">
              <input
                type="checkbox"
                required
                checked={permissionDeclared}
                onChange={(e) => setPermissionDeclared(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white">Permission Declaration:</strong> I declare that all requested Android permissions ({selectedPermissions.length} selected) are strictly necessary for core application functionality and will not be misused for unauthorized tracking.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition">
              <input
                type="checkbox"
                required
                checked={copyrightOwnershipDeclared}
                onChange={(e) => setCopyrightOwnershipDeclared(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white">Copyright & Intellectual Property:</strong> I certify that I own or have legally licensed all code, branding, artwork, audio, and trademarks bundled within this application package.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition">
              <input
                type="checkbox"
                required
                checked={agreeAppSubmissionTerms}
                onChange={(e) => setAgreeAppSubmissionTerms(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-white leading-relaxed font-semibold">
                I have read and agree to the <strong className="text-purple-400">AVANYX App Submission Agreement</strong>, <strong className="text-purple-400">Developer Terms & Conditions</strong>, and <strong className="text-purple-400">Content & App Policy (v3.4.2)</strong>.
              </span>
            </label>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. SUBMIT ACTION BUTTON */}
        {/* ========================================================================= */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !privacyPolicyUrl.trim() ||
              !supportEmail.trim() ||
              !contentRatingConfirmed ||
              !permissionDeclared ||
              !copyrightOwnershipDeclared ||
              !agreeAppSubmissionTerms
            }
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#7E22CE] hover:from-[#A855F7] hover:to-[#9333EA] text-white font-black text-sm shadow-xl shadow-[#9333EA]/30 transition flex items-center gap-2.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="w-5 h-5" />
            <span>
              {isSubmitting
                ? 'Processing Application...'
                : isAdmin
                ? 'Publish App to Store Immediately'
                : 'Submit Application for Review'}
            </span>
          </button>
        </div>
      </form>

      {/* Legal Agreement Modal */}
      <LegalAgreementModal
        isOpen={isLegalModalOpen}
        initialDoc={selectedLegalDoc}
        onClose={() => setIsLegalModalOpen(false)}
        onAccept={() => {
          setAgreeAppSubmissionTerms(true);
          setContentRatingConfirmed(true);
          setPermissionDeclared(true);
          setCopyrightOwnershipDeclared(true);
        }}
      />
    </div>
  );
};
