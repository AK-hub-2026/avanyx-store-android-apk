import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RefreshCw, X, ShieldCheck, KeyRound, AlertCircle, Copy, Check } from 'lucide-react';

interface EmailOtpModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const EmailOtpModal: React.FC<EmailOtpModalProps> = ({
  email,
  isOpen,
  onClose,
  onVerified
}) => {
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpInputs, setOtpInputs] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(60);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [otpSentTime, setOtpSentTime] = useState<number>(Date.now());

  // Generate a realistic 6-digit OTP code whenever modal opens
  const sendNewOtp = () => {
    setIsSending(true);
    setErrorMsg(null);
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setOtpInputs(['', '', '', '', '', '']);
    setCountdown(60);
    setOtpSentTime(Date.now());

    setTimeout(() => {
      setIsSending(false);
    }, 400);
  };

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      sendNewOtp();
    }
  }, [isOpen, email]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, val: string) => {
    const cleanChar = val.replace(/\D/g, '').slice(-1);
    const newInputs = [...otpInputs];
    newInputs[index] = cleanChar;
    setOtpInputs(newInputs);
    setErrorMsg(null);

    // Auto-focus next input
    if (cleanChar && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }

    // Check if complete
    const fullCode = newInputs.join('');
    if (fullCode.length === 6) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newInputs = [...otpInputs];
    for (let i = 0; i < 6; i++) {
      newInputs[i] = pastedData[i] || '';
    }
    setOtpInputs(newInputs);

    if (pastedData.length === 6) {
      verifyCode(pastedData);
    }
  };

  const verifyCode = (enteredCode: string) => {
    if (enteredCode === generatedOtp) {
      setIsSuccess(true);
      setErrorMsg(null);
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1000);
    } else {
      setErrorMsg('Invalid verification code. Please check and try again.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoFill = () => {
    if (!generatedOtp) return;
    const split = generatedOtp.split('');
    setOtpInputs(split);
    verifyCode(generatedOtp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 text-[#1D1B20] dark:text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#6750A4]/15 dark:bg-[#D0BCFF]/15 text-[#6750A4] dark:text-[#D0BCFF] flex items-center justify-center mx-auto shadow-inner">
            <Mail className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Verify Your Email</h3>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-xs mx-auto">
            We sent a 6-digit security code to <strong className="text-[#1D1B20] dark:text-white break-all">{email}</strong>
          </p>
        </div>

        {/* Development / Preview Code Banner */}
        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-[#6750A4]/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF] shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Verification OTP Code</p>
              <p className="font-mono font-black text-sm tracking-widest text-[#6750A4] dark:text-[#D0BCFF]">{generatedOtp || '••••••'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg hover:bg-purple-200/50 dark:hover:bg-purple-900/50 text-[#6750A4] dark:text-[#D0BCFF] transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleAutoFill}
              className="px-2.5 py-1 rounded-lg bg-[#6750A4] text-white text-[11px] font-extrabold hover:bg-[#523e85] transition-all"
            >
              Auto-Fill
            </button>
          </div>
        </div>

        {/* 6 Digit Inputs */}
        <div className="space-y-3">
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otpInputs.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isSuccess}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-black rounded-2xl border transition-all ${
                  isSuccess
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'
                    : digit
                    ? 'border-[#6750A4] bg-purple-50/50 dark:bg-purple-950/20 text-[#1D1B20] dark:text-white ring-2 ring-[#6750A4]/30'
                    : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#1D1B20] dark:text-white'
                } focus:outline-none focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/30`}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>Email Verified Successfully!</span>
            </div>
          )}
        </div>

        {/* Resend & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs">
          <div className="text-[#49454F] dark:text-[#CAC4D0]">
            {countdown > 0 ? (
              <span>Resend in <strong className="font-mono text-[#1D1B20] dark:text-white">{countdown}s</strong></span>
            ) : (
              <button
                type="button"
                onClick={sendNewOtp}
                disabled={isSending}
                className="text-[#6750A4] dark:text-[#D0BCFF] font-bold hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => verifyCode(otpInputs.join(''))}
            disabled={otpInputs.join('').length !== 6 || isSuccess}
            className="px-5 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#523e85] disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-[#6750A4]/20 transition-all"
          >
            Verify Code
          </button>
        </div>
      </div>
    </div>
  );
};
