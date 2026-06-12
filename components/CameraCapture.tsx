import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';
import { PortalCountdown } from './PortalCountdown';
import { loadFaceApiModels, detectFaces } from '../services/faceService';
import { EraData, FaceDetectionResult, EraId } from '../types';
import { CAREERS } from '../constants';

interface CameraCaptureProps {
  era: EraData | null;
  onCapture: (image: string, faceData: FaceDetectionResult) => void;
  onBack: () => void;
  isProcessing?: boolean;
  devSelectedCareer?: string;
  setDevSelectedCareer?: (career: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ era, onCapture, onBack, isProcessing = false, devSelectedCareer = "random", setDevSelectedCareer }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imgData = event.target?.result as string;
      if (!imgData) return;

      const img = new Image();
      img.onload = async () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const canvasWidth = 1080;
        const canvasHeight = 1920;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const drawX = (canvasWidth - drawWidth) / 2;
          const drawY = (canvasHeight - drawHeight) / 2;
          
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

          const uprightImageData = canvas.toDataURL('image/jpeg', 0.9);
          setIsDetecting(true);
          try {
            const faceData = await detectFaces(canvas, modelsLoaded);
            onCapture(uprightImageData, faceData);
          } catch (err) {
            console.error("Face detection failed during upload", err);
            onCapture(uprightImageData, { maleCount: 0, femaleCount: 0, childCount: 0, totalPeople: 0 });
          } finally {
            setIsDetecting(false);
          }
        }
      };
      img.src = imgData;
    };
    reader.readAsDataURL(file);
  };


  useEffect(() => {
    const init = async () => {
      try {
        const loaded = await loadFaceApiModels();
        setModelsLoaded(loaded);

        // Booth setup: Camera is physically rotated 90 degrees.
        // We request landscape resolution and rotate it in code.
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Camera access denied or unavailable.");
        console.error(err);
      }
    };
    init();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCaptureImmediate = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isDetecting) return;
    setIsDetecting(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Final Booth Output: 1080x1920 Portrait
    const canvasWidth = 1080;
    const canvasHeight = 1920;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();

      // Booth setup: Camera is landscape and rotated 90 deg (Clockwise)
      // 1. Center the coordinate system
      ctx.translate(canvasWidth / 2, canvasHeight / 2);

      // 2. Rotate 90 degree and Mirror
      // Based on feedback, 90 deg is upright. We scale horizontally to mirror.
      ctx.rotate(Math.PI / 2);
      ctx.scale(-1, 1);

      // 3. Calculate scale to cover 1080x1920
      // Since rotated, video.width maps to canvas height (1920)
      const scale = Math.max(canvasHeight / video.videoWidth, canvasWidth / video.videoHeight);
      const drawWidth = video.videoWidth * scale;
      const drawHeight = video.videoHeight * scale;

      // 4. DrawCentered
      ctx.drawImage(video, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

      ctx.restore();

      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      // Important: Detect faces on the upright canvas for accuracy
      const faceData = await detectFaces(canvas, modelsLoaded);
      onCapture(imageData, faceData);
    }
    setIsDetecting(false);
  }, [era, modelsLoaded, onCapture, isDetecting]);

  // Store capture handler in ref to avoid effect dependency issues
  const captureRef = useRef(handleCaptureImmediate);
  useEffect(() => {
    captureRef.current = handleCaptureImmediate;
  }, [handleCaptureImmediate]);

  // Handle countdown logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Trigger Flash
      setShowFlash(true);

      const captureTimer = setTimeout(() => {
        captureRef.current?.();

        // Cleanup flash and countdown
        setTimeout(() => {
          setShowFlash(false);
          setCountdown(null);
        }, 500);
      }, 50);
      return () => clearTimeout(captureTimer);
    }
  }, [countdown]);

  const startCaptureSequence = () => {
    if (countdown !== null || isDetecting) return;
    setCountdown(3);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#050E1A]">
        <AlertCircle className="w-12 h-12 text-[#E8733A] mb-4" />
        <p className="text-[#E8D5B5]/70">{error}</p>
        <button onClick={onBack} className="mt-8 px-8 py-3 bg-[#3A0B14] text-[#E8D5B5] rounded-full border border-[#C17F4E]/30">Go Back</button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black relative flex flex-col">
      {/* Video Feed - Full Screen Portrait with Booth Rotation */}
      <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute transform rotate-[90deg] scale-x-[-1] object-cover"
          style={{
            width: '100vh',
            height: '100vw',
            maxWidth: 'none'
          }}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>



      {/* Model Loading Overlay */}
      {!modelsLoaded && !error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050E1A]/80 backdrop-blur-sm animate-fade-in">
          <RefreshCw className="w-12 h-12 text-[#C17F4E] animate-spin mb-4" />
          <p className="text-[#E8D5B5] text-lg font-bold brand-font tracking-wider">INITIALIZING AI</p>
          <p className="text-[#E8D5B5]/50 text-xs mt-2 font-mono">Loading neural networks...</p>
        </div>
      )}

      {/* ── Lalezar font ─────────────────────────────── */}
      <style>{`
        @font-face {
          font-family: 'Lalezar';
          src: url('./Lalezar-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
      `}</style>

      {/* Countdown Overlay - Portal Three.js Ring */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 pointer-events-none">
          <PortalCountdown count={countdown} />
        </div>
      )}

      {/* Flash Effect */}
      {showFlash && (
        <div className="absolute inset-0 z-[100] bg-white animate-flash-out pointer-events-none" />
      )}

      {/* Header */}
      {!isProcessing && (
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <button
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full text-[#E8D5B5] hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Development Controls */}
          <div className="bg-black/40 backdrop-blur-md p-2 rounded border border-white/20 flex gap-4 items-center">
            {era?.id === EraId.CAREERS && (
              <div className="flex flex-col gap-1 items-end">
                <label className="text-[9px] uppercase tracking-wider text-white/70 font-bold">Override Career</label>
                <select 
                  value={devSelectedCareer}
                  onChange={(e) => setDevSelectedCareer?.(e.target.value)}
                  className="bg-black/80 text-white p-1 rounded border border-white/30 text-xs outline-none focus:border-[#C17F4E]"
                >
                  <option value="random">Random</option>
                  {CAREERS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
              </div>
            )}
            
            <div className="flex flex-col gap-1 items-end">
              <label className="text-[9px] uppercase tracking-wider text-white/70 font-bold">Test Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                ref={fileInputRef}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-black/85 text-white px-3 py-1 rounded border border-white/30 text-xs font-bold hover:bg-white/15 active:scale-95 transition-all"
              >
                CHOOSE FILE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      {!isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 p-10 pb-16 z-20 flex justify-center items-center gap-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {/* Capture Button */}
          <button
            onClick={startCaptureSequence}
            disabled={isDetecting || countdown !== null}
            className="group relative w-28 h-28 flex items-center justify-center focus:outline-none"
          >
            {/* Idle Pulse Ring - Only visible when idle */}
            {!isDetecting && countdown === null && (
              <div className="absolute inset-0 rounded-full border-[6px] border-white/30 animate-pulse-medium"></div>
            )}

            {/* Main Button Construction */}
            <div className={`
            relative w-20 h-20 rounded-full border-[4px] flex items-center justify-center transition-all duration-300 z-10 bg-black/20 backdrop-blur-sm
            ${isDetecting
                ? 'border-slate-500 scale-95'
                : countdown !== null
                  ? 'border-white scale-100' // Static during countdown
                  : 'border-white group-hover:scale-105 group-active:scale-95' // Interactive idle
              }
          `}>
              {/* Inner Shutter Circle */}
              <div className={`
               rounded-full transition-all duration-300 shadow-sm
               ${isDetecting
                  ? 'w-2 h-2 bg-slate-500 opacity-0'
                  : 'w-16 h-16 bg-white' // Simple white circle always
                }
             `}></div>

              {/* Spinner Overlay */}
              {isDetecting && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          </button>

        </div>
      )}
    </div>
  );
};