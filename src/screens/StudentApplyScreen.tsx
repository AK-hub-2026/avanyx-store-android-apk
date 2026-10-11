import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import {
  GraduationCap,
  BadgeCheck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  School,
  BookOpen,
  Calendar,
  CreditCard,
  Mail,
  User,
  UploadCloud,
  FileCheck2,
  FileText,
  ChevronLeft,
  XCircle,
  RefreshCw,
  Info,
  Award,
  Phone,
  Save,
  Copy,
  Check,
  KeyRound,
  AlertTriangle,
  Lock,
  Share2,
  LogIn,
  Users,
  Layers
} from 'lucide-react';
import {
  uploadVerificationDocument
} from '../services/avanyxUploadService';
import {
  subscribeToStudentVerification,
  generateApplicationToken,
  createApplicationTokenRecord,
  saveDraftVerification,
  fetchDraftVerification,
  fetchDraftVerificationByUserId,
  maskPhoneNumber,
  formatFirebaseError,
  checkDuplicateAadhaar
} from '../services/firestoreService';
import { StudentVerificationRequest } from '../types';
import { AadhaarFrontUpload } from '../components/verification/AadhaarFrontUpload';
import { EmailOtpModal } from '../components/verification/EmailOtpModal';
import { PhoneOtpModal } from '../components/verification/PhoneOtpModal';
import { LegalAgreementModal, LegalDocType } from '../components/verification/LegalAgreementModal';
import { SaveTokenModal } from '../components/verification/SaveTokenModal';
import { DraftRecoveryView } from '../components/verification/DraftRecoveryView';
import { PaymentStepView } from '../components/verification/PaymentStepView';
import { VerificationStatusBar } from '../components/verification/VerificationStatusBar';

interface StudentApplyScreenProps {
  onBack?: () => void;
}

