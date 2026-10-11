import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  Copy,
  Check,
  Upload,
  Tag,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  Sparkles,
  Info,
  RefreshCw,
  Eye,
  FileCheck2
} from 'lucide-react';
import { uploadVerificationDocument } from '../../services/avanyxUploadService';
import {
  getPaymentSetting,
  validateCouponCode,
  checkDuplicateUtr,
  submitPaymentRecord,
  subscribeToGlobalPaymentSettings,
  generateDynamicUpiQr,
  DEFAULT_GLOBAL_PAYMENT_SETTINGS
} from '../../services/firestoreService';
import { PaymentSetting, PaymentType, PaymentStatus, GlobalPaymentSettings } from '../../types';

interface PaymentStepViewProps {
  type: 'DEVELOPER' | 'STUDENT';
  applicantName: string;
  applicationToken: string;
  userId: string;
  userEmail?: string;
  studioOrSchool?: string;
  onSubmitPayment: (paymentDetails: {
    paymentStatus: PaymentStatus;
    transactionId: string;
    couponCode?: string;
    amountPaid: number;
    originalAmount: number;
    discountAmount: number;
    paidAt: string;
    paymentScreenshotUrl: string;
    paymentRecordId?: string;
  }) => Promise<void>;
  onBackToForm: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export const PaymentStepView: React.FC<PaymentStepViewProps> = ({
  type,
  applicantName,
  applicationToken,
  userId,
  userEmail = '',
  studioOrSchool = '',
  onSubmitPayment,
  onBackToForm,
  isSubmitting = false,
  errorMessage = null
}) => {
  const paymentType: PaymentType =
    type === 'DEVELOPER' ? 'DEVELOPER_VERIFICATION' : 'STUDENT_VERIFICATION';

  // Dynamic Payment Settings from Firestore
  const [globalSetting, setGlobalSetting] = useState<GlobalPaymentSettings>(DEFAULT_GLOBAL_PAYMENT_SETTINGS);
  const [setting, setSetting] = useState<PaymentSetting | null>(null);
  const [isLoadingSetting, setIsLoadingSetting] = useState(true);

  // Coupon State (Developer Only)
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // UTR & Screenshot State (Both Required)
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch Payment Setting dynamically from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSetting(true);

    const unsubGlobal = subscribeToGlobalPaymentSettings((g) => {
      if (isMounted && g) setGlobalSetting(g);
    });

    getPaymentSetting(paymentType)
      .then((res) => {
        if (isMounted) {
          setSetting(res);
          setIsLoadingSetting(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load payment settings:', err);
        if (isMounted) setIsLoadingSetting(false);
      });

    return () => {
      isMounted = false;
      unsubGlobal();
    };
  }, [paymentType]);

  const baseFee = setting
    ? setting.amount
    : type === 'DEVELOPER'
    ? (globalSetting?.paymentTypes?.DEVELOPER_VERIFICATION || 1626)
    : (globalSetting?.paymentTypes?.STUDENT_VERIFICATION || 50);
  const upiId = globalSetting?.upiId || setting?.upiId || DEFAULT_GLOBAL_PAYMENT_SETTINGS.upiId;
  const accountName = globalSetting?.accountName || setting?.accountName || DEFAULT_GLOBAL_PAYMENT_SETTINGS.accountName;
  const finalAmount = Math.max(0, baseFee - couponDiscount);

  // Generate standard UPI QR URL from the single dynamic UPI source
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(applicationToken)}`;
  const qrDisplayUrl = generateDynamicUpiQr(
    upiId,
    accountName,
    finalAmount,
    applicationToken,
    globalSetting?.qrBase || setting?.qrImageUrl
  );

  const handleApplyCoupon = async () => {
    setCouponError(null);
    setCouponSuccess(null);
    const code = couponCodeInput.trim().toUpperCase();

    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    if (type === 'STUDENT') {
      setCouponError('Student publisher verification is fixed at ₹50. No coupons applicable.');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const res = await validateCouponCode(code, userId);
      if (res.valid) {
        setAppliedCoupon(res.code || code);
        setCouponDiscount(res.discountAmount);
        setCouponSuccess(`Coupon "${res.code || code}" applied! ₹${res.discountAmount} discount deducted.`);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError(res.error || 'Invalid or expired coupon code.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Error validating coupon code.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCodeInput('');
    setCouponSuccess(null);
    setCouponError(null);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setValidationError('Payment screenshot file must be under 10MB.');
      return;
    }

    setIsUploadingScreenshot(true);
    setValidationError(null);
    setUploadProgress(15);
    setScreenshotFileName(file.name);

    try {
      const metadata = await uploadVerificationDocument(
        file,
        userId,
        applicationToken,
        (prog) => setUploadProgress(prog)
      );
      setScreenshotUrl(metadata.publicUrl || metadata.storagePath);
    } catch (err: any) {
      setValidationError('Failed to upload screenshot. Please try again with a JPG, PNG, or WebP image.');
    } finally {
      setIsUploadingScreenshot(false);
      setUploadProgress(null);
    }
  };

  // Submit button remains strictly disabled until screenshot uploaded and UTR entered
  const isCleanTxIdValid = transactionId.trim().length >= 6;
  const isScreenshotUploaded = !!screenshotUrl.trim();
  const isSubmitDisabled =
    !isCleanTxIdValid ||
    !isScreenshotUploaded ||
    isSubmitting ||
    isUploadingScreenshot ||
    isLoadingSetting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanTxId = transactionId.trim().toUpperCase();
    if (!cleanTxId || cleanTxId.length < 6) {
      setValidationError('Please enter a valid 12-digit UPI UTR / Transaction ID.');
      return;
    }

    if (!screenshotUrl) {
      setValidationError('Payment screenshot upload is required. Please upload payment proof before proceeding.');
      return;
    }

    // Check duplicate UTR before submitting
    try {
      const dupCheck = await checkDuplicateUtr(cleanTxId);
      if (dupCheck.isDuplicate) {
        setValidationError(dupCheck.error || 'This UTR has already been used for another payment.');
        return;
      }
    } catch (dupErr) {
      console.warn('Duplicate UTR check warning:', dupErr);
    }

    // 1. Submit Payment Record to Firestore payments collection
    let paymentRecordId: string | undefined;
    try {
      const savedRecord = await submitPaymentRecord({
        userId,
        userEmail,
        userName: applicantName,
        applicantName,
        studioOrSchool: studioOrSchool || applicantName,
        verificationType: type,
        paymentType,
        originalAmount: baseFee,
        discountAmount: couponDiscount,
        finalAmount,
        couponUsed: appliedCoupon || '',
        upiId,
        accountName,
        utr: cleanTxId,
        paymentScreenshotUrl: screenshotUrl,
        applicationToken
      });
      paymentRecordId = savedRecord.id;
    } catch (payRecordErr: any) {
      console.warn('Payment record save notice:', payRecordErr);
      // If duplicate UTR error thrown, surface it clearly
      if (payRecordErr.message?.includes('Duplicate UTR')) {
        setValidationError(payRecordErr.message);
        return;
      }
    }

    // 2. Call parent onSubmitPayment with status 'PAYMENT_SUBMITTED'
    await onSubmitPayment({
      paymentStatus: 'PAYMENT_SUBMITTED',
      transactionId: cleanTxId,
      couponCode: appliedCoupon || '',
      originalAmount: baseFee,
      discountAmount: couponDiscount,
      amountPaid: finalAmount,
      paidAt: new Date().toISOString(),
      paymentScreenshotUrl: screenshotUrl,
      paymentRecordId
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Step Header */}
      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
        <button
          type="button"
          onClick={onBackToForm}
          className="flex items-center gap-1.5 text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Verification Form
        </button>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Step 2 of 2: Real UPI Payment Center</span>
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
            {type === 'DEVELOPER' ? 'Developer Verification Payment' : 'Student Publisher Fee'}
          </h2>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold">
            Token: {applicationToken}
          </span>
        </div>
        <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
          {type === 'DEVELOPER'
            ? 'Complete your one-time verification fee of ₹1,626 (or apply coupon) via real UPI to submit for Admin review.'
            : 'Subsidized one-time fee of ₹50 for 10th Pass Verified Student Publishers (No coupons applicable).'}
        </p>
      </div>

      {/* Fee Breakdown Card */}
      <div className="p-4 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] space-y-3 border border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between text-xs font-medium text-[#49454F] dark:text-[#CAC4D0]">
          <span>Standard Verification Fee ({type})</span>
          <span className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
            {isLoadingSetting ? 'Loading...' : `₹${baseFee}`}
          </span>
        </div>

        {appliedCoupon && (
          <div className="flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Coupon Discount ({appliedCoupon})
            </span>
            <span className="font-bold">-₹{couponDiscount}</span>
          </div>
        )}

        <div className="border-t border-black/10 dark:border-white/10 pt-2 flex items-center justify-between text-sm font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
          <span>Final Payable Amount</span>
          <span className="text-xl text-[#6750A4] dark:text-[#D0BCFF]">
            {isLoadingSetting ? '...' : `₹${finalAmount}`}
          </span>
        </div>
      </div>

      {/* Coupon Code Section (Developer Only) */}
      {type === 'DEVELOPER' && (
        <div className="space-y-2 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
          <label className="block text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#6750A4]" /> Developer Discount Coupon (Max ₹200)
            </span>
            <span className="text-[10px] text-zinc-500">1 use per developer • Valid till 31 Dec 2027</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              disabled={!!appliedCoupon || isValidatingCoupon}
              value={couponCodeInput}
              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. AVXLAUNCH200, AVXWELCOME200, AVXDEV2026"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121316] border border-black/10 dark:border-white/10 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#6750A4] disabled:opacity-60"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                disabled={isValidatingCoupon || !couponCodeInput.trim()}
                onClick={handleApplyCoupon}
                className="px-4 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#4F378B] text-white font-bold text-xs transition disabled:opacity-50"
              >
                {isValidatingCoupon ? 'Validating...' : 'Apply Coupon'}
              </button>
            )}
          </div>
          {couponSuccess && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {couponSuccess}
            </p>
          )}
          {couponError && (
            <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {couponError}
            </p>
          )}
        </div>
      )}

      {/* Student notice that coupon is not applicable */}
      {type === 'STUDENT' && (
        <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>Student verification fee is fixed at ₹50 (Heavily subsidized, no coupons applicable).</span>
        </div>
      )}

      {/* Dynamic UPI QR & Payment Transfer Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center border border-black/10 dark:border-white/10 rounded-2xl p-5">
        {/* Real UPI QR Display */}
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#121316] rounded-2xl shadow-inner border border-black/5 dark:border-white/5 space-y-3 text-center">
          <div className="p-2.5 rounded-2xl bg-white border border-[#6750A4]/20 shadow-md">
            <img
              src={qrDisplayUrl}
              alt="AVANYX Official UPI QR"
              className="w-44 h-44 object-contain rounded-xl"
              onError={(e) => {
                // Fallback to QR server if image fails
                (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntentUrl)}`;
              }}
            />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black text-[#1D1B20] dark:text-[#E6E1E5]">
              Scan to Pay ₹{finalAmount}
            </p>
            <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">
              PhonePe • Google Pay • Paytm • BHIM UPI
            </p>
          </div>
        </div>

        {/* Dynamic UPI ID Details */}
        <div className="space-y-3.5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#49454F] dark:text-[#CAC4D0] uppercase tracking-wider block">
              Official Store UPI ID (Dynamic)
            </span>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5">
              <code className="font-mono text-sm font-extrabold text-[#6750A4] dark:text-[#D0BCFF] flex-1">
                {upiId}
              </code>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1 text-xs text-[#49454F] dark:text-[#CAC4D0]">
            <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
              <span>Account Name:</span>
              <span className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">{accountName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
              <span>Application Token:</span>
              <span className="font-mono font-bold text-[#6750A4] dark:text-[#D0BCFF]">{applicationToken}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Payable Amount:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{finalAmount}</span>
            </div>
          </div>

          <div className="text-xs text-[#49454F] dark:text-[#CAC4D0] space-y-1 bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-2xl">
            <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 text-[11px]">
              <Info className="w-3.5 h-3.5" /> Transfer Instructions
            </span>
            <p className="text-[10px] leading-relaxed">
              1. Transfer <strong>₹{finalAmount}</strong> using any UPI app.<br />
              2. Note the 12-digit UTR number from your payment receipt.<br />
              3. Take a screenshot of the completed transaction and upload below.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction ID & Screenshot Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-black">Submission Error</span>
              <p className="font-mono text-[11px] whitespace-pre-wrap leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {validationError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* UTR / Transaction ID (Required) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center justify-between">
            <span>UPI Transaction ID / UTR Number <span className="text-rose-500">*</span></span>
            <span className="text-[10px] text-zinc-500">Found on UPI receipt (12 digits)</span>
          </label>
          <input
            type="text"
            required
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value.replace(/\s+/g, ''))}
            placeholder="e.g. 426819203912 or 425100987654"
            className="w-full px-4 py-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] border border-black/5 dark:border-white/5 text-xs font-mono font-bold text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
          />
          {transactionId && transactionId.trim().length < 6 && (
            <p className="text-[10px] text-amber-500 font-medium">UTR must be at least 6 characters (typically 12 digits).</p>
          )}
        </div>

        {/* Screenshot Upload (Strictly Required in v3.6) */}
        <div className="space-y-1.5 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
          <label className="block text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-[#6750A4]" /> Payment Screenshot Proof <span className="text-rose-500">*</span>
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Required</span>
          </label>
          <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
            Upload the clear screenshot showing payment status "Success", date, amount (₹{finalAmount}), and UTR number.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <label className="px-4 py-2.5 rounded-2xl bg-[#6750A4] hover:bg-[#4F378B] text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-2 transition shadow-sm">
              <Upload className="w-4 h-4" />
              <span>{screenshotUrl ? 'Change Screenshot' : 'Upload Payment Screenshot'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleScreenshotUpload}
                disabled={isUploadingScreenshot}
                className="hidden"
              />
            </label>

            {isUploadingScreenshot && (
              <span className="text-xs text-amber-500 font-bold flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading proof ({uploadProgress || 10}%)...
              </span>
            )}

            {screenshotUrl && !isUploadingScreenshot && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[200px]">{screenshotFileName || 'Screenshot Attached'}</span>
                <a
                  href={screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-[#6750A4] dark:text-[#D0BCFF] flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </a>
              </div>
            )}
          </div>
          {!screenshotUrl && !isUploadingScreenshot && (
            <p className="text-[10px] text-rose-500 font-bold">Screenshot proof is required to enable submission.</p>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 flex items-center justify-between border-t border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={onBackToForm}
            className="px-5 py-3 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            {isSubmitDisabled && !isSubmitting && (
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                {!isScreenshotUploaded ? 'Attach screenshot proof' : 'Enter UTR number'} to enable
              </span>
            )}

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-6 py-3 rounded-2xl bg-[#6750A4] hover:bg-[#4F378B] text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Payment Proof...</span>
                </span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Payment (₹{finalAmount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
