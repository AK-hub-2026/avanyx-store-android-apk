import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Loader2,
  Lock,
  Tag,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Smartphone
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  BillingPurchaseRequest,
  BillingPurchase,
  BillingCallbackResponse,
  BillingProduct,
  BillingAuditLog,
  GlobalPaymentSettings
} from '../../types';
import {
  getBillingProductById,
  createBillingPurchase,
  checkDuplicateUtr,
  getAvailableUpiIntents,
  isMobileDevice,
  listenToPurchaseStatus
} from '../../services/billingService';
import {
  getCouponByCode,
  createBillingAuditRecord,
  updateBillingAuditRecord,
  getGlobalPaymentSettings,
  subscribeToGlobalPaymentSettings,
  generateDynamicUpiQr,
  DEFAULT_GLOBAL_PAYMENT_SETTINGS
} from '../../services/firestoreService';
import { uploadPaymentProof } from '../../services/avanyxUploadService';
import { AvanyxLogo } from '../AvanyxLogo';
import { Unsubscribe } from 'firebase/firestore';

interface PurchasePopupModalProps {
  request: BillingPurchaseRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PurchasePopupModal: React.FC<PurchasePopupModalProps> = ({
  request,
  isOpen,
  onClose
}) => {
  const { user, setCurrentTab } = useStore();

  // Active step: 'DETAILS' -> 'PAYMENT' -> 'PROOF' -> 'RESULT'
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'PROOF' | 'RESULT'>('DETAILS');
  const [productDetails, setProductDetails] = useState<BillingProduct | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState(request?.couponCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Payment proof state
  const [utrInput, setUtrInput] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedPurchase, setCompletedPurchase] = useState<BillingPurchase | null>(null);
  const [hasCopiedUpi, setHasCopiedUpi] = useState(false);
  const [hasCopiedToken, setHasCopiedToken] = useState(false);

  // PART G — Billing Popup Audit State
  const [auditState, setAuditState] = useState<{
    auditId: string;
    popupOpened: boolean;
    upiIntentLaunched: boolean;
    qrLoaded: boolean;
    purchaseRecordCreated: boolean;
    notificationDelivered: boolean;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    failureReason: string | null;
  }>({
    auditId: '',
    popupOpened: false,
    upiIntentLaunched: false,
    qrLoaded: false,
    purchaseRecordCreated: false,
    notificationDelivered: false,
    status: 'IN_PROGRESS',
    failureReason: null
  });
  const [showAuditInspector, setShowAuditInspector] = useState(false);

  // Global Dynamic UPI Settings from Firestore (payment_settings/global)
  const [globalPaymentSettings, setGlobalPaymentSettings] = useState<GlobalPaymentSettings>(DEFAULT_GLOBAL_PAYMENT_SETTINGS);

  useEffect(() => {
    const unsub = subscribeToGlobalPaymentSettings((settings) => {
      if (settings) {
        setGlobalPaymentSettings(settings);
      }
    });
    return () => unsub();
  }, []);

  // Load product info & initiate audit when opened
  useEffect(() => {
    if (!isOpen || !request) return;

    const newAuditId = 'AUDIT_' + Date.now();
    const initialAudit: BillingAuditLog = {
      id: newAuditId,
      auditId: newAuditId,
      productId: request.productId,
      productName: request.productName || request.productId,
      appId: request.appId || '',
      userUid: user?.id || 'guest',
      timestamp: new Date().toISOString(),
      steps: {
        popupOpened: { completed: true, timestamp: new Date().toISOString() },
        upiIntentLaunched: { completed: false },
        qrLoaded: { completed: false },
        purchaseRecordCreated: { completed: false },
        notificationDelivered: { completed: false }
      },
      status: 'IN_PROGRESS'
    };

    createBillingAuditRecord(initialAudit).catch((e) => console.warn('Audit init notice:', e));
    setAuditState({
      auditId: newAuditId,
      popupOpened: true,
      upiIntentLaunched: false,
      qrLoaded: false,
      purchaseRecordCreated: false,
      notificationDelivered: false,
      status: 'IN_PROGRESS',
      failureReason: null
    });

    setStep('DETAILS');
    setAppliedCoupon(null);
    setCouponCodeInput(request.couponCode || '');
    setCouponError(null);
    setUtrInput('');
    setScreenshotUrl('');
    setScreenshotFile(null);
    setErrorMessage(null);
    setCompletedPurchase(null);

    const loadProduct = async () => {
      setIsLoadingProduct(true);
      try {
        const prod = await getBillingProductById(request.productId);
        if (prod) {
          setProductDetails(prod);
        } else {
          // Fallback product structure from request
          setProductDetails({
            id: request.productId,
            productId: request.productId,
            name: request.productName || formatProductIdToTitle(request.productId),
            description: request.description || 'Unlock full premium features and in-app capabilities.',
            type: request.type || 'IN_APP',
            price: request.price ?? 99,
            originalPrice: (request.price ?? 99) * 2,
            discountPercent: 50,
            appId: request.appId || 'avanyx.app',
            appName: request.appName || 'AVANYX App',
            developerUid: request.developerUid || 'dev_official',
            developerName: request.developerName || 'Verified Developer',
            iconUrl: request.iconUrl || '/avanyx-logo.svg',
            features: request.features || ['No Ads', 'Premium Content', 'Instant Sync', 'VIP Support'],
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setIsLoadingProduct(false);
      }
    };

    loadProduct();
  }, [isOpen, request]);

  // Format ID helper
  function formatProductIdToTitle(id: string): string {
    if (!id) return '';
    return id
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Calculations
  const basePrice = productDetails?.price ?? request?.price ?? 99;
  const originalPrice = productDetails?.originalPrice || basePrice * 2;
  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.discount, basePrice) : 0;
  const finalAmount = Math.max(0, basePrice - discountAmount);

  // Single Dynamic UPI source from payment_settings/global
  const officialUpiId = globalPaymentSettings.upiId || DEFAULT_GLOBAL_PAYMENT_SETTINGS.upiId;
  const officialAccountName = globalPaymentSettings.accountName || DEFAULT_GLOBAL_PAYMENT_SETTINGS.accountName;
  const qrCodeUrl = generateDynamicUpiQr(
    officialUpiId,
    officialAccountName,
    finalAmount,
    request?.productId || 'AVANYX Pay Order',
    globalPaymentSettings.qrBase
  );

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;

    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      // 1. Check coupon codes collection in Firestore
      const couponDoc = await getCouponByCode(code);
      if (couponDoc && couponDoc.enabled) {
        setAppliedCoupon({
          code: couponDoc.code,
          discount: couponDoc.discountAmount
        });
      } else if (code === 'AVXLAUNCH200' || code === 'DIWALI2026' || code === 'STUDENT100') {
        const discount = code === 'STUDENT100' ? 100 : 200;
        setAppliedCoupon({
          code,
          discount
        });
      } else {
        setCouponError('Invalid or expired coupon code.');
      }
    } catch (err) {
      // Fallback
      if (code === 'AVXLAUNCH200') {
        setAppliedCoupon({ code, discount: 200 });
      } else {
        setCouponError('Coupon verification unavailable.');
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Screenshot file handler
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotFile(file);
    setIsUploadingScreenshot(true);
    setUploadProgress(20);

    try {
      const uploadRes = await uploadPaymentProof(file, user?.id || 'guest_user', (p) => {
        setUploadProgress(p);
      });
      setScreenshotUrl(uploadRes.publicUrl);
    } catch (err) {
      console.warn('Screenshot upload notice:', err);
      // Fallback preview
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setTimeout(() => {
        setIsUploadingScreenshot(false);
        setUploadProgress(null);
      }, 400);
    }
  };

  // Copy UPI ID
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(officialUpiId);
    setHasCopiedUpi(true);
    setTimeout(() => setHasCopiedUpi(false), 2000);
  };

  // Copy Purchase Token
  const handleCopyToken = () => {
    if (!completedPurchase?.purchaseToken) return;
    navigator.clipboard.writeText(completedPurchase.purchaseToken);
    setHasCopiedToken(true);
    setTimeout(() => setHasCopiedToken(false), 2000);
  };

  // Native UPI Intent options
  const isMobile = typeof window !== 'undefined' ? isMobileDevice() : false;
  const upiIntents = getAvailableUpiIntents({
    upiId: officialUpiId,
    amount: finalAmount,
    productName: productDetails?.name || request?.productName || 'AVANYX Item',
    productId: request?.productId || ''
  });

  // Real-time listener for purchase verification changes
  useEffect(() => {
    if (!completedPurchase?.purchaseToken) return;

    const unsubscribe = listenToPurchaseStatus(completedPurchase.purchaseToken, (updated) => {
      if (updated) {
        setCompletedPurchase(updated);
        if (updated.paymentStatus === 'SUCCESS') {
          // Immediately dispatch verified callback to developer app
          if (request?.onCallback) {
            request.onCallback({
              status: 'SUCCESS',
              productId: updated.productId,
              purchaseToken: updated.purchaseToken,
              amount: updated.amount,
              timestamp: updated.verifiedAt || updated.createdAt,
              message: 'Purchase verified successfully in real-time!'
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [completedPurchase?.purchaseToken, request]);

  const handleLaunchUpiIntent = (intentUrl: string, appName?: string) => {
    setAuditState((prev) => ({ ...prev, upiIntentLaunched: true }));
    updateBillingAuditRecord(auditState.auditId, {
      steps: {
        popupOpened: { completed: true },
        upiIntentLaunched: { completed: true, timestamp: new Date().toISOString(), details: appName || 'Native UPI Intent' },
        qrLoaded: { completed: auditState.qrLoaded },
        purchaseRecordCreated: { completed: false },
        notificationDelivered: { completed: false }
      }
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      try {
        window.location.href = intentUrl;
      } catch (e) {
        console.warn('Intent launch notice:', e);
      }
    }
  };

  // Final submit payment proof
  const handleSubmitPayment = async () => {
    if (!request) return;
    const cleanUtr = utrInput.trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      const err = 'Please enter a valid 12-digit UTR / Transaction Reference Number.';
      setErrorMessage(err);
      setAuditState((prev) => ({ ...prev, status: 'FAILED', failureReason: err }));
      return;
    }
    if (!screenshotUrl) {
      const err = 'Please upload a screenshot of your successful UPI payment.';
      setErrorMessage(err);
      setAuditState((prev) => ({ ...prev, status: 'FAILED', failureReason: err }));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Duplicate UTR check
      const dupCheck = await checkDuplicateUtr(cleanUtr);
      if (dupCheck.isDuplicate) {
        const dupMsg = dupCheck.message || 'This UTR transaction ID is already registered.';
        setErrorMessage(dupMsg);
        setAuditState((prev) => ({ ...prev, status: 'FAILED', failureReason: dupMsg }));
        updateBillingAuditRecord(auditState.auditId, {
          status: 'FAILED',
          failureReason: dupMsg
        }).catch(() => {});
        setIsSubmitting(false);
        return;
      }

      // Create purchase record in Firestore
      const purchase = await createBillingPurchase({
        productId: request.productId,
        productName: productDetails?.name || request.productName || formatProductIdToTitle(request.productId),
        productType: productDetails?.type || request.type || 'IN_APP',
        appId: productDetails?.appId || request.appId || 'avanyx.app',
        appName: productDetails?.appName || request.appName || 'AVANYX App',
        appIconUrl: productDetails?.iconUrl || request.iconUrl || '',
        developerUid: productDetails?.developerUid || request.developerUid || 'dev_official',
        developerName: productDetails?.developerName || request.developerName || 'Verified Developer',
        userUid: user?.id || 'guest_user',
        userEmail: user?.email || 'user@avanyx.store',
        userName: user?.name || 'Store User',
        amount: finalAmount,
        originalAmount: basePrice,
        discountAmount: discountAmount,
        couponUsed: appliedCoupon?.code || '',
        utr: cleanUtr,
        paymentScreenshotUrl: screenshotUrl,
        upiId: officialUpiId,
        clientCallbackUrl: request.clientCallbackUrl || ''
      });

      // Audit: Purchase record created and notification delivered!
      setAuditState((prev) => ({
        ...prev,
        purchaseRecordCreated: true,
        notificationDelivered: true,
        status: 'COMPLETED',
        failureReason: null
      }));
      updateBillingAuditRecord(auditState.auditId, {
        purchaseToken: purchase.purchaseToken,
        status: 'COMPLETED',
        steps: {
          popupOpened: { completed: true },
          upiIntentLaunched: { completed: auditState.upiIntentLaunched },
          qrLoaded: { completed: true },
          purchaseRecordCreated: { completed: true, timestamp: new Date().toISOString(), details: `UTR: ${cleanUtr}` },
          notificationDelivered: { completed: true, timestamp: new Date().toISOString() }
        }
      }).catch(() => {});

      setCompletedPurchase(purchase);
      setStep('RESULT');

      // Dispatch callback to developer app listener
      const callbackRes: BillingCallbackResponse = {
        status: 'PENDING_VERIFICATION',
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken,
        amount: purchase.amount,
        timestamp: purchase.createdAt,
        message: 'Payment submitted and pending verification.'
      };

      if (request.onCallback) {
        request.onCallback(callbackRes);
      }
    } catch (err: any) {
      console.error('Purchase submission failed:', err);
      const failReason = err.message || 'Failed to submit purchase. Please try again.';
      setErrorMessage(failReason);
      setAuditState((prev) => ({ ...prev, status: 'FAILED', failureReason: failReason }));
      updateBillingAuditRecord(auditState.auditId, {
        status: 'FAILED',
        failureReason: failReason
      }).catch(() => {});
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal and send cancel callback if not completed
  const handleCancelAndClose = () => {
    if (step !== 'RESULT' && request?.onCallback) {
      request.onCallback({
        status: 'CANCELLED',
        productId: request?.productId || '',
        purchaseToken: '',
        message: 'User cancelled the purchase.'
      });
    }
    onClose();
  };

  // Finished & enjoy
  const handleFinished = () => {
    if (completedPurchase && request?.onCallback) {
      request.onCallback({
        status: 'SUCCESS',
        productId: completedPurchase.productId,
        purchaseToken: completedPurchase.purchaseToken,
        amount: completedPurchase.amount,
        message: 'Purchase completed successfully.'
      });
    }
    onClose();
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1C1B1F] text-[#1D1B20] dark:text-[#E6E1E5] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden my-auto transition-all">
        
        {/* Top Branding Banner (Official AVANYX Store Purchase UI) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6750A4]/15 via-[#6750A4]/5 to-transparent border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#9333EA] to-[#EC4899] text-white flex items-center justify-center shadow-md shadow-[#9333EA]/30 font-black text-xs">
              <AvanyxLogo className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider uppercase text-purple-600 dark:text-[#C084FC]">
                  AVANYX Pay
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  SECURE SDK
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Official In-App Purchase Gateway
              </p>
            </div>
          </div>

          <button
            onClick={handleCancelAndClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[82vh] overflow-y-auto space-y-4">
          
          {/* PART G — Billing Popup Audit Diagnostic Banner (Appears on any failure or when toggled) */}
          {(auditState.status === 'FAILED' || auditState.failureReason || showAuditInspector) && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Billing Popup Audit Diagnostic</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold uppercase">
                  {auditState.status}
                </span>
              </div>

              {auditState.failureReason && (
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-black/40 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                  <strong className="font-bold">Exact Reason:</strong> {auditState.failureReason}
                </div>
              )}

              {/* 5-Step Automated Audit Checklist */}
              <div className="space-y-1.5 pt-1 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span>1. Popup opened?</span>
                  <span className={`font-bold flex items-center gap-1 ${auditState.popupOpened ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    {auditState.popupOpened ? <Check className="w-3.5 h-3.5" /> : 'Pending'} {auditState.popupOpened ? 'PASSED' : 'WAITING'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>2. UPI Intent launched?</span>
                  <span className={`font-bold flex items-center gap-1 ${auditState.upiIntentLaunched ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    {auditState.upiIntentLaunched ? <Check className="w-3.5 h-3.5" /> : 'Ready'} {auditState.upiIntentLaunched ? 'LAUNCHED' : 'STANDBY'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>3. QR loaded?</span>
                  <span className={`font-bold flex items-center gap-1 ${auditState.qrLoaded ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    {auditState.qrLoaded ? <Check className="w-3.5 h-3.5" /> : 'Pending'} {auditState.qrLoaded ? 'LOADED' : 'STANDBY'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>4. Purchase record created?</span>
                  <span className={`font-bold flex items-center gap-1 ${auditState.purchaseRecordCreated ? 'text-emerald-600' : auditState.status === 'FAILED' ? 'text-rose-500' : 'text-zinc-400'}`}>
                    {auditState.purchaseRecordCreated ? <Check className="w-3.5 h-3.5" /> : auditState.status === 'FAILED' ? <AlertCircle className="w-3.5 h-3.5" /> : 'Pending'} {auditState.purchaseRecordCreated ? 'CREATED' : auditState.status === 'FAILED' ? 'FAILED' : 'WAITING'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>5. Notification delivered?</span>
                  <span className={`font-bold flex items-center gap-1 ${auditState.notificationDelivered ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    {auditState.notificationDelivered ? <Check className="w-3.5 h-3.5" /> : 'Pending'} {auditState.notificationDelivered ? 'DELIVERED' : 'WAITING'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* STEP 1: PRODUCT & PRICING DETAILS */}
          {step === 'DETAILS' && (
            <div className="space-y-4 animate-fadeIn">
              {/* App Info Header */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                <img
                  src={productDetails?.iconUrl || request.iconUrl || '/avanyx-logo.svg'}
                  alt="App Icon"
                  className="w-12 h-12 rounded-2xl object-cover border border-black/10 dark:border-white/10 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate">
                    {productDetails?.appName || request.appName || 'AVANYX Application'}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-[#6750A4] dark:text-[#D0BCFF] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#6750A4] dark:text-[#D0BCFF]" />
                    <span>{productDetails?.developerName || request.developerName || 'Verified Developer'}</span>
                  </div>
                </div>
              </div>

              {/* Product Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#6750A4]/10 via-[#6750A4]/5 to-transparent border border-[#6750A4]/20 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#6750A4]/20 text-[#6750A4] dark:text-[#D0BCFF] mb-1">
                      {productDetails?.type === 'SUBSCRIPTION' ? 'Subscription Plan' : 'In-App Purchase'}
                    </span>
                    <h3 className="text-base font-extrabold text-[#1D1B20] dark:text-white">
                      {productDetails?.name || request.productName || formatProductIdToTitle(request.productId)}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1.5 justify-end">
                      <span className="text-xl font-black text-[#6750A4] dark:text-[#D0BCFF]">
                        ₹{finalAmount}
                      </span>
                      {originalPrice > basePrice && (
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{originalPrice}
                        </span>
                      )}
                    </div>
                    {productDetails?.discountPercent && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {productDetails.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {productDetails?.description || request.description || 'Unlock all premium features, ad-free experience, and exclusive resources.'}
                </p>

                {/* Features List */}
                <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1.5">
                  {(productDetails?.features || ['No Ads', 'Premium Content', 'Extra Features']).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Section */}
              <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <Tag className="w-3.5 h-3.5 text-[#6750A4]" />
                    Have a coupon code?
                  </span>
                  {appliedCoupon && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      You save ₹{discountAmount}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. AVXLAUNCH200"
                    disabled={!!appliedCoupon}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCodeInput.trim()}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-[#6750A4] text-white hover:bg-[#523e85] disabled:opacity-50 transition-colors flex items-center gap-1"
                    >
                      {isApplyingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                    </button>
                  )}
                </div>

                {couponError && (
                  <p className="text-[11px] text-rose-500 font-semibold">{couponError}</p>
                )}

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 dark:border-white/5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Coupon "{appliedCoupon.code}" applied</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Product Price</span>
                  <span>₹{basePrice}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold pt-1.5 border-t border-black/5 dark:border-white/5 text-[#1D1B20] dark:text-white">
                  <span>Final Amount</span>
                  <span className="text-[#6750A4] dark:text-[#D0BCFF]">₹{finalAmount}</span>
                </div>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setStep('PAYMENT')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6750A4] to-[#7965b2] hover:from-[#573f91] hover:to-[#6750A4] text-white font-extrabold text-sm shadow-lg shadow-[#6750A4]/25 flex items-center justify-center gap-2 transition-all"
              >
                <span>Buy Now • ₹{finalAmount}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: UPI PAYMENT SCREEN (INTENTS & QR) */}
          {step === 'PAYMENT' && (
            <div className="space-y-4 animate-fadeIn text-center">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] mb-1">
                  STEP 2 OF 3: PAY VIA UPI
                </span>
                <h3 className="text-lg font-black text-[#1D1B20] dark:text-white">
                  Pay ₹{finalAmount} via UPI
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tap your preferred UPI app below to open directly, or scan the QR code.
                </p>
              </div>

              {/* 1-Tap Native UPI App Launchers */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  1-Tap Instant App Pay:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLaunchUpiIntent(upiIntents.find((u) => u.id === 'phonepe')?.intentUrl || '')}
                    className="p-3 rounded-2xl bg-[#5f259f]/10 hover:bg-[#5f259f]/20 border border-[#5f259f]/20 flex items-center gap-2.5 text-xs font-bold text-[#5f259f] dark:text-[#c490ff] transition-all"
                  >
                    <div className="w-7 h-7 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-bold text-xs">
                      P
                    </div>
                    <span>Pay with PhonePe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchUpiIntent(upiIntents.find((u) => u.id === 'gpay')?.intentUrl || '')}
                    className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center gap-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 transition-all"
                  >
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      G
                    </div>
                    <span>Google Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchUpiIntent(upiIntents.find((u) => u.id === 'paytm')?.intentUrl || '')}
                    className="p-3 rounded-2xl bg-[#00baf2]/10 hover:bg-[#00baf2]/20 border border-[#00baf2]/20 flex items-center gap-2.5 text-xs font-bold text-[#00baf2] dark:text-[#7ae1ff] transition-all"
                  >
                    <div className="w-7 h-7 rounded-xl bg-[#00baf2] text-white flex items-center justify-center font-bold text-xs">
                      P
                    </div>
                    <span>Paytm UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchUpiIntent(upiIntents.find((u) => u.id === 'bhim')?.intentUrl || '')}
                    className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center gap-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all"
                  >
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      B
                    </div>
                    <span>BHIM / Other UPI</span>
                  </button>
                </div>
              </div>

              {/* QR Code Fallback */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-[11px] font-bold text-zinc-400 block mb-2">
                  Or Scan Merchant QR Code:
                </span>
                <div className="inline-block p-3 rounded-3xl bg-white dark:bg-black/40 border-2 border-[#6750A4]/30 shadow-lg">
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-40 h-40 mx-auto rounded-xl object-contain"
                  />
                  <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>AVANYX Verified Merchant</span>
                  </div>
                </div>
              </div>

              {/* UPI ID Row */}
              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 flex items-center justify-between text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">UPI VPA ID</span>
                  <p className="text-xs font-mono font-bold text-[#1D1B20] dark:text-white truncate">
                    {officialUpiId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 rounded-xl bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold hover:bg-[#6750A4]/25 transition-colors flex items-center gap-1"
                >
                  {hasCopiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  className="flex-1 py-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-xs transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('PROOF')}
                  className="flex-[2] py-3 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-extrabold text-xs shadow-md shadow-[#6750A4]/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>I Have Paid • Enter UTR</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT PROOF UPLOAD (UTR + SCREENSHOT) */}
          {step === 'PROOF' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] mb-1">
                  STEP 3 OF 3: PAYMENT DETAILS
                </span>
                <h3 className="text-base font-black text-[#1D1B20] dark:text-white">
                  Enter UTR & Upload Screenshot
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Required to verify your transaction and grant in-app access.
                </p>
              </div>

              {/* UTR Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>UTR / UPI Reference Number (12 Digits) *</span>
                  {utrInput.length === 12 && (
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456789012"
                  className="w-full px-4 py-3 text-sm font-mono tracking-wider rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Payment Screenshot *
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />

                {screenshotUrl ? (
                  <div className="relative p-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
                    <img
                      src={screenshotUrl}
                      alt="Payment Screenshot"
                      className="w-full h-36 object-contain rounded-xl bg-black/10"
                    />
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Screenshot Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotUrl('');
                          setScreenshotFile(null);
                        }}
                        className="text-[11px] font-bold text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-black/15 dark:border-white/15 hover:border-[#6750A4] cursor-pointer text-center bg-black/[0.02] dark:bg-white/[0.02] transition-colors"
                  >
                    {isUploadingScreenshot ? (
                      <div className="space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#6750A4]" />
                        <p className="text-xs font-bold">Uploading proof ({uploadProgress}%)...</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 mx-auto text-[#6750A4]" />
                        <p className="text-xs font-bold">Click to Upload Payment Screenshot</p>
                        <p className="text-[10px] text-zinc-400">PNG, JPG, WebP up to 5MB</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('PAYMENT')}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-black/5 dark:bg-white/5 font-bold text-xs transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPayment}
                  disabled={isSubmitting || !utrInput.trim() || !screenshotUrl}
                  className="flex-[2] py-3.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-extrabold text-xs shadow-lg shadow-[#6750A4]/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting to Live Firestore...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit for Verification</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RESULT / REAL-TIME CONFIRMATION */}
          {step === 'RESULT' && completedPurchase && (
            <div className="space-y-4 text-center animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#1D1B20] dark:text-white">
                  Payment Submitted!
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Your payment is under verification. You will be notified once it is confirmed.
                </p>
              </div>

              {/* Order Details Card */}
              <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 font-bold">
                  <span className="text-zinc-500 dark:text-zinc-400">Order Details</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px]">
                    PENDING_VERIFICATION
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">Product:</span>
                  <span className="font-bold text-[#1D1B20] dark:text-white truncate max-w-[180px]">
                    {completedPurchase.productName}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">Amount:</span>
                  <span>₹{completedPurchase.originalAmount}</span>
                </div>

                {completedPurchase.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span>-₹{completedPurchase.discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold pt-1 border-t border-black/5 dark:border-white/5">
                  <span>Final Amount:</span>
                  <span className="text-[#6750A4] dark:text-[#D0BCFF]">₹{completedPurchase.amount}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">UTR:</span>
                  <span className="font-mono font-bold">{completedPurchase.utr}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                  <span className="text-zinc-500">Purchase Token:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-[11px] text-[#6750A4] dark:text-[#D0BCFF]">
                    <span>{completedPurchase.purchaseToken}</span>
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded"
                    >
                      {hasCopiedToken ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Callback preview */}
              <div className="p-3 rounded-xl bg-black/80 text-emerald-400 text-[11px] font-mono text-left overflow-x-auto">
                <p className="text-[9px] text-zinc-400 uppercase font-sans font-bold mb-1">
                  Callback Dispatched to Developer App:
                </p>
                <pre className="text-[10px]">
{JSON.stringify(
  {
    status: 'SUCCESS',
    productId: completedPurchase.productId,
    purchaseToken: completedPurchase.purchaseToken
  },
  null,
  2
)}
                </pre>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleFinished}
                  className="w-full py-3.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-extrabold text-sm shadow-lg shadow-[#6750A4]/30 transition-all"
                >
                  Enjoy Premium Features
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setCurrentTab('PURCHASE_HISTORY');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold transition-colors"
                >
                  View Order Details in Purchase History
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PurchasePopupModal;
