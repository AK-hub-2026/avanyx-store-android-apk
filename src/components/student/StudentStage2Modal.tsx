import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  UserCheck,
  School,
  Lock,
  Sparkles,
  X,
  FileCheck2,
  Loader2
} from 'lucide-react';
import { submitStudentStage2Verification } from '../../services/firestoreService';
import { uploadVerificationDocument } from '../../services/avanyxUploadService';

interface StudentStage2ModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  onSuccess?: () => void;
}

export const StudentStage2Modal: React.FC<StudentStage2ModalProps> = ({
  isOpen,
  onClose,
  studentUid,
  studentName,
  studentEmail,
  onSuccess
}) => {
  const [verifierType, setVerifierType] = useState<'GUARDIAN' | 'CLASS_TEACHER'>('GUARDIAN');
  const [relationship, setRelationship] = useState<'PARENT' | 'GUARDIAN' | 'CLASS_TEACHER' | 'HOD' | 'MENTOR'>('PARENT');
  const [verifierName, setVerifierName] = useState('');
  const [verifierContact, setVerifierContact] = useState('');
  const [teacherIdOrParentId, setTeacherIdOrParentId] = useState('');
  const [verifierSelfieUrl, setVerifierSelfieUrl] = useState('');
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSelfie(true);
    setErrorMessage(null);
    try {
      const uploadRes = await uploadVerificationDocument(file, studentUid, 'SELFIE');
      setVerifierSelfieUrl(uploadRes.publicUrl || (uploadRes as any).downloadUrl || '');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload verifier selfie. Please try a different image.');
    } finally {
      setIsUploadingSelfie(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifierName.trim()) {
      setErrorMessage('Verifier Name is required.');
      return;
    }
    if (!verifierContact.trim()) {
      setErrorMessage('Verifier phone number or email is required.');
      return;
    }
    if (!teacherIdOrParentId.trim()) {
      setErrorMessage(verifierType === 'CLASS_TEACHER' ? 'Teacher ID is required.' : 'Parent / Guardian ID proof number is required.');
      return;
    }
    if (!verifierSelfieUrl) {
      setErrorMessage('Selfie photo of verifier holding ID is required.');
      return;
    }
    if (!consentAccepted) {
      setErrorMessage('Please confirm guardian/teacher commercial authorization.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await submitStudentStage2Verification(studentUid, studentName, studentEmail, {
        verifierType,
        relationship,
        verifierName: verifierName.trim(),
        verifierContact: verifierContact.trim(),
        teacherIdOrParentId: teacherIdOrParentId.trim(),
        verifierSelfieUrl,
        consentAccepted
      });

      setSuccessMessage('Stage 2 Commercial Verification request submitted to Admin Queue! Upon approval, In-App Products and Subscriptions will unlock.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit verification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141522] border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 my-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-[#9333EA] text-white flex items-center justify-center font-black shadow-lg shadow-cyan-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Stage 2: Guardian/Teacher Verification</h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                COMMERCIAL
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Unlock In-App Products, Subscriptions & Revenue Tracking under Class 10+ student guidelines.
            </p>
          </div>
        </div>

        {/* Benefits notice */}
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs space-y-1 text-cyan-200">
          <span className="font-extrabold flex items-center gap-1.5 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            Unlocks Upon Approval:
          </span>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            • Publish In-App Purchases & Digital Goods<br />
            • Create & Publish Recurring Subscriptions<br />
            • Commercial Analytics & Revenue Settlement<br />
            <span className="text-zinc-500 italic">* Note: Paid standalone APK downloads remain restricted to Commercial Developer tier.</span>
          </p>
        </div>

        {successMessage ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Verifier Type Selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Verifier Authorization Role <span className="text-cyan-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerifierType('GUARDIAN');
                    setRelationship('PARENT');
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    verifierType === 'GUARDIAN'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Parent / Guardian</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerifierType('CLASS_TEACHER');
                    setRelationship('CLASS_TEACHER');
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    verifierType === 'CLASS_TEACHER'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span>Class Teacher / HOD</span>
                </button>
              </div>
            </div>

            {/* Relationship selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Relationship to Student <span className="text-cyan-400">*</span>
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {verifierType === 'GUARDIAN' ? (
                  <>
                    <option value="PARENT">Parent (Father / Mother)</option>
                    <option value="GUARDIAN">Legal Guardian</option>
                  </>
                ) : (
                  <>
                    <option value="CLASS_TEACHER">Class Teacher</option>
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="MENTOR">Faculty Mentor / Principal</option>
                  </>
                )}
              </select>
            </div>

            {/* Verifier Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Verifier Full Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                value={verifierName}
                onChange={(e) => setVerifierName(e.target.value)}
                placeholder={verifierType === 'CLASS_TEACHER' ? 'e.g. Dr. Rajesh Sharma' : 'e.g. Amit Kumar'}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 text-xs text-white placeholder-zinc-600 focus:outline-none"
              />
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Verifier Phone / Email <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  value={verifierContact}
                  onChange={(e) => setVerifierContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  {verifierType === 'CLASS_TEACHER' ? 'Teacher / Employee ID' : 'Parent Name / ID Number'} <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  value={teacherIdOrParentId}
                  onChange={(e) => setTeacherIdOrParentId(e.target.value)}
                  placeholder={verifierType === 'CLASS_TEACHER' ? 'FACULTY-2026-908' : 'Aadhaar/PAN Last 4 or Name'}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Selfie Upload */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center justify-between">
                <span>Selfie of Verifier holding ID <span className="text-cyan-400">*</span></span>
                {verifierSelfieUrl && <span className="text-emerald-400 text-[10px]">Photo Uploaded ✓</span>}
              </label>
              <div className="p-3 rounded-xl bg-black/40 border border-dashed border-white/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>{verifierSelfieUrl ? 'Selfie attached' : 'Upload clear face photo'}</span>
                </div>
                <label className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs cursor-pointer transition">
                  {isUploadingSelfie ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Uploading
                    </span>
                  ) : (
                    'Select Image'
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleSelfieUpload}
                    disabled={isUploadingSelfie}
                  />
                </label>
              </div>
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-2.5 pt-1 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 border-white/20 bg-black/40"
              />
              <span className="text-[11px] leading-relaxed">
                I hereby declare that the guardian or teacher specified above has authorized this student commercial publisher account to publish in-app digital items under AVANYX Store guidelines.
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !consentAccepted}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 ${
                  consentAccepted
                    ? 'bg-gradient-to-r from-cyan-500 to-[#9333EA] text-white shadow-cyan-500/25 cursor-pointer'
                    : 'bg-white/5 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit for Stage 2 Review</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