const BOARDS = [
  'CBSE',
  'ICSE',
  'UP Board',
  'Maharashtra State Board',
  'Tamil Nadu State Board',
  'Karnataka State Board',
  'West Bengal State Board',
  'International Baccalaureate (IB)',
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

export const StudentApplyScreen: React.FC<StudentApplyScreenProps> = ({ onBack }) => {
  const {
    user,
    isAuthenticated,
    setCurrentTab,
    requestStudentVerification,
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
  const [fullName, setFullName] = useState(user?.name || '');
  const [dob, setDob] = useState(user?.studentDetails?.dob || '');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('');
  const [institutionName, setInstitutionName] = useState(user?.studentDetails?.institutionName || user?.studentDetails?.institution || user?.studentDetails?.schoolName || '');
  const [board, setBoard] = useState(user?.studentDetails?.board || 'CBSE');
  const [boardOther, setBoardOther] = useState('');
  const [passingYear, setPassingYear] = useState(user?.studentDetails?.passingYear || '2024');
  const [studentIdNumber, setStudentIdNumber] = useState(user?.studentDetails?.studentIdNumber || '');
  const [documentUrl, setDocumentUrl] = useState(user?.studentDetails?.documentUrl || '');
  
  // Email & Phone OTP
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [verifiedPhone, setVerifiedPhone] = useState(user?.verifiedPhone || user?.phoneNumber || '');
  const [isPhoneVerified, setIsPhoneVerified] = useState(!!user?.phoneVerified);
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(user?.phoneVerifiedAt || null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [continueWithEmailAndDocs, setContinueWithEmailAndDocs] = useState(false);

  const [bio, setBio] = useState(user?.bio || '');

  // Upload progress
  const [docUploadProgress, setDocUploadProgress] = useState<number | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  // Agreements & Legal Compliance (v3.4.2)
  const [agreeStudentTerms, setAgreeStudentTerms] = useState(false);
  const [confirm10thPass, setConfirm10thPass] = useState(false);
  const [agreeFreeOnly, setAgreeFreeOnly] = useState(false);
  const [agreeNoMonetization, setAgreeNoMonetization] = useState(false);
  const [agreeGuidelines, setAgreeGuidelines] = useState(false);

  // Legal Modal
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocType>('STUDENT_AGREEMENT');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionCompletedAt, setSubmissionCompletedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Real-time Firestore Application State
  const [liveApplication, setLiveApplication] = useState<StudentVerificationRequest | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  // Token initialization & draft restoration
  useEffect(() => {
    const existingToken = localStorage.getItem('avx_current_stu_token');
    if (existingToken) {
      setApplicationToken(existingToken);
    }

    if (user?.id) {
      fetchDraftVerificationByUserId(user.id, 'STUDENT').then((draft) => {
        if (draft && draft.formData) {
          applyDraftData(draft.formData);
          if (draft.token) {
            setApplicationToken(draft.token);
            localStorage.setItem('avx_current_stu_token', draft.token);
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
        'STUDENT',
        user?.id || 'guest_stu',
        user?.email
      );
      setApplicationToken(res.token);
      localStorage.setItem('avx_current_stu_token', res.token);
      setDraftExpiresAt(res.expiresAt);
      // Reset form
      setFullName(user?.name || '');
      setDob(user?.studentDetails?.dob || '');
      setAadhaarInput('');
      setAadhaarFrontUrl('');
      setInstitutionName(user?.studentDetails?.institutionName || user?.studentDetails?.schoolName || '');
      setBoard(user?.studentDetails?.board || 'CBSE');
      setBoardOther('');
      setPassingYear('2024');
      setStudentIdNumber('');
      setDocumentUrl('');
      setStudentEmail(user?.email || '');
      setIsEmailVerified(false);
      setPhoneNumber(user?.phoneNumber || '');
      setIsPhoneVerified(false);
      setBio('');
      setAgreeStudentTerms(false);
      setAgreeFreeOnly(false);
      setAgreeNoMonetization(false);
      setAgreeGuidelines(false);
      setConfirm10thPass(false);
      setDraftSavedAt(new Date(res.savedAt).toLocaleTimeString());
      setActiveMode('FORM');
      setIsSaveTokenModalOpen(true);
    } catch (e) {
      console.warn('Error starting new student application:', e);
    }
  };

  // Realtime Firestore Listener
  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setIsLiveLoading(false);
      return;
    }

    const unsubscribe = subscribeToStudentVerification(uid, (data) => {
      setLiveApplication(data);
      if (data?.submittedAt) {
        setSubmissionCompletedAt(data.submittedAt);
      }
      setIsLiveLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Auto-Save draft while typing (debounced 1200ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!applicationToken || isAlreadyVerified || isPendingReview || submitSuccess) return;

    const timer = setTimeout(async () => {
      setIsDraftSaving(true);
      const currentData = {
        fullName,
        dob,
        aadhaarInput,
        aadhaarFrontUrl,
        institutionName,
        board,
        boardOther,
        passingYear,
        studentIdNumber,
        documentUrl,
        studentEmail,
        isEmailVerified,
        phoneNumber,
        isPhoneVerified,
        bio,
        agreeStudentTerms,
        confirm10thPass
      };

      try {
        const res = await saveDraftVerification(applicationToken, 'STUDENT', currentData, user?.id || 'guest_stu');
        setDraftSavedAt(new Date(res.savedAt).toLocaleTimeString());
      } catch (e) {
        console.warn('Auto-save notice:', e);
      } finally {
        setIsDraftSaving(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    fullName,
    dob,
    aadhaarInput,
    aadhaarFrontUrl,
    institutionName,
    board,
    boardOther,
    passingYear,
    studentIdNumber,
    documentUrl,
    studentEmail,
    isEmailVerified,
    phoneNumber,
    isPhoneVerified,
    bio,
    agreeStudentTerms,
    confirm10thPass,
    applicationToken
  ]);

  const applyDraftData = (data: any) => {
    if (!data) return;
    if (data.fullName) setFullName(data.fullName);
    if (data.dob) setDob(data.dob);
    if (data.aadhaarInput) setAadhaarInput(data.aadhaarInput);
    if (data.aadhaarFrontUrl) setAadhaarFrontUrl(data.aadhaarFrontUrl);
    if (data.institutionName) setInstitutionName(data.institutionName);
    if (data.board) setBoard(data.board);
    if (data.boardOther) setBoardOther(data.boardOther);
    if (data.passingYear) setPassingYear(data.passingYear);
    if (data.studentIdNumber) setStudentIdNumber(data.studentIdNumber);
    if (data.documentUrl) setDocumentUrl(data.documentUrl);
    if (data.studentEmail) setStudentEmail(data.studentEmail);
    if (data.isEmailVerified !== undefined) setIsEmailVerified(data.isEmailVerified);
    if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
    if (data.isPhoneVerified !== undefined) setIsPhoneVerified(data.isPhoneVerified);
    if (data.continueWithEmailAndDocs !== undefined) setContinueWithEmailAndDocs(data.continueWithEmailAndDocs);
    if (data.bio) setBio(data.bio);
    if (data.agreeStudentTerms !== undefined) setAgreeStudentTerms(data.agreeStudentTerms);
    if (data.confirm10thPass !== undefined) setConfirm10thPass(data.confirm10thPass);
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
        localStorage.setItem('avx_current_stu_token', draft.token || draftRecoveryInput.trim().toUpperCase());
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

  const currentStatus = liveApplication?.status || user?.studentStatus || (user?.role === 'STUDENT' ? 'VERIFIED' : 'NONE');
  const isAlreadyVerified = currentStatus === 'VERIFIED' || currentStatus === 'APPROVED' || user?.role === 'STUDENT';
  const isPendingReview = currentStatus === 'PENDING_REVIEW' || currentStatus === 'PENDING';
  const isRejected = currentStatus === 'REJECTED';

  // Age calculation
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

  const getMaskedAadhaar = (raw: string): string => {
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) return '';
    if (digitsOnly.length <= 4) return `XXXX-XXXX-${digitsOnly}`;
    const lastFour = digitsOnly.slice(-4);
    return `XXXX-XXXX-${lastFour}`;
  };

  // Document upload via internal AVANYX Upload Service
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    setDocUploadProgress(15);
    try {
      const result = await uploadVerificationDocument(file, user?.id || 'guest_stu', applicationToken, (progress: number) => {
        setDocUploadProgress(progress);
      });
      setDocumentUrl(result.publicUrl);
      setValidationErrors((prev) => ({ ...prev, documentUrl: '' }));
    } catch (err: any) {
      console.warn('Doc upload notice:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setDocumentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setTimeout(() => {
        setIsUploadingDoc(false);
        setDocUploadProgress(null);
      }, 400);
    }
  };

  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full Student Name is required.';
    }
    if (!dob) {
      errors.dob = 'Date of birth is required.';
    }
    if (!institutionName.trim()) {
      errors.institutionName = 'School or College Institution Name is required.';
    }
    if (board === 'Other' && !boardOther.trim()) {
      errors.boardOther = 'Please specify your education board.';
    }
    const effectiveEmail = (user?.email || studentEmail || '').trim();
    if (!effectiveEmail) {
      errors.studentEmail = 'Account Email is required.';
    }
    if (!documentUrl) {
      errors.documentUrl = 'Please upload a 10th Pass Marksheet, Student ID, or Enrollment Certificate.';
    }

    // Aadhaar Verification
    const aadhaarDigits = aadhaarInput.replace(/\D/g, '');
    if (!aadhaarDigits) {
      errors.aadhaarInput = 'Aadhaar Number is mandatory for Student Verification.';
    } else if (aadhaarDigits.length !== 12) {
      errors.aadhaarInput = `Aadhaar Number must be exactly 12 digits (currently ${aadhaarDigits.length}).`;
    }

    if (!aadhaarFrontUrl) {
      errors.aadhaarFrontUrl = 'Please upload the front page of your official Aadhaar Card.';
    }

    if (!confirm10thPass) {
      errors.confirm10thPass = 'You must confirm that you have passed 10th Standard / Secondary School.';
    }
    if (!agreeStudentTerms && (!agreeFreeOnly || !agreeNoMonetization || !agreeGuidelines)) {
      errors.agreeStudentTerms = 'You must accept the AVANYX Student Publisher Agreement, Free App policy, and Community Guidelines.';
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
          : 'Please complete all mandatory student verification fields and accept all required agreements.'
      );
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
      return;
    }

    // Step 1 validation complete
    // Real Identity Check: Reject duplicate Aadhaar submissions automatically (PART G)
    try {
      const dupCheck = await checkDuplicateAadhaar(aadhaarInput, user?.id || 'guest_stu');
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
      console.warn('Student Aadhaar duplicate check warning:', dupErr);
    }

    // Proceed to Step 2: Payment Verification Step (₹50)
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
        requestStudentVerification({
          fullName: fullName.trim(),
          institutionName: institutionName.trim(),
          board: board === 'Other' ? boardOther.trim() : board,
          passingYear: passingYear,
          studentIdNumber: studentIdNumber.trim() || undefined,
          documentUrl: documentUrl,
          aadhaarMasked: maskedAadhaar,
          aadhaarFrontUrl: aadhaarFrontUrl,
          email: (user?.email || studentEmail).trim(),
          emailVerified: true,
          phoneNumber: (verifiedPhone || phoneNumber).trim() || 'N/A',
          phoneVerified: isPhoneVerified,
          verifiedPhone: isPhoneVerified ? (verifiedPhone || phoneNumber).trim() : undefined,
          phoneVerifiedAt: isPhoneVerified ? (phoneVerifiedAt || new Date().toISOString()) : undefined,
          phoneVerificationDeferred: !isPhoneVerified,
          phoneVerificationStatus: isPhoneVerified ? 'VERIFIED' : 'PENDING_LATER',
          bio: bio.trim() || undefined,
          agreeTerms: true,
          confirm10thPass: true,
          termsAccepted: true,
          privacyAccepted: true,
          studentAgreementAccepted: true,
          acceptedVersion: 'v3.5.6',
          acceptedTimestamp: completionTime,
          notes: `Application Token: ${applicationToken} | Board: ${board} | Passing: ${passingYear} | Phone: ${phoneNumber} | Aadhaar: ${maskedAadhaar}`,
          ...paymentDetails
        } as any),
        15000,
        'Firestore submission timed out after 15 seconds. Please check your network connection.'
      );

      // 4. After successful write: stop spinner, show success, token, navigate to status
      if (res && (res.requestId || res.caseId)) {
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
          'STUDENT',
          {
            fullName,
            dob,
            aadhaarInput,
            aadhaarFrontUrl,
            institutionName,
            board,
            boardOther,
            passingYear,
            studentIdNumber,
            documentUrl,
            studentEmail,
            phoneNumber,
            bio,
            agreeStudentTerms,
            confirm10thPass,
            ...paymentDetails
          },
          user?.id || 'guest_stu'
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
      title: 'AVANYX Store Student Application Token',
      text: `My AVANYX Store Student Application Token: ${tokenToShare}\nSave this token to check your verification status at https://avanyx.store`,
      url: typeof window !== 'undefined' ? window.location.origin : 'https://avanyx.store'
    };
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        // cancelled
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
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReturn}
          className="px-4 py-2 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1D1B20] dark:hover:text-white transition-all flex items-center gap-2 shadow-sm hover:shadow active:scale-[0.98]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Publisher (10th Pass)</span>
          </span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden p-8 bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] text-white border border-white/10 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Apply for AVANYX Student Developer Program & Academic Verification</h1>
                <BadgeCheck className="w-6 h-6 text-emerald-300" />
              </div>
              <p className="text-xs text-zinc-200 mt-1 max-w-xl">
                The AVANYX Student Developer Program provides enrolled students with free application hosting, academic verification badges, and developer tooling to distribute academic projects and build verified software portfolios.
              </p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-right">
            <p className="text-[10px] uppercase font-bold text-zinc-300">Requirement</p>
            <p className="text-xs font-black text-emerald-300">10th Pass or Enrolled</p>
          </div>
        </div>

        {/* Benefits Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Student Checkmark</span>
            </div>
            <p className="text-[11px] text-zinc-300">
              Display the official Verified Student checkmark on your publisher profile and published apps.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300">
              <School className="w-4 h-4 text-cyan-400" />
              <span>Zero-Fee Publishing</span>
            </div>
            <p className="text-[11px] text-zinc-300">
              Distribute unlimited educational, tool, and student utility APKs without platform fees.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Encrypted Storage Protection</span>
            </div>
            <p className="text-[11px] text-zinc-300">
              All documents are securely encrypted with zero public data leakage.
            </p>
          </div>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1D1B20] dark:text-white">Sign In Required to Submit Academic Application</h2>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-md mx-auto leading-relaxed">
              You must be logged in with your AVANYX account to apply for the Verified Student Publisher Program. Your account email will be automatically linked and verified for student privileges.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('avanyx_login_return_to', '/student/apply');
                }
                setCurrentTab('LOGIN');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/login');
                }
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
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
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
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
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-3 py-1 text-center"
          >
            + Start Fresh Application
          </button>
        )}
      </div>

      {/* Draft Recovery View Mode */}
      {activeMode === 'RESUME' && (
        <DraftRecoveryView
          type="STUDENT"
          onDraftRestored={(token, restoredData, savedAt, expiresAt) => {
            applyDraftData(restoredData);
            setApplicationToken(token);
            localStorage.setItem('avx_current_stu_token', token);
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
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#1D1B20] dark:text-white">Application Token:</span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
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
              <span>Status: Verified Student Developer</span>
            </div>
            <h2 className="text-xl font-black text-[#1D1B20] dark:text-white">
              Student Verification is Active!
            </h2>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-lg mx-auto mt-2">
              Your student publisher status has been granted. You can publish native apps, showcase educational software, and participate in student dev spotlights.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentTab('DEV_CONSOLE')}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 inline-flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <School className="w-4 h-4" />
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
                Student Verification Queued for Review
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
                <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                  {applicationToken || liveApplication?.caseId || 'STU-APPLICATION-TOKEN'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-[#2A2B32] border border-black/10 dark:border-white/10 text-xs font-bold text-[#1D1B20] dark:text-white hover:border-emerald-500 transition-all flex items-center gap-1.5 shadow-sm"
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
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
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Back to Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Real-time Status Card: Rejected */}
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
                {liveApplication?.reviewerNotes || 'Your document could not be validated. Please ensure your mark sheet or student ID is clear and valid.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Live Status Bar (v3.5) */}
      <VerificationStatusBar
        type="STUDENT"
        token={applicationToken}
        draftSavedAt={draftSavedAt}
        verificationStatus={liveApplication?.status || (submitSuccess ? 'PENDING_REVIEW' : 'DRAFT')}
        paymentStatus={liveApplication?.paymentStatus || (submitSuccess ? 'PAID_PENDING_APPROVAL' : 'PENDING_PAYMENT')}
        profileSynced={!!user?.studentDetails || isAlreadyVerified}
      />

      {/* Main Student Form */}
      {!isAlreadyVerified && !isPendingReview && !submitSuccess && (
        <>
          {currentStep === 'PAYMENT' ? (
            <PaymentStepView
              type="STUDENT"
              applicantName={fullName}
              applicationToken={applicationToken}
              userId={user?.id || 'guest_stu'}
              userEmail={user?.email || studentEmail}
              studioOrSchool={institutionName}
              onSubmitPayment={handleFinalSubmitWithPayment}
              onBackToForm={() => setCurrentStep('FORM')}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
            />
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-xl space-y-8">
              <div>
                <h2 className="text-xl font-black text-[#1D1B20] dark:text-white tracking-tight">
                  Student Academic & Identity Details
                </h2>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-1">
                  Complete the verification form with your academic institution details, 10th pass qualification, and identity proof.
                </p>
              </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Section 1: Basic Student Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-[#1D1B20] dark:text-white uppercase tracking-wider text-[11px]">
                  1. Student Identity Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    Full Student Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className={`w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border ${
                      validationErrors.fullName ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                    } text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                  />
                  {validationErrors.fullName && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.fullName}</p>
                  )}
                </div>

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
                      } text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                    />
                  </div>
                  {dob && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                      Age: {calculateAge(dob)} years old
                    </p>
                  )}
                  {validationErrors.dob && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.dob}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Academic Institution & 10th Pass Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-[#1D1B20] dark:text-white uppercase tracking-wider text-[11px]">
                  2. Academic & 10th Standard Qualification
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    School / College / Institution Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. Delhi Public School / St. Xavier's High School"
                    className={`w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border ${
                      validationErrors.institutionName ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                    } text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                  />
                  {validationErrors.institutionName && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.institutionName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    Education Board / Council <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                  >
                    {BOARDS.map((b) => (
                      <option key={b} value={b} className="bg-white dark:bg-[#1E1F23]">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {board === 'Other' && (
                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    Specify Board Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={boardOther}
                    onChange={(e) => setBoardOther(e.target.value)}
                    placeholder="e.g. Rajasthan Board of Secondary Education"
                    className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  {validationErrors.boardOther && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.boardOther}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    10th Passing Year / Expected Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={passingYear}
                    onChange={(e) => setPassingYear(e.target.value)}
                    placeholder="e.g. 2024, 2025"
                    className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1.5">
                    Roll Number / Student ID Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={studentIdNumber}
                    onChange={(e) => setStudentIdNumber(e.target.value)}
                    placeholder="e.g. 1245893"
                    className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Contact, Email & Phone OTP */}
            {/* Section 3: Account Email */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-[#1D1B20] dark:text-white uppercase tracking-wider text-[11px]">
                  3. Verified Account Email
                </h3>
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
                    value={user?.email || studentEmail || ''}
                    placeholder="account@gmail.com"
                    className="w-full pl-10 pr-24 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1D1B20] dark:text-white cursor-not-allowed opacity-90 focus:outline-none transition-all font-medium text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold">
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Auto-filled from your authenticated student account. Locked for verification compliance.
                </p>
              </div>
            </div>

            {/* Section 4: Mandatory Document & Aadhaar */}
            <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h3 className="font-black text-[#1D1B20] dark:text-white uppercase tracking-wider text-xs">
                      4. Mandatory Verification Documents
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Isolated private storage. Aadhaar is masked everywhere except admin review.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
                  Required
                </span>
              </div>

              {/* Aadhaar Input */}
              <div className="space-y-2">
                <label className="block font-bold text-[#49454F] dark:text-[#CAC4D0] text-xs">
                  Student Aadhaar Number (12 Digits) <span className="text-rose-500">*</span>
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
                    } text-[#1D1B20] dark:text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                  />
                </div>

                {aadhaarInput.replace(/\D/g, '').length > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">Masked Token Display:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {getMaskedAadhaar(aadhaarInput)}
                    </strong>
                  </div>
                )}
                {validationErrors.aadhaarInput && (
                  <p className="text-[11px] text-rose-500 font-semibold">{validationErrors.aadhaarInput}</p>
                )}
              </div>

              {/* Aadhaar Front Card Upload */}
              <AadhaarFrontUpload
                userId={user?.id || 'stu_applicant'}
                category="student"
                applicationToken={applicationToken}
                documentUrl={aadhaarFrontUrl}
                onDocumentChange={(url) => {
                  setAadhaarFrontUrl(url);
                  setValidationErrors((prev) => ({ ...prev, aadhaarFrontUrl: '' }));
                }}
                error={validationErrors.aadhaarFrontUrl}
              />

              {/* 10th Pass Marksheet or Student ID Upload */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#49454F] dark:text-[#CAC4D0] text-xs">
                    10th Marksheet / Student ID / Certificate <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Encrypted</span>
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {documentUrl ? (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/30">
                      <FileCheck2 className="w-8 h-8" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-400">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingDoc}
                        className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-bold text-xs hover:border-emerald-500 transition-all flex items-center gap-2 active:scale-95"
                      >
                        <UploadCloud className="w-4 h-4 text-emerald-600" />
                        <span>{documentUrl ? 'Change Document' : 'Upload Marksheet / ID'}</span>
                      </button>

                      {/* Status indicator per PART A */}
                      {documentUrl && !isUploadingDoc ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Uploaded Securely</span>
                        </span>
                      ) : !isUploadingDoc ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                          <span>Ready to Upload</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20">
                          <span>Document Selected</span>
                        </span>
                      )}
                    </div>

                    {isUploadingDoc && (
                      <div className="space-y-1">
                        <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${docUploadProgress || 20}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 font-bold">Encrypting & uploading document {docUploadProgress}%...</p>
                      </div>
                    )}
                  </div>
                </div>
                {validationErrors.documentUrl && (
                  <p className="text-[11px] text-rose-500 font-semibold">{validationErrors.documentUrl}</p>
                )}
              </div>
            </div>

            {/* Section 5: Student Publisher Agreement & Legal Compliance (v3.4.2) */}
            <div className="p-6 rounded-3xl bg-[#F7F2FA] dark:bg-[#202125] border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-[#1D1B20] dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>5. Student Publisher Agreement & Compliance</span>
                </h4>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Required (v3.4.2)
                </span>
              </div>

              {/* Policy Links Bar */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
                <p className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-2">
                  Please review the official AVANYX student publisher policies:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLegalDoc('STUDENT_AGREEMENT');
                      setIsLegalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Student Publisher Agreement</span>
                    <Info className="w-3 h-3 opacity-60" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLegalDoc('COMMUNITY_GUIDELINES');
                      setIsLegalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Community Guidelines</span>
                    <Info className="w-3 h-3 opacity-60" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLegalDoc('DEVELOPER_PRIVACY');
                      setIsLegalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Student Privacy Policy</span>
                    <Info className="w-3 h-3 opacity-60" />
                  </button>
                </div>
              </div>

              {/* 10th Standard Confirmation */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-emerald-500/40 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={confirm10thPass}
                  onChange={(e) => setConfirm10thPass(e.target.checked)}
                  className="mt-0.5 rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[#49454F] dark:text-[#CAC4D0] leading-relaxed text-xs">
                  I confirm <strong className="text-[#1D1B20] dark:text-white">I have passed 10th Standard / Matriculation</strong> (or am currently enrolled in secondary education) and all submitted academic certificates are genuine.
                </span>
              </label>
              {validationErrors.confirm10thPass && (
                <p className="text-[11px] text-rose-500 font-semibold pl-2">{validationErrors.confirm10thPass}</p>
              )}

              {/* Free Educational Apps Only */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-emerald-500/40 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreeFreeOnly}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAgreeFreeOnly(val);
                    if (val && agreeNoMonetization && agreeGuidelines) setAgreeStudentTerms(true);
                  }}
                  className="mt-0.5 rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[#49454F] dark:text-[#CAC4D0] leading-relaxed text-xs">
                  <strong className="text-[#1D1B20] dark:text-white">Free Educational Apps Only:</strong> I agree to publish 100% free educational, utility, and student projects without mandatory paywalls.
                </span>
              </label>

              {/* No Paid Apps or Payouts */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-emerald-500/40 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreeNoMonetization}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAgreeNoMonetization(val);
                    if (val && agreeFreeOnly && agreeGuidelines) setAgreeStudentTerms(true);
                  }}
                  className="mt-0.5 rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[#49454F] dark:text-[#CAC4D0] leading-relaxed text-xs">
                  <strong className="text-[#1D1B20] dark:text-white">No Monetization or Payouts:</strong> No paid apps, subscriptions, or developer payout transfers until eligible (age 18+ and completed full Developer Verification).
                </span>
              </label>

              {/* Community Guidelines & Privacy Policy */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 hover:border-emerald-500/40 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreeGuidelines || agreeStudentTerms}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAgreeGuidelines(val);
                    setAgreeStudentTerms(val);
                    if (val) {
                      setAgreeFreeOnly(true);
                      setAgreeNoMonetization(true);
                    }
                  }}
                  className="mt-0.5 rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[#1D1B20] dark:text-white leading-relaxed text-xs font-medium">
                  I have read and agree to the <strong className="text-emerald-700 dark:text-emerald-400">AVANYX Student Publisher Agreement</strong>, <strong className="text-emerald-700 dark:text-emerald-400">Community Guidelines</strong>, and <strong className="text-emerald-700 dark:text-emerald-400">Privacy Policy</strong>.
                </span>
              </label>
              {validationErrors.agreeStudentTerms && (
                <p className="text-[11px] text-rose-500 font-semibold pl-2">{validationErrors.agreeStudentTerms}</p>
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
                disabled={isSubmitting || !confirm10thPass || (!agreeStudentTerms && (!agreeFreeOnly || !agreeNoMonetization || !agreeGuidelines))}
                className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment & Verification Fee (₹50)</span>
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

      {/* Student Developer Program Handbook, Academic Guidelines & FAQs */}
      <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-xl space-y-8">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Academic Program Reference</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1D1B20] dark:text-white">
              Student Developer Program: Purpose, Workflows & Academic Guidelines
            </h2>
            <p className="text-xs sm:text-sm text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
              Complete reference on eligibility requirements, verification steps, publishing quotas, and zero-fee hosting for student software creators.
            </p>
          </div>

          {/* Key Takeaways */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#F8F9FA] to-[#6750A4]/10 dark:from-[#122822] dark:via-[#1E1F23] dark:to-[#221C35] border border-emerald-500/20 space-y-3">
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Program Key Takeaways</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#49454F] dark:text-[#CAC4D0]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>100% Free Hosting:</strong> Zero platform commission, zero registration fees, and free package hosting for verified students.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Eligible Students (Class 10+):</strong> High school students who have completed 10th standard, vocational students, and university undergraduates.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>10 Active Release Quota:</strong> Each student account receives an infrastructure quota of up to 10 active published application release tracks.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Verified Campus Badge:</strong> An official academic checkmark is displayed across your studio profile and public store listings.</span>
              </li>
            </ul>
          </div>

          {/* Factual Core Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#49454F] dark:text-[#CAC4D0]">
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-500" />
                <span>Purpose of the Student Publishing Program</span>
              </h3>
              <p className="leading-relaxed">
                The program provides emerging student developers with free infrastructure to publish software, test applications in realistic mobile environments, and build an authenticated portfolio of working Android software before entering the technology industry.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                <span>Who the Student Program is Intended For</span>
              </h3>
              <p className="leading-relaxed">
                Eligible participants include secondary school students who have completed 10th standard or equivalent, polytechnic / vocational students, and enrolled college or university undergraduates and postgraduates across any accredited academic board worldwide.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>What is the Student Publishing Workflow?</span>
              </h3>
              <p className="leading-relaxed">
                Once verified, students log into the <a href="/student-console" onClick={(e) => { e.preventDefault(); setCurrentTab('STUDENT_CONSOLE'); }} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Student Console</a>, upload compiled APK packages, add descriptions and screenshots, and request publication. Binaries pass automated CyberShield static checks before going live.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>What is the Verification Workflow?</span>
              </h3>
              <p className="leading-relaxed">
                Verification confirms your academic enrollment. Applicants enter school or university credentials, verify email and mobile phone via OTP, and upload an academic identity card or 10th standard marksheet. Review is completed within 24 to 48 hours.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                <span>What Students Should Prepare to Apply</span>
              </h3>
              <p className="leading-relaxed">
                To submit an application, prepare: (1) Official institution name and recognized education board; (2) Degree program or class level; (3) Expected graduation year; (4) Digital photograph or scan of your valid student ID card or 10th certificate; and (5) Mobile phone for SMS verification.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Draft Application & Token Tracking</span>
              </h3>
              <p className="leading-relaxed">
                Unfinished applications are automatically issued a 30-day Application Token. You can safely close your browser and return to complete or check the review status anytime using the token recovery feature.
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-4">
            <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-white">
              Student Application Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#49454F] dark:text-[#CAC4D0]">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                <h4 className="font-extrabold text-[#1D1B20] dark:text-white">What kinds of applications can students publish?</h4>
                <p className="leading-relaxed">
                  Students can publish utilities, study companions, open-source projects, school calculators, campus guides, or indie games. All apps must pass CyberShield security audits and avoid malicious behaviors.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                <h4 className="font-extrabold text-[#1D1B20] dark:text-white">What if my school or university board is not listed?</h4>
                <p className="leading-relaxed">
                  Select &quot;Other&quot; from the board selection menu and enter your academic institution title manually. The verification team accepts accredited institutions from all regions.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                <h4 className="font-extrabold text-[#1D1B20] dark:text-white">Is there any fee or recurring cost for student accounts?</h4>
                <p className="leading-relaxed">
                  No. Student developer verification and package distribution on AVANYX Store are completely free of charge for up to 10 active release tracks.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                <h4 className="font-extrabold text-[#1D1B20] dark:text-white">Can students graduate to full commercial developer accounts?</h4>
                <p className="leading-relaxed">
                  Yes. Once students reach 18 years of age and wish to distribute commercial or paid applications with payout rails, they can apply for the standard <a href="/developer/apply" onClick={(e) => { e.preventDefault(); setCurrentTab('DEVELOPER_APPLY'); }} className="text-[#6750A4] dark:text-[#D0BCFF] font-bold hover:underline">Developer Account</a>.
                </p>
              </div>
            </div>
          </div>

          {/* Contextual Internal Links */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <a
              href="/student-console"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('STUDENT_CONSOLE');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/student-console');
                }
              }}
              className="hover:underline flex items-center gap-1"
            >
              <span>Student Console</span>
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
              className="hover:underline text-[#6750A4] dark:text-[#D0BCFF]"
            >
              Store Marketplace
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <a
              href="/developer/apply"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('DEVELOPER_APPLY');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/developer/apply');
                }
              }}
              className="hover:underline text-indigo-500"
            >
              Developer Program (18+)
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
              className="hover:underline text-[#6750A4] dark:text-[#D0BCFF]"
            >
              Knowledge Base (FAQs)
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <a href="/about" onClick={(e) => { e.preventDefault(); setCurrentTab('INTRO'); onBack ? onBack() : null; }} className="hover:underline text-[#49454F] dark:text-[#CAC4D0]">
              About AVANYX
            </a>
          </div>
        </div>
      </div>

      {/* Email OTP Modal */}
      <EmailOtpModal
        isOpen={isOtpModalOpen}
        email={studentEmail || user?.email || ''}
        onClose={() => setIsOtpModalOpen(false)}
        onVerified={() => {
          setIsEmailVerified(true);
          setValidationErrors((prev) => {
            const next = { ...prev };
            delete next.studentEmail;
            return next;
          });
        }}
      />

      {/* Phone OTP Modal */}
      <PhoneOtpModal
        isOpen={isPhoneModalOpen}
        phoneNumber={phoneNumber || ''}
        userId={user?.id}
        applicationToken={applicationToken}
        verificationType="STUDENT"
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

      {/* Legal Agreement Modal */}
      <LegalAgreementModal
        isOpen={isLegalModalOpen}
        initialDoc={selectedLegalDoc}
        onClose={() => setIsLegalModalOpen(false)}
        onAccept={() => {
          setAgreeStudentTerms(true);
          setAgreeFreeOnly(true);
          setAgreeNoMonetization(true);
          setAgreeGuidelines(true);
        }}
      />

      {/* Real Application Token Modal v3.4.3 */}
      <SaveTokenModal
        token={applicationToken}
        type="STUDENT"
        isOpen={isSaveTokenModalOpen}
        onClose={() => setIsSaveTokenModalOpen(false)}
      />
    </div>
  );
};
