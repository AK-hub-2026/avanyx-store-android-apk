import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Terminal,
  BadgeCheck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Globe,
  Github,
  Building,
  Mail,
  User,
  ExternalLink,
  ChevronLeft,
  UploadCloud,
  FileCheck2,
  MapPin,
  Calendar,
  CreditCard,
  Hash,
  RefreshCw,
  XCircle,
  KeyRound,
  FileText,
  Lock,
  Camera,
  Phone,
  Save,
  Copy,
  Check,
  AlertTriangle,
  Share2,
  LogIn,
  Users
} from 'lucide-react';
import {
  uploadProfileLogo,
  uploadBanner
} from '../services/avanyxUploadService';
import {
  subscribeToDeveloperVerification,
  generateApplicationToken,
  createApplicationTokenRecord,
  saveDraftVerification,
  fetchDraftVerification,
  fetchDraftVerificationByUserId,
  maskPhoneNumber,
  formatFirebaseError,
  checkDuplicateAadhaar
} from '../services/firestoreService';
import { DeveloperApplication } from '../types';
import { EmailOtpModal } from '../components/verification/EmailOtpModal';
import { PhoneOtpModal } from '../components/verification/PhoneOtpModal';
import { LiveSelfieCapture } from '../components/verification/LiveSelfieCapture';
import { AadhaarFrontUpload } from '../components/verification/AadhaarFrontUpload';
import { LegalAgreementModal, LegalDocType } from '../components/verification/LegalAgreementModal';
import { SaveTokenModal } from '../components/verification/SaveTokenModal';
import { DraftRecoveryView } from '../components/verification/DraftRecoveryView';
import { PaymentStepView } from '../components/verification/PaymentStepView';
import { VerificationStatusBar } from '../components/verification/VerificationStatusBar';

interface DeveloperApplyScreenProps {
  onBack?: () => void;
}

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'Australia',
  'France',
  'Singapore',
  'Japan',
  'Netherlands',
  'Brazil',
  'Other'
];

// Helper to wrap promises with strict 15-second timeout to prevent UI freezes
const withSubmissionTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  errorMsg: string = 'Submission timed out after 15 seconds. Please check your network connection.'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        const timeoutError: any = new Error(errorMsg);
        timeoutError.code = 'deadline-exceeded';
        reject(timeoutError);
      }, timeoutMs);
    })
  ]);
};

