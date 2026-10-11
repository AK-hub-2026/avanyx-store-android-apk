import React, { useState } from 'react';
import {
  KeyRound,
  User,
  Calendar,
  Phone,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { resumeDraftVerification } from '../../services/firestoreService';

interface DraftRecoveryViewProps {
  type: 'DEVELOPER' | 'STUDENT';
  onDraftRestored: (token: string, formData: any, savedAt: string, expiresAt?: string) => void;
  onSwitchToNewApp: () => void;
}

export const DraftRecoveryView: React.FC<DraftRecoveryViewProps> = ({
  type,
  onDraftRestored,
  onSwitchToNewApp
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [dobInput, setDobInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsExpired(false);
    setSuccessMessage(null);

    const cleanToken = tokenInput.trim().toUpperCase();
    if (!cleanToken) {
      setErrorMessage('Please enter your Application Token.');
      return;
    }

    if (!nameInput.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }

    if (!dobInput.trim()) {
      setErrorMessage('Please enter your Date of Birth.');
      return;
    }

    if (!phoneInput.trim() || phoneInput.trim().length < 10) {
      setErrorMessage('Please enter your 10-digit Registered Phone Number.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resumeDraftVerification(
        cleanToken,
        nameInput.trim(),
        dobInput.trim(),
        phoneInput.trim()
      );

      if (!result.success) {
        if (result.expired) {
          setIsExpired(true);
          setErrorMessage(
            result.message ||
              'This draft has expired after 30 days. In accordance with AVANYX Privacy Policy, all verification documents and draft data have been permanently deleted from Firestore.'
          );
        } else {
          setErrorMessage(
            result.message ||
              'Invalid Application Token or identity credentials do not match our registered records.'
          );
        }
        return;
      }

      setSuccessMessage('Draft restored successfully from live Firestore! Redirecting to application...');
      setTimeout(() => {
        onDraftRestored(
          result.token || cleanToken,
          result.formData || {},
          result.savedAt || new Date().toISOString(),
          result.expiresAt
        );
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with Firestore. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="space-y-1.5 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold mb-1">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Resume Existing Application</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5]">
          Restore Your Draft Application
        </h2>
        <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-lg">
          Enter your Application Token along with your identity credentials to securely restore your saved {type === 'DEVELOPER' ? 'Developer' : 'Student'} verification progress from Firestore.
        </p>
      </div>

      {/* Expiry / Error Banner */}
      {isExpired && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Draft Expiration Notice (30 Days Limit)</span>
          </div>
          <p className="text-xs leading-relaxed">
            {errorMessage}
          </p>
          <div className="pt-2">
            <button
              onClick={onSwitchToNewApp}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition"
            >
              Start a New Application
            </button>
          </div>
        </div>
      )}

      {errorMessage && !isExpired && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleResume} className="space-y-4">
        {/* 1. Application Token */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
            Application Token <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
            <input
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              placeholder={type === 'DEVELOPER' ? 'AVX-DEV-2026-XXXXXX' : 'AVX-STU-2026-XXXXXX'}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3EDF7]/60 dark:bg-[#2B2C30] border border-black/10 dark:border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-hidden focus:ring-2 focus:ring-[#6750A4]"
            />
          </div>
        </div>

        {/* 2. Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
            Full Name (As on Government ID) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Alok Kumar Sharma"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3EDF7]/60 dark:bg-[#2B2C30] border border-black/10 dark:border-white/10 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-hidden focus:ring-2 focus:ring-[#6750A4]"
            />
          </div>
        </div>

        {/* 3. Date of Birth & 4. Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
              <input
                type="date"
                required
                value={dobInput}
                onChange={(e) => setDobInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3EDF7]/60 dark:bg-[#2B2C30] border border-black/10 dark:border-white/10 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-hidden focus:ring-2 focus:ring-[#6750A4]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
              Registered Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
              <input
                type="tel"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3EDF7]/60 dark:bg-[#2B2C30] border border-black/10 dark:border-white/10 text-xs text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-hidden focus:ring-2 focus:ring-[#6750A4]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#6750A4] text-white font-bold text-xs hover:bg-[#533F85] disabled:opacity-50 transition shadow-md"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying & Restoring from Firestore...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Restore Draft & Continue</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSwitchToNewApp}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#49454F] dark:text-[#CAC4D0] font-bold text-xs transition"
          >
            Start New Application Instead
          </button>
        </div>
      </form>

      {/* Info notice */}
      <div className="flex items-center justify-between text-[11px] text-[#49454F] dark:text-[#CAC4D0] pt-2 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#6750A4]" />
          <span>Draft retention policy: 30 days from last edit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted Firestore storage</span>
        </div>
      </div>
    </div>
  );
};
