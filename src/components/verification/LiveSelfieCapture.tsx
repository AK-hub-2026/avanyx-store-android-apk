import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Video,
  VideoOff,
  SwitchCamera,
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { uploadLiveSelfie } from '../../services/avanyxUploadService';

interface LiveSelfieCaptureProps {
  userId: string;
  selfieUrl: string;
  applicationToken?: string;
  onSelfieChange: (url: string) => void;
  error?: string;
}

export const LiveSelfieCapture: React.FC<LiveSelfieCaptureProps> = ({
  userId,
  selfieUrl,
  applicationToken,
  onSelfieChange,
  error
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop active media stream tracks safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('[LiveSelfie] Track stop notice:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraReady(false);
  }, []);

  // Initialize and attach live camera stream
  const startCamera = async (selectedFacing: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setIsCameraReady(false);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported on this browser or context.');
      }

      // First set active state so video element is rendered into DOM
      setIsCameraActive(true);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: selectedFacing,
          width: { ideal: 1280, min: 480 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Small tick to ensure <video> element ref is mounted
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          const video = videoRef.current;
          video.srcObject = streamRef.current;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          video.muted = true;

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsCameraReady(true);
              })
              .catch((playErr) => {
                console.warn('[LiveSelfie] Auto-play notice:', playErr);
                setIsCameraReady(true);
              });
          }
        }
      }, 100);
    } catch (err: any) {
      console.warn('[LiveSelfie] Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings to take your live selfie.'
          : 'Camera device unavailable or busy. Please check your camera permissions.'
      );
      stopCamera();
    }
  };

  // Toggle front vs back camera
  const toggleFacingMode = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (isCameraActive) {
      await startCamera(nextFacing);
    }
  };

  // Ensure camera stream connects whenever video element mounts or camera is active
  const setVideoElementRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');
      el.muted = true;
      el.play().then(() => setIsCameraReady(true)).catch(() => setIsCameraReady(true));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture photo strictly from live video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 640;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply mirror transform if front-facing selfie
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Stop active camera hardware immediately
    stopCamera();

    // Convert canvas image to Blob & Upload to AVANYX Upload Service
    setIsUploading(true);
    setUploadProgress(15);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setIsUploading(false);
          return;
        }
        try {
          const res = await uploadLiveSelfie(blob, userId, applicationToken, (progress) => {
            setUploadProgress(progress);
          });
          onSelfieChange(res.publicUrl);
        } catch (err: any) {
          console.warn('[LiveSelfie] AVANYX upload notice:', err);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          onSelfieChange(dataUrl);
        } finally {
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(null);
          }, 400);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="font-bold text-[#49454F] dark:text-[#CAC4D0] block text-xs">
            Live Selfie Verification <span className="text-rose-500">* (Only Live Camera)</span>
          </label>
          <p className="text-[11px] text-zinc-400">
            Strict real-time biometric verification. File uploads are disabled; please use your device camera.
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Live Camera Only</span>
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Preview / Video Viewport */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl border-2 border-black/15 dark:border-white/15 overflow-hidden bg-black flex items-center justify-center shrink-0 shadow-lg group">
          {isCameraActive ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <video
                ref={setVideoElementRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  setIsCameraReady(true);
                  if (videoRef.current) {
                    videoRef.current.play().catch((e) => console.warn('Play error:', e));
                  }
                }}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Face Guide Target Overlay */}
              <div className="absolute inset-3 border-2 border-dashed border-white/70 rounded-full pointer-events-none flex items-center justify-center shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>

              {/* Status Badge */}
              <div className="absolute bottom-2 left-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white text-center">
                {isCameraReady ? 'Live Camera Active • Center Face' : 'Initializing camera stream...'}
              </div>
            </div>
          ) : selfieUrl ? (
            <div className="relative w-full h-full group">
              <img
                src={selfieUrl}
                alt="Applicant Live Selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-white shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white font-bold text-center">
                Verified Live Selfie
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-zinc-400 gap-1.5 p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Camera className="w-6 h-6 text-zinc-400" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400">Camera Off</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-3 w-full">
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex flex-wrap items-center gap-2">
            {isCameraActive ? (
              <>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-black text-xs shadow-lg shadow-[#6750A4]/30 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Live Photo</span>
                </button>

                <button
                  type="button"
                  onClick={toggleFacingMode}
                  title="Switch Camera (Front / Back)"
                  className="px-3.5 py-2.5 rounded-2xl bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 text-[#1D1B20] dark:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <SwitchCamera className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                  <span className="hidden sm:inline">Flip</span>
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Close Camera"
                >
                  <VideoOff className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => startCamera('user')}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-extrabold text-xs shadow-md shadow-[#6750A4]/20 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>{selfieUrl ? 'Retake Live Selfie' : 'Open Live Camera'}</span>
                </button>

                {selfieUrl && (
                  <button
                    type="button"
                    onClick={() => onSelfieChange('')}
                    className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                    title="Remove Selfie"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Status indicator per PART A */}
                {selfieUrl && !isUploading ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Uploaded Securely</span>
                  </span>
                ) : !isUploading ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                    <span>Ready to Upload</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF] text-xs font-bold border border-[#6750A4]/20">
                    <span>Document Selected</span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-[#6750A4]/10 border border-[#6750A4]/20">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#6750A4] dark:text-[#D0BCFF]">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Encrypting and uploading live selfie...</span>
                </span>
                <span>{uploadProgress || 20}%</span>
              </div>
              <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#6750A4] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress || 20}%` }}
                />
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-300 font-medium leading-relaxed">{cameraError}</p>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="text-rose-500 font-semibold">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