export const DeveloperApplyScreen: React.FC<DeveloperApplyScreenProps> = ({ onBack }) => {
  const {
    user,
    isAuthenticated,
    setCurrentTab,
    requestDeveloperVerification,
    addNotification
  } = useStore();

  // Mode: Form vs Resume vs Step
  const [activeMode, setActiveMode] = useState<'FORM' | 'RESUME'>('FORM');
  const [currentStep, setCurrentStep] = useState<'FORM' | 'PAYMENT'>('FORM');
  const [isSaveTokenModalOpen, setIsSaveTokenModalOpen] = useState(false);

  // Application Token & Draft Recovery State
  const [applicationToken, setApplicationToken] = useState<string>('');
  const [draftRecoveryInput, setDraftRecoveryInput] = useState<string>('');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftExpiresAt, setDraftExpiresAt] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Form State
  const [fullLegalName, setFullLegalName] = useState(user?.name || '');
  const [organizationName, setOrganizationName] = useState(user?.organizationName || '');
  const [dob, setDob] = useState(user?.developerDetails?.dob || '');
  const [country, setCountry] = useState(user?.developerDetails?.country || 'India');
  const [state, setState] = useState(user?.developerDetails?.state || '');
  const [websiteUrl, setWebsiteUrl] = useState(user?.websiteUrl || '');
  const [githubUrl, setGithubUrl] = useState(user?.developerDetails?.githubUrl || '');
  
  // Email & Phone Verification States
  const [supportEmail, setSupportEmail] = useState(user?.email || '');
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [verifiedPhone, setVerifiedPhone] = useState(user?.verifiedPhone || user?.phoneNumber || '');
  const [isPhoneVerified, setIsPhoneVerified] = useState(!!user?.phoneVerified);
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(user?.phoneVerifiedAt || null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [continueWithEmailAndDocs, setContinueWithEmailAndDocs] = useState(false);

  const [description, setDescription] = useState(user?.bio || '');
  const [profileLogoUrl, setProfileLogoUrl] = useState(user?.avatar || '');
  const [bannerUrl, setBannerUrl] = useState('');

  // Mandatory Verification Fields (Required)
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('');
  const [liveSelfieUrl, setLiveSelfieUrl] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Required Checkboxes & Legal Compliance v3.4.2
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [agreeAllDeveloperPolicies, setAgreeAllDeveloperPolicies] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocType>('DEVELOPER_TERMS');

  // Upload progress states
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);
  const [bannerUploadProgress, setBannerUploadProgress] = useState<number | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionCompletedAt, setSubmissionCompletedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Real-time Firestore Application State
  const [liveApplication, setLiveApplication] = useState<DeveloperApplication | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  // Initialize or restore application token
  useEffect(() => {
    const existingToken = localStorage.getItem('avx_current_dev_token');
    if (existingToken) {
      setApplicationToken(existingToken);
    }

    // Try auto-restoring draft by user ID on start
    if (user?.id) {
      fetchDraftVerificationByUserId(user.id, 'DEVELOPER').then((draft) => {
        if (draft && draft.formData) {
          applyDraftData(draft.formData);
          if (draft.token) {
            setApplicationToken(draft.token);
            localStorage.setItem('avx_current_dev_token', draft.token);
          }
          if (draft.savedAt) setDraftSavedAt(new Date(draft.savedAt).toLocaleTimeString());
          if (draft.expiresAt) {
            setDraftExpiresAt(draft.expiresAt);
          } else if (draft.savedAt) {
            setDraftExpiresAt(new Date(new Date(draft.savedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());
          }
        }
      });
    }
  }, [user?.id]);

  const handleStartNewApplication = async () => {
    try {
      const res = await createApplicationTokenRecord(
        'DEVELOPER',
        user?.id || 'guest_dev',
        user?.email
      );
      setApplicationToken(res.token);
      localStorage.setItem('avx_current_dev_token', res.token);
      setDraftExpiresAt(res.expiresAt);
      // Reset form fields
      setFullLegalName(user?.name || '');
      setOrganizationName(user?.organizationName || '');
      setDob(user?.developerDetails?.dob || '');
      setCountry(user?.developerDetails?.country || 'India');
      setState(user?.developerDetails?.state || '');
      setWebsiteUrl(user?.websiteUrl || '');
      setGithubUrl(user?.developerDetails?.githubUrl || '');
      setSupportEmail(user?.email || '');
      setIsEmailVerified(false);
      setPhoneNumber(user?.phoneNumber || '');
      setIsPhoneVerified(false);
      setDescription(user?.bio || '');
      setProfileLogoUrl(user?.avatar || '');
      setBannerUrl('');
      setAadhaarInput('');
      setAadhaarFrontUrl('');
      setLiveSelfieUrl('');
      setPanNumber('');
      setAgreeTerms(false);
      setAgreePrivacy(false);
      setConfirmOwnership(false);
      setAgreeAllDeveloperPolicies(false);
      setDraftSavedAt(new Date(res.savedAt).toLocaleTimeString());
      setActiveMode('FORM');
      setIsSaveTokenModalOpen(true);
    } catch (e) {
      console.warn('Error starting new application:', e);
    }
  };

  // Subscribe to real-time Firestore updates for the user's developer verification
  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setIsLiveLoading(false);
      return;
    }

    const unsubscribe = subscribeToDeveloperVerification(uid, (data) => {
      setLiveApplication(data);
      if (data?.submittedAt) {
        setSubmissionCompletedAt(data.submittedAt);
      }
      setIsLiveLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Auto-Save draft while typing (debounced 1000ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!applicationToken || isAlreadyVerified || isPendingReview || submitSuccess) return;

    const timer = setTimeout(async () => {
      setIsDraftSaving(true);
      const currentData = {
        fullLegalName,
        organizationName,
        dob,
        country,
        state,
        websiteUrl,
        githubUrl,
        supportEmail,
        isEmailVerified,
        phoneNumber,
        isPhoneVerified,
        description,
        profileLogoUrl,
        bannerUrl,
        aadhaarInput,
        aadhaarFrontUrl,
        liveSelfieUrl,
        panNumber,
        agreeTerms,
        agreePrivacy,
        confirmOwnership
      };

      try {
        const res = await saveDraftVerification(applicationToken, 'DEVELOPER', currentData, user?.id || 'guest_dev');
        setDraftSavedAt(new Date(res.savedAt).toLocaleTimeString());
      } catch (e) {
        console.warn('Auto-save notice:', e);
      } finally {
        setIsDraftSaving(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    fullLegalName,
    organizationName,
    dob,
    country,
    state,
    websiteUrl,
    githubUrl,
    supportEmail,
    isEmailVerified,
    phoneNumber,
    isPhoneVerified,
    description,
    profileLogoUrl,
    bannerUrl,
    aadhaarInput,
    aadhaarFrontUrl,
    liveSelfieUrl,
    panNumber,
    agreeTerms,
    agreePrivacy,
    confirmOwnership,
    applicationToken
  ]);

  const applyDraftData = (data: any) => {
    if (!data) return;
    if (data.fullLegalName) setFullLegalName(data.fullLegalName);
    if (data.organizationName) setOrganizationName(data.organizationName);
    if (data.dob) setDob(data.dob);
    if (data.country) setCountry(data.country);
    if (data.state) setState(data.state);
    if (data.websiteUrl) setWebsiteUrl(data.websiteUrl);
    if (data.githubUrl) setGithubUrl(data.githubUrl);
    if (data.supportEmail) setSupportEmail(data.supportEmail);
    if (data.isEmailVerified !== undefined) setIsEmailVerified(data.isEmailVerified);
    if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
    if (data.isPhoneVerified !== undefined) setIsPhoneVerified(data.isPhoneVerified);
    if (data.continueWithEmailAndDocs !== undefined) setContinueWithEmailAndDocs(data.continueWithEmailAndDocs);
    if (data.description) setDescription(data.description);
    if (data.profileLogoUrl) setProfileLogoUrl(data.profileLogoUrl);
    if (data.bannerUrl) setBannerUrl(data.bannerUrl);
    if (data.aadhaarInput) setAadhaarInput(data.aadhaarInput);
    if (data.aadhaarFrontUrl) setAadhaarFrontUrl(data.aadhaarFrontUrl);
    if (data.liveSelfieUrl) setLiveSelfieUrl(data.liveSelfieUrl);
    if (data.panNumber) setPanNumber(data.panNumber);
    if (data.agreeTerms !== undefined) setAgreeTerms(data.agreeTerms);
    if (data.agreePrivacy !== undefined) setAgreePrivacy(data.agreePrivacy);
    if (data.confirmOwnership !== undefined) setConfirmOwnership(data.confirmOwnership);
  };

  const handleRestoreDraftByToken = async () => {
    if (!draftRecoveryInput.trim()) {
      setDraftMessage('Please enter a valid Application Token.');
      return;
    }

    setIsDraftLoading(true);
    setDraftMessage(null);
    try {
      const draft = await fetchDraftVerification(draftRecoveryInput.trim());
      if (draft && draft.formData) {
        applyDraftData(draft.formData);
        setApplicationToken(draft.token || draftRecoveryInput.trim().toUpperCase());
        localStorage.setItem('avx_current_dev_token', draft.token || draftRecoveryInput.trim().toUpperCase());
        setDraftSavedAt(draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString() : 'Restored');
        if (draft.expiresAt) {
          setDraftExpiresAt(draft.expiresAt);
        } else if (draft.savedAt) {
          setDraftExpiresAt(new Date(new Date(draft.savedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());
        }
        setDraftMessage('Draft restored successfully!');
      } else {
        setDraftMessage('No saved draft found for this Application Token.');
      }
    } catch (err: any) {
      setDraftMessage('Failed to restore draft. Please check your connection.');
    } finally {
      setIsDraftLoading(false);
    }
  };

  // Determine current verification status
  const currentStatus = liveApplication?.status || user?.developerStatus || (user?.role === 'DEVELOPER' || user?.verifiedDeveloper ? 'VERIFIED' : 'NONE');
  const isAlreadyVerified = currentStatus === 'VERIFIED' || currentStatus === 'APPROVED' || user?.role === 'DEVELOPER' || user?.verifiedDeveloper;
  const isPendingReview = currentStatus === 'PENDING_REVIEW' || currentStatus === 'PENDING';
  const isRejected = currentStatus === 'REJECTED';

  // Age Calculator
  const calculateAge = (birthDateString: string): number => {
    if (!birthDateString) return 0;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate remaining days for 30-day draft validity
  const getDraftRemainingDays = (): number | null => {
    if (!draftExpiresAt && !draftSavedAt) return null;
    let targetTime = 0;
    if (draftExpiresAt) {
      targetTime = new Date(draftExpiresAt).getTime();
    } else if (draftSavedAt) {
      targetTime = new Date(draftSavedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
    }
    if (!targetTime || isNaN(targetTime)) return null;
    const diffMs = targetTime - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  const draftRemainingDays = getDraftRemainingDays();

  // Mask Aadhaar to conform with privacy mandates (only keep last 4 digits)
  const getMaskedAadhaar = (raw: string): string => {
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) return '';
    if (digitsOnly.length <= 4) return `XXXX-XXXX-${digitsOnly}`;
    const lastFour = digitsOnly.slice(-4);
    return `XXXX-XXXX-${lastFour}`;
  };

  // Profile Logo upload handler using internal AVANYX Upload Service
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoUploadProgress(15);
    try {
      const result = await uploadProfileLogo(file, user?.id || 'guest_dev', (progress) => {
        setLogoUploadProgress(progress);
      });
      setProfileLogoUrl(result.publicUrl);
    } catch (err: any) {
      console.warn('Logo upload notice:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setProfileLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setTimeout(() => {
        setIsUploadingLogo(false);
        setLogoUploadProgress(null);
      }, 400);
    }
  };

  // Banner file upload handler using internal AVANYX Upload Service
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    setBannerUploadProgress(15);
    try {
      const result = await uploadBanner(file, user?.id || 'guest_dev', (progress) => {
        setBannerUploadProgress(progress);
      });
      setBannerUrl(result.publicUrl);
    } catch (err: any) {
      console.warn('Banner upload notice:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setBannerUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setTimeout(() => {
        setIsUploadingBanner(false);
        setBannerUploadProgress(null);
      }, 400);
    }
  };

  // Validate form
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!fullLegalName.trim()) {
      errors.fullLegalName = 'Full Legal Name is required.';
    }
    if (!organizationName.trim()) {
      errors.organizationName = 'Studio or Organization Name is required.';
    }
    if (!dob) {
      errors.dob = 'Date of birth is required.';
    } else {
      const age = calculateAge(dob);
      if (age < 18) {
        errors.dob = `Age is ${age}. Verified Developers must be 18+ years old. Students under 18 can apply via the Verified Student Publisher flow.`;
      }
    }
    if (!country.trim()) {
      errors.country = 'Country is required.';
    }
    if (!state.trim()) {
      errors.state = 'State or Province is required.';
    }
    if (!githubUrl.trim()) {
      errors.githubUrl = 'GitHub Profile or Organization URL is required.';
    } else if (!githubUrl.includes('github.com')) {
      errors.githubUrl = 'Please provide a valid GitHub URL (e.g. https://github.com/organization).';
    }
    const effectiveEmail = (user?.email || supportEmail || '').trim();
    if (!effectiveEmail) {
      errors.supportEmail = 'Account Email is required.';
    }
    if (!description.trim() || description.trim().length < 15) {
      errors.description = 'Studio Description / Bio must be at least 15 characters.';
    }
    if (!profileLogoUrl.trim()) {
      errors.profileLogoUrl = 'Profile Photo / Logo is required for your verified developer badge.';
    }

    // Aadhaar Verification Requirements
    const aadhaarDigits = aadhaarInput.replace(/\D/g, '');
    if (!aadhaarDigits) {
      errors.aadhaarInput = 'Aadhaar Number is mandatory for Verified Developer status.';
    } else if (aadhaarDigits.length !== 12) {
      errors.aadhaarInput = `Aadhaar Number must be exactly 12 digits (currently ${aadhaarDigits.length}).`;
    }

    if (!aadhaarFrontUrl) {
      errors.aadhaarFrontUrl = 'Please upload the front page of your official Aadhaar Card.';
    }

    if (!liveSelfieUrl) {
      errors.liveSelfieUrl = 'Please take a live selfie or upload your portrait photo.';
    }

    // Legal Compliance & Required Agreements (v3.4.2)
    if (!agreeAllDeveloperPolicies && (!agreeTerms || !agreePrivacy)) {
      errors.agreeAllDeveloperPolicies = 'You must accept the AVANYX Developer Terms & Conditions, Privacy Policy, Content Policy, and App Distribution Policy to proceed.';
    }
    if (!confirmOwnership) {
      errors.confirmOwnership = 'You must confirm ownership of the software and apps you publish.';
    }

    setValidationErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const { isValid, errors } = validateForm();
    if (!isValid) {
      const missingList = Object.values(errors).filter(Boolean);
      setErrorMessage(
        missingList.length > 0
          ? `Please complete all required fields before proceeding: ${missingList.slice(0, 3).join(', ')}${missingList.length > 3 ? '...' : ''}`
          : 'Please complete all mandatory verification requirements and accept all required legal policies.'
      );
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
      return;
    }

    // Step 1 validation complete
    // Real Identity Check: Reject duplicate Aadhaar submissions automatically (PART G)
    try {
      const dupCheck = await checkDuplicateAadhaar(aadhaarInput, user?.id || 'guest_dev');
      if (dupCheck.isDuplicate) {
        setErrorMessage(dupCheck.message || 'Duplicate Aadhaar detected: This Aadhaar is already registered with another active application.');
        setValidationErrors((prev) => ({
          ...prev,
          aadhaarInput: 'Duplicate Aadhaar: Already in use.'
        }));
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
        return;
      }
    } catch (dupErr) {
      console.warn('Aadhaar duplicate check warning:', dupErr);
    }

    // Proceed to Step 2: Payment Verification Step
    setCurrentStep('PAYMENT');
  };

  const handleFinalSubmitWithPayment = async (paymentDetails: any) => {
    // 1. Submit button disables immediately
    setIsSubmitting(true);
    setErrorMessage(null);

    // 2. Watchdog timeout: Spinner must never run forever (max 15s)
    const watchdogTimer = setTimeout(() => {
      setIsSubmitting(false);
    }, 15000);

    try {
      const maskedAadhaar = getMaskedAadhaar(aadhaarInput);
      const completionTime = new Date().toISOString();

      // 3. Await Firestore write with async/await and 15s maximum timeout
      const res = await withSubmissionTimeout(
        requestDeveloperVerification({
          fullLegalName: fullLegalName.trim(),
          developerName: organizationName.trim(),
          displayName: organizationName.trim(),
          organizationName: organizationName.trim(),
          dob: dob,
          country: country.trim(),
          state: state.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          githubUrl: githubUrl.trim(),
          supportEmail: (user?.email || supportEmail).trim(),
          emailVerified: true,
          phoneNumber: (verifiedPhone || phoneNumber).trim() || 'N/A',
          phoneVerified: isPhoneVerified,
          verifiedPhone: isPhoneVerified ? (verifiedPhone || phoneNumber).trim() : undefined,
          phoneVerifiedAt: isPhoneVerified ? (phoneVerifiedAt || new Date().toISOString()) : undefined,
          phoneVerificationDeferred: !isPhoneVerified,
          phoneVerificationStatus: isPhoneVerified ? 'VERIFIED' : 'PENDING_LATER',
          description: description.trim(),
          profileLogoUrl: profileLogoUrl.trim(),
          bannerUrl: bannerUrl.trim() || undefined,
          aadhaarMasked: maskedAadhaar,
          aadhaarFrontUrl: aadhaarFrontUrl,
          liveSelfieUrl: liveSelfieUrl,
          panNumber: panNumber.trim().toUpperCase() || undefined,
          termsAccepted: true,
          privacyAccepted: true,
          contentPolicyAccepted: true,
          appDistributionAccepted: true,
          acceptedVersion: 'v3.5.6',
          acceptedTimestamp: completionTime,
          agreeTerms: true,
          agreePrivacy: true,
          confirmOwnership: true,
          contactEmail: supportEmail.trim(),
          documentUrls: [aadhaarFrontUrl, liveSelfieUrl].filter(Boolean),
          notes: `Application Token: ${applicationToken} | Age: ${calculateAge(dob)} | Phone: ${phoneNumber} | Aadhaar: ${maskedAadhaar}`,
          ...paymentDetails
        } as any),
        15000,
        'Firestore submission timed out after 15 seconds. Please check your network connection.'
      );

      // 4. After successful write: stop spinner, show success, token, navigate to status
      if (res && (res.applicationId || res.caseId)) {
        setSubmitSuccess(true);
        setSubmissionCompletedAt(completionTime);
        addNotification({
          title: 'Application Submitted',
          message: 'Your application has been submitted successfully.',
          type: 'VERIFICATION',
          category: 'VERIFICATION',
          userId: user?.id
        });
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setErrorMessage('Firebase Error [submission-failed]: Your application could not be confirmed. Your entered form data is safely preserved in drafts.');
      }
    } catch (err: any) {
      // 5. If Firestore fails: stop spinner, show red error banner with Firebase error code, preserve Draft
      const reason = formatFirebaseError(err);
      setErrorMessage(`Your application could not be submitted. Please try again.\nReason: ${reason}\nAll entered form data has been safely preserved as a draft.`);
      
      try {
        saveDraftVerification(
          applicationToken,
          'DEVELOPER',
          {
            fullLegalName,
            organizationName,
            dob,
            country,
            state,
            websiteUrl,
            githubUrl,
            supportEmail,
            phoneNumber,
            description,
            profileLogoUrl,
            bannerUrl,
            aadhaarInput,
            aadhaarFrontUrl,
            liveSelfieUrl,
            panNumber,
            ...paymentDetails
          },
          user?.id || 'guest_dev'
        );
      } catch (saveErr) {
        console.warn('Draft auto-save notice on failure:', saveErr);
      }
    } finally {
      clearTimeout(watchdogTimer);
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (!applicationToken) return;
    navigator.clipboard.writeText(applicationToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleShareToken = async () => {
    const tokenToShare = applicationToken || liveApplication?.caseId || '';
    if (!tokenToShare) return;
    const shareData = {
      title: 'AVANYX Store Developer Application Token',
      text: `My AVANYX Store Developer Application Token: ${tokenToShare}\nSave this token to check your verification status at https://avanyx.store`,
      url: typeof window !== 'undefined' ? window.location.origin : 'https://avanyx.store'
    };
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        // user cancelled or aborted
      }
    }
    navigator.clipboard.writeText(`AVANYX Store Application Token: ${tokenToShare}`);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleReturn = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentTab('HOME');
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        window.history.pushState({}, '', '/store');
      }
    }
  };

  // PART B: Login Required Before Apply Gate is handled inline below hero
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 selection:bg-[#6750A4]/20 selection:text-[#6750A4]">
      {/* Top App Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReturn}
          className="px-4 py-2 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white transition-all flex items-center gap-2 shadow-sm hover:shadow active:scale-[0.98]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Developer Verification (18+)</span>
          </span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden p-8 bg-gradient-to-br from-[#1C1B1F] via-[#2A2438] to-[#121316] text-white border border-white/10 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#6750A4] flex items-center justify-center text-white shadow-xl shadow-[#6750A4]/30 shrink-0">
              <Terminal className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Apply for AVANYX Developer Verification & Android App Publishing</h1>
                <BadgeCheck className="w-6 h-6 text-[#D0BCFF]" />
              </div>
              <p className="text-xs text-zinc-300 mt-1 max-w-xl">
                The AVANYX Developer Program allows software publishers and indie creators aged 18+ to distribute Android APK packages worldwide with 0% platform commission on free applications and cryptographic SHA-256 verification.
              </p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-right">
            <p className="text-[10px] uppercase font-bold text-zinc-400">Eligibility</p>
            <p className="text-xs font-black text-emerald-400">Age 18+ Required</p>
          </div>
        </div>

        {/* Benefits Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#D0BCFF]">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Full Studio Access</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Publish unlimited Android applications, submit version upgrades, and roll out security patches.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#D0BCFF]">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Developer Checkmark</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Display the official security checkmark across all store cards and your dedicated studio profile.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#D0BCFF]">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Paid Monetization & Payouts</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Configure paid downloads, subscriptions, and bank payout rails with full commercial rights.
            </p>
          </div>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] mx-auto flex items-center justify-center shadow-lg shadow-[#6750A4]/10">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1D1B20] dark:text-white">Sign In Required to Submit Application</h2>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-md mx-auto leading-relaxed">
              You must be logged in with your AVANYX account to apply for the Verified Developer Program. Your account email will be automatically linked and verified for publisher authorization.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('avanyx_login_return_to', '/developer/apply');
                }
                setCurrentTab('LOGIN');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/login');
                }
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-black text-xs shadow-lg shadow-[#6750A4]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Continue Application</span>
            </button>
            <button
              onClick={handleReturn}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 font-bold text-xs text-[#1D1B20] dark:text-white hover:bg-black/10 transition-all"
            >
              Back to Store
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Application Mode Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeMode === 'RESUME') {
                setActiveMode('FORM');
              } else if (!applicationToken) {
                handleStartNewApplication();
              }
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeMode === 'FORM'
                ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/25'
                : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Application</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('RESUME')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeMode === 'RESUME'
                ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/25'
                : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Resume Existing Application</span>
          </button>
        </div>

        {activeMode === 'FORM' && (
          <button
            type="button"
            onClick={handleStartNewApplication}
            className="text-[11px] font-bold text-[#6750A4] dark:text-[#D0BCFF] hover:underline px-3 py-1 text-center"
          >
            + Start Fresh Application
          </button>
        )}
      </div>

      {/* Draft Recovery View Mode */}
      {activeMode === 'RESUME' && (
        <DraftRecoveryView
          type="DEVELOPER"
          onDraftRestored={(token, restoredData, savedAt, expiresAt) => {
            applyDraftData(restoredData);
            setApplicationToken(token);
            localStorage.setItem('avx_current_dev_token', token);
            setDraftSavedAt(new Date(savedAt).toLocaleTimeString());
            if (expiresAt) {
              setDraftExpiresAt(expiresAt);
            } else {
              setDraftExpiresAt(new Date(new Date(savedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());
            }
            setActiveMode('FORM');
          }}
          onSwitchToNewApp={handleStartNewApplication}
        />
      )}

      {/* Auto Application Token & Draft Recovery Banner */}
      {activeMode === 'FORM' && applicationToken && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#1D1B20] dark:text-white">Application Token:</span>
                  <span className="font-mono font-bold text-xs text-[#6750A4] dark:text-[#D0BCFF] bg-[#6750A4]/10 px-2 py-0.5 rounded-md">
                    {applicationToken}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    title="Copy Token"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Save this token to recover and resume your draft application anytime. Drafts expire in 30 days.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isDraftSaving ? (
                <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Saving Draft...</span>
                </span>
              ) : draftSavedAt ? (
                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Draft Saved ({draftSavedAt})</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Draft Expiry Warning (<= 5 days remain) */}
          {draftRemainingDays !== null && draftRemainingDays <= 5 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>{draftRemainingDays} {draftRemainingDays === 1 ? 'day' : 'days'} left before this draft is deleted.</strong> Draft validity: 30 days.
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                Expiring Soon
              </span>
            </div>
          )}
        </div>
      )}

      {/* Real-time Status Card: Already Verified */}
      {isAlreadyVerified && (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F23] border border-emerald-500/30 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
            <BadgeCheck className="w-9 h-9" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Status: Verified Developer</span>
            </div>
            <h2 className="text-xl font-black text-[#1D1B20] dark:text-white">
              Your Developer Verification is Active!
            </h2>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-lg mx-auto mt-2">
              Your publisher account has full studio credentials. You have direct access to native APK publishing, crash diagnostics, live download telemetry, and developer monetization.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentTab('DEV_CONSOLE')}
              className="px-6 py-3 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-extrabold text-xs shadow-lg shadow-[#6750A4]/25 inline-flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Terminal className="w-4 h-4" />
              <span>Open Developer Console</span>
            </button>
            <button
              onClick={handleReturn}
              className="px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-xs text-[#1D1B20] dark:text-white transition-all"
            >
              Explore Store
            </button>
          </div>
        </div>
      )}

      {/* Real-time Status Card: Pending Review or Just Submitted */}
      {(isPendingReview || submitSuccess) && !isAlreadyVerified && (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F23] border border-emerald-500/30 dark:border-emerald-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Application Submitted Successfully</span>
              </div>
              <h2 className="text-xl font-black text-[#1D1B20] dark:text-white">
                Application Received & Queued for Review
              </h2>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-1.5 leading-relaxed font-medium">
                Your application has been submitted successfully. Save this token to check your application status.
              </p>
            </div>
          </div>

          {/* Token Display Banner */}
          <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] block">
                  Your Application Token:
                </span>
                <span className="font-mono text-base font-black text-[#6750A4] dark:text-[#D0BCFF] tracking-wider">
                  {applicationToken || liveApplication?.caseId || 'DEV-APPLICATION-TOKEN'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-[#2A2B32] border border-black/10 dark:border-white/10 text-xs font-bold text-[#1D1B20] dark:text-white hover:border-[#6750A4] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Token</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareToken}
                  className="px-4 py-2 rounded-xl bg-[#6750A4] hover:bg-[#523e85] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#6750A4]/25"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Token</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-500/10 text-xs">
              <div className="flex justify-between items-center sm:block">
                <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-[10px] inline-block">
                  PENDING REVIEW
                </span>
              </div>
              <div className="flex justify-between items-center sm:block">
                <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Admin Routing:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Forwarded to Admin Review
                </span>
              </div>
              <div className="flex justify-between items-center sm:block">
                <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Submitted:</span>
                <span className="font-mono text-zinc-600 dark:text-zinc-300 text-[11px]">
                  {submissionCompletedAt ? new Date(submissionCompletedAt).toLocaleString() : new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
            <button
              onClick={() => setActiveMode('RESUME')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 font-bold text-xs text-[#1D1B20] dark:text-white hover:bg-black/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Check Application Status</span>
            </button>
            <button
              onClick={handleReturn}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-black text-xs shadow-md shadow-[#6750A4]/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Back to Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Real-time Status Card: Rejected with Reviewer Reason */}
      {isRejected && (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F23] border border-rose-500/30 shadow-xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-wider mb-2">
                <span>Status: Verification Rejected</span>
              </div>
              <h2 className="text-lg font-black text-[#1D1B20] dark:text-white">
                Application Review Notice
              </h2>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-1">
                {liveApplication?.reviewerNotes || user?.developerDetails?.notes || 'Your application did not satisfy all safety or developer eligibility requirements. Please review the criteria and re-apply.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Live Status Bar (v3.5) */}
      <VerificationStatusBar
        type="DEVELOPER"
        token={applicationToken}
        draftSavedAt={draftSavedAt}
        verificationStatus={liveApplication?.status || (submitSuccess ? 'PENDING_REVIEW' : 'DRAFT')}
        paymentStatus={liveApplication?.paymentStatus || (submitSuccess ? 'PAID_PENDING_APPROVAL' : 'PENDING_PAYMENT')}
        profileSynced={!!user?.developerDetails || isAlreadyVerified}
      />

      {/* Main Application Content */}
      {!isAlreadyVerified && !isPendingReview && !submitSuccess && (
        <>
          {currentStep === 'PAYMENT' ? (
            <PaymentStepView
              type="DEVELOPER"
              applicantName={fullLegalName || organizationName}
              applicationToken={applicationToken}
              userId={user?.id || 'guest_dev'}
              userEmail={user?.email || supportEmail}
              studioOrSchool={organizationName}
              onSubmitPayment={handleFinalSubmitWithPayment}
              onBackToForm={() => setCurrentStep('FORM')}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
            />
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-xl space-y-8">
              <div>
                <h2 className="text-xl font-black text-[#1D1B20] dark:text-white tracking-tight">
                  Developer Profile Information
                </h2>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-1">
                  All submissions are verified against security requirements. You must be 18 years of age or older to qualify.
                </p>
              </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Section 1: Identity & Legal Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <User className="w-4 h-4 text-[#6750A4]" />
                <h3 className="font-black text-[#1D1B20] dark:text-white uppercase tracking-wider text-[11px]">
                  1. Identity & Legal Information (18+ Required)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullLegalName}
                    onChange={(e) => setFullLegalName(e.target.value)}
                    placeholder="e.g. Rahul Sharma / Alexander Wright"
                    className={`w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border ${
                      validationErrors.fullLegalName ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                    } text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all`}
                  />
                  {validationErrors.fullLegalName && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.fullLegalName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    Studio / Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. Apex Software Studios"
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border ${
                        validationErrors.organizationName ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                      } text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all`}
                    />
                  </div>
                  {validationErrors.organizationName && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.organizationName}</p>
                  )}
                </div>
              </div>

              {/* Date of Birth with age >= 18 validation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border ${
                        validationErrors.dob ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                      } text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all`}
                    />
                  </div>
                  {dob && (
                    <p className={`text-[11px] mt-1 font-bold ${calculateAge(dob) >= 18 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      Age: {calculateAge(dob)} years old {calculateAge(dob) >= 18 ? '(Eligible)' : '(Must be 18+)'}
                    </p>
                  )}
                  {validationErrors.dob && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.dob}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    Country <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all appearance-none"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c} className="bg-white dark:bg-[#1E1F23]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    State / Province <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Uttar Pradesh, California"
                    className={`w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border ${
                      validationErrors.state ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                    } text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all`}
                  />
                  {validationErrors.state && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.state}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Online Presence, Email & Phone OTP */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Globe className="w-4 h-4 text-[#6750A4]" />
                <h3 className="font-black text-[#1D1B20] dark:text-white uppercase tracking-wider text-[11px]">
                  2. Web Presence & Two-Factor Authentication
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    Official Website (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://apexstudio.dev"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    GitHub Profile / Org URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Github className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="url"
                      required
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/organization"
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border ${
                        validationErrors.githubUrl ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                      } text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all`}
                    />
                  </div>
                  {validationErrors.githubUrl && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.githubUrl}</p>
                  )}
                </div>
              </div>

              {/* Account Email (Auto-filled from logged-in account, read-only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-[#49454F] dark:text-[#CAC4D0] block text-xs">
                    Account Email <span className="text-rose-500">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Auto-filled from Account (Read-only)
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    required
                    readOnly
                    value={user?.email || supportEmail || ''}
                    placeholder="account@gmail.com"
                    className="w-full pl-10 pr-24 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white cursor-not-allowed opacity-90 focus:outline-none transition-all font-medium text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold">
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Auto-filled from your authenticated session. Cannot be edited for security compliance.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                  Studio Description / Bio <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed overview of your development studio, tech stack, and types of applications published."
                  className={`w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border ${
                    validationErrors.description ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                  } text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all`}
                />
                {validationErrors.description && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.description}</p>
                )}
              </div>
            </div>

            {/* Section 3: Visual Assets & Branding (/public/logos/ and /public/banners/) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <FileCheck2 className="w-4 h-4 text-[#6750A4]" />
                <h3 className="font-black text-[#1D1B20] dark:text-white uppercase tracking-wider text-[11px]">
                  3. Studio Branding & Profile Assets (/public/logos/)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Logo Upload */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#49454F] dark:text-[#CAC4D0]">
                      Profile Photo / Logo <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-400">Max 700KB, WebP</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {profileLogoUrl ? (
                      <img
                        src={profileLogoUrl}
                        alt="Developer Logo"
                        className="w-16 h-16 rounded-2xl object-cover border border-black/10 dark:border-white/10 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-zinc-400">
                        <Building className="w-8 h-8" />
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={logoInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 font-bold text-xs hover:border-[#6750A4] transition-all flex items-center gap-2 active:scale-95"
                      >
                        <UploadCloud className="w-4 h-4 text-[#6750A4]" />
                        <span>{profileLogoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                      </button>

                      {isUploadingLogo && (
                        <div className="space-y-1">
                          <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#6750A4] h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${logoUploadProgress || 20}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400 font-bold">Compressing & storing in /public/logos/ {logoUploadProgress}%...</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {validationErrors.profileLogoUrl && (
                    <p className="text-[11px] text-rose-500 font-semibold">{validationErrors.profileLogoUrl}</p>
                  )}
                </div>

                {/* Banner Image Upload */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#49454F] dark:text-[#CAC4D0]">
                      Banner Image (Optional)
                    </label>
                    <span className="text-[10px] text-zinc-400">/public/banners/</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {bannerUrl ? (
                      <img
                        src={bannerUrl}
                        alt="Developer Banner"
                        className="w-24 h-16 rounded-2xl object-cover border border-black/10 dark:border-white/10 shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-16 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-zinc-400">
                        <Layers className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={bannerInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={isUploadingBanner}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-[#25262B] border border-black/10 dark:border-white/10 font-bold text-xs hover:border-[#6750A4] transition-all flex items-center gap-2 active:scale-95"
                      >
                        <UploadCloud className="w-4 h-4 text-[#6750A4]" />
                        <span>{bannerUrl ? 'Change Banner' : 'Upload Banner'}</span>
                      </button>

                      {isUploadingBanner && (
                        <div className="space-y-1">
                          <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#6750A4] h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${bannerUploadProgress || 20}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400 font-bold">Compressing & storing in /public/banners/ {bannerUploadProgress}%...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Mandatory Aadhaar & Identity Verification */}
            <div className="p-6 rounded-3xl bg-[#F3EDF7]/80 dark:bg-[#25262B]/80 border border-[#6750A4]/25 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
                  <div>
                    <h3 className="font-black text-[#1D1B20] dark:text-white uppercase tracking-wider text-xs">
                      4. Mandatory Identity Verification
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Encrypted storage. Aadhaar is masked everywhere except Admin review.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-[#6750A4] text-white shadow-sm">
                  Required
                </span>
              </div>

              {/* Aadhaar Number with Masked UI */}
              <div className="space-y-2">
                <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] text-xs">
                  Aadhaar Number (12 Digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    maxLength={14}
                    value={aadhaarInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
                      setAadhaarInput(formatted);
                    }}
                    placeholder="1234 5678 9012"
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-[#1E1F23] border ${
                      validationErrors.aadhaarInput ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                    } text-[#1D1B20] dark:text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all`}
                  />
                </div>

                {/* Masked Aadhaar Privacy Preview */}
                {aadhaarInput.replace(/\D/g, '').length > 0 && (
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-[#6750A4]/20 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">Masked Token Display:</span>
                    <strong className="font-mono text-[#6750A4] dark:text-[#D0BCFF] font-bold">
                      {getMaskedAadhaar(aadhaarInput)}
                    </strong>
                  </div>
                )}
                {validationErrors.aadhaarInput && (
                  <p className="text-[11px] text-rose-500 font-semibold">{validationErrors.aadhaarInput}</p>
                )}
              </div>

              {/* Aadhaar Front Document Upload */}
              <AadhaarFrontUpload
                userId={user?.id || 'dev_applicant'}
                category="developer"
                applicationToken={applicationToken}
                documentUrl={aadhaarFrontUrl}
                onDocumentChange={(url) => {
                  setAadhaarFrontUrl(url);
                  setValidationErrors((prev) => ({ ...prev, aadhaarFrontUrl: '' }));
                }}
                error={validationErrors.aadhaarFrontUrl}
              />

              {/* Live Selfie Capture */}
              <LiveSelfieCapture
                userId={user?.id || 'dev_applicant'}
                applicationToken={applicationToken}
                selfieUrl={liveSelfieUrl}
                onSelfieChange={(url) => {
                  setLiveSelfieUrl(url);
                  setValidationErrors((prev) => ({ ...prev, liveSelfieUrl: '' }));
                }}
                error={validationErrors.liveSelfieUrl}
              />

              {/* PAN Field (Optional) */}
              <div>
                <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5 text-xs">
                  PAN Number (Optional - for developer payout authorization)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all font-mono uppercase text-xs"
                />
              </div>
            </div>

            {/* Section 5: Required Developer Terms & Legal Compliance (v3.4.2) */}
            <div className="p-6 rounded-3xl bg-[#F7F2FA] dark:bg-[#202125] border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-[#1D1B20] dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                  <span>Developer Agreement & Legal Compliance</span>
                </h4>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-full">
                  Mandatory
                </span>
              </div>

              {/* Policy Links Bar */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
                <p className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-2">
                  Please review the official AVANYX publisher policies:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLegalDoc('DEVELOPER_TERMS');
                      setIsLegalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6750A4]/10 hover:bg-[#6750A4]/20 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Developer Terms & Conditions</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLegalDoc('DEVELOPER_PRIVACY');
                      setIsLegalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6750A4]/10 hover:bg-[#6750A4]/20 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Developer Privacy Policy</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLegalDoc('CONTENT_POLICY');
                      setIsLegalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6750A4]/10 hover:bg-[#6750A4]/20 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Content & App Policy</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLegalDoc('COMMUNITY_GUIDELINES');
                      setIsLegalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6750A4]/10 hover:bg-[#6750A4]/20 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Community Guidelines</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </button>
                </div>
              </div>

              {/* Main Required Developer Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-[#6750A4]/40 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreeAllDeveloperPolicies}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAgreeAllDeveloperPolicies(val);
                    setAgreeTerms(val);
                    setAgreePrivacy(val);
                    if (val) {
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next.agreeAllDeveloperPolicies;
                        return next;
                      });
                    }
                  }}
                  className="mt-0.5 rounded-md text-[#6750A4] focus:ring-[#6750A4] w-4 h-4 cursor-pointer"
                />
                <span className="text-[#1D1B20] dark:text-white leading-relaxed text-xs font-medium">
                  I have read and agree to the <strong className="text-[#6750A4] dark:text-[#D0BCFF]">AVANYX Developer Terms & Conditions</strong>, <strong className="text-[#6750A4] dark:text-[#D0BCFF]">Privacy Policy</strong>, <strong className="text-[#6750A4] dark:text-[#D0BCFF]">Content Policy</strong>, and <strong className="text-[#6750A4] dark:text-[#D0BCFF]">App Distribution Policy</strong>.
                </span>
              </label>
              {validationErrors.agreeAllDeveloperPolicies && (
                <p className="text-[11px] text-rose-500 font-semibold pl-2">{validationErrors.agreeAllDeveloperPolicies}</p>
              )}

              {/* Ownership Confirmation */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-[#6750A4]/40 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmOwnership}
                  onChange={(e) => {
                    setConfirmOwnership(e.target.checked);
                    if (e.target.checked) {
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next.confirmOwnership;
                        return next;
                      });
                    }
                  }}
                  className="mt-0.5 rounded-md text-[#6750A4] focus:ring-[#6750A4] w-4 h-4 cursor-pointer"
                />
                <span className="text-[#49454F] dark:text-[#CAC4D0] leading-relaxed text-xs">
                  I confirm that <strong className="text-[#1D1B20] dark:text-white">I own or hold verified distribution licenses</strong> for all native APKs, source code, and media assets I publish to the AVANYX Store.
                </span>
              </label>
              {validationErrors.confirmOwnership && (
                <p className="text-[11px] text-rose-500 font-semibold pl-2">{validationErrors.confirmOwnership}</p>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={handleReturn}
                className="px-6 py-3 rounded-2xl bg-black/5 dark:bg-white/5 font-bold text-zinc-500 hover:text-[#1D1B20] dark:hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !agreeAllDeveloperPolicies || !confirmOwnership}
                className="px-8 py-3.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-extrabold text-xs shadow-lg shadow-[#6750A4]/25 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment & Verification Fee (₹1,626)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        )}
        </>
      )}
        </>
      )}

      {/* Developer Verification Handbook, Program Guidelines & FAQs */}
      <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-xl space-y-8">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-black uppercase">
              <Terminal className="w-3.5 h-3.5" />
              <span>Publisher Guidelines & Reference</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1D1B20] dark:text-white">
              Developer Eligibility, Verification Standards & Publishing Reference
            </h2>
            <p className="text-xs sm:text-sm text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
              Complete documentation on who qualifies, required documentation, binary verification, review timelines, and creator rights on AVANYX Store.
            </p>
          </div>

          {/* Key Takeaways */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#6750A4]/10 via-[#F8F9FA] to-emerald-500/10 dark:from-[#221C35] dark:via-[#1E1F23] dark:to-[#122822] border border-[#6750A4]/20 space-y-3">
            <div className="text-xs font-black text-[#6750A4] dark:text-[#D0BCFF] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Developer Program Key Takeaways</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#49454F] dark:text-[#CAC4D0]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>0% Commission:</strong> Creators retain 100% rights with 0% platform fee on all free and open-source applications.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Age 18+ Verification:</strong> Applicants must be 18 years or older with valid government-issued ID validation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Cryptographic Signatures:</strong> Every uploaded APK is verified and assigned an immutable NIST FIPS 180-4 SHA-256 hash.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Review SLA (24–48h):</strong> Automated identity checks process immediately; admin verification completes in 24 to 48 hours.</span>
              </li>
            </ul>
          </div>

          {/* Factual Core Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#49454F] dark:text-[#CAC4D0]">
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                <span>Who the Developer Application is For</span>
              </h3>
              <p className="leading-relaxed">
                The application is intended for independent Android software engineers, established mobile studios, open-source maintainers, and commercial publishers aged 18 and older. It grants verified access to publish applications directly to global mobile users through the AVANYX Store ecosystem.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>What Developers Can Submit</span>
              </h3>
              <p className="leading-relaxed">
                Publishers can submit compiled Android APK packages (targeting Android 8.0 Oreo through Android 15), release change logs, feature screenshots, promotional banners, and category tags. Software types include utility tools, mobile games, productivity suites, and developer SDKs.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-500" />
                <span>What Information is Required to Apply</span>
              </h3>
              <p className="leading-relaxed">
                Applicants must submit: (1) Full legal name and organization/studio title; (2) Operational contact email with OTP verification; (3) Mobile phone number with 2FA verification; (4) Physical address and country of residence; and (5) Valid government identity documentation for KYC compliance.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>What Verification Means</span>
              </h3>
              <p className="leading-relaxed">
                Verification confirms creator legal accountability and guarantees software safety. Each publisher profile receives an official verified badge, and every compiled binary undergoes automated DEX bytecode decompilation, sandbox runtime analysis, and SHA-256 integrity validation before public catalog listing.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>What Happens After Submission</span>
              </h3>
              <p className="leading-relaxed">
                Upon form submission, a unique Application Token is generated. Drafts remain securely saved for 30 days. The verification team reviews credentials within 24 to 48 hours. Upon approval, your account role transitions to Verified Developer, unlocking full access to the <a href="/developer-console" onClick={(e) => { e.preventDefault(); setCurrentTab('DEV_CONSOLE'); }} className="text-[#6750A4] dark:text-[#D0BCFF] font-bold hover:underline">Developer Console</a>.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-500" />
                <span>Data Security & RFC 9116 Policy</span>
              </h3>
              <p className="leading-relaxed">
                Submitted identity documents are stored in encrypted buckets with restricted administrative access. AVANYX adheres to RFC 9116 vulnerability reporting standards. Learn more by inspecting our public <a href="/security.txt" className="text-[#6750A4] dark:text-[#D0BCFF] font-bold hover:underline">security.txt</a> policy.
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-4">
            <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-white">
              Developer Application Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#49454F] dark:text-[#CAC4D0]">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                <h4 className="font-extrabold text-[#1D1B20] dark:text-white">Can I publish Android apps under a studio or brand name?</h4>
                <p className="leading-relaxed">
                  Yes. You can enter an organization or studio name in the application. Once approved, your studio name will be displayed as the verified publisher across all published store listings.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                <h4 className="font-extrabold text-[#1D1B20] dark:text-white">What happens if my application draft is interrupted?</h4>
                <p className="leading-relaxed">
                  Your draft is saved securely in Firestore for 30 days. You can use your Application Token to resume editing anytime by selecting &quot;Resume Existing Application&quot; at the top of this screen.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                <h4 className="font-extrabold text-[#1D1B20] dark:text-white">Does AVANYX Store take any commission on free software?</h4>
                <p className="leading-relaxed">
                  No. AVANYX Store charges 0% platform commission on free and open-source applications. You retain 100% intellectual property ownership and full distribution autonomy.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                <h4 className="font-extrabold text-[#1D1B20] dark:text-white">How does AutoSEO optimize my published apps?</h4>
                <p className="leading-relaxed">
                  The built-in AutoSEOEngine automatically extracts your package name, version, and tags to generate Schema.org SoftwareApplication JSON-LD schemas and OpenGraph cards for immediate search indexing.
                </p>
              </div>
            </div>
          </div>

          {/* Contextual Internal Links */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-3 text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF]">
            <a
              href="/developer-console"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('DEV_CONSOLE');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/developer-console');
                }
              }}
              className="hover:underline flex items-center gap-1"
            >
              <span>Developer Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <a
              href="/store"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('HOME');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/store');
                }
              }}
              className="hover:underline"
            >
              Store Marketplace
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <a
              href="/student/apply"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('STUDENT_APPLY');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/student/apply');
                }
              }}
              className="hover:underline text-indigo-500"
            >
              Student Publishing Program
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <a
              href="/faq"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('INTRO');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/faq');
                }
              }}
              className="hover:underline"
            >
              Publisher FAQs
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <a href="/security.txt" className="hover:underline">
              RFC 9116 Security Policy
            </a>
          </div>
        </div>
      </div>

      {/* Email OTP Verification Modal */}
      <EmailOtpModal
        isOpen={isOtpModalOpen}
        email={supportEmail || user?.email || ''}
        onClose={() => setIsOtpModalOpen(false)}
        onVerified={() => {
          setIsEmailVerified(true);
          setValidationErrors((prev) => {
            const next = { ...prev };
            delete next.supportEmail;
            return next;
          });
        }}
      />

      {/* Phone OTP Verification Modal */}
      <PhoneOtpModal
        isOpen={isPhoneModalOpen}
        phoneNumber={phoneNumber || ''}
        userId={user?.id}
        applicationToken={applicationToken}
        verificationType="DEVELOPER"
        onClose={() => setIsPhoneModalOpen(false)}
        onContinueLater={() => {
          setContinueWithEmailAndDocs(true);
          setValidationErrors((prev) => {
            const next = { ...prev };
            delete next.phoneNumber;
            return next;
          });
        }}
        onVerified={(verifiedNumber, timestamp) => {
          setIsPhoneVerified(true);
          setContinueWithEmailAndDocs(false);
          if (verifiedNumber) {
            setVerifiedPhone(verifiedNumber);
            setPhoneNumber(verifiedNumber);
          }
          if (timestamp) {
            setPhoneVerifiedAt(timestamp);
          }
          setValidationErrors((prev) => {
            const next = { ...prev };
            delete next.phoneNumber;
            return next;
          });
        }}
      />

      {/* Legal Agreement Modal v3.4.2 */}
      <LegalAgreementModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialDoc={selectedLegalDoc}
      />

      {/* Real Application Token Modal v3.4.3 */}
      <SaveTokenModal
        token={applicationToken}
        type="DEVELOPER"
        isOpen={isSaveTokenModalOpen}
        onClose={() => setIsSaveTokenModalOpen(false)}
      />
    </div>
  );
};
