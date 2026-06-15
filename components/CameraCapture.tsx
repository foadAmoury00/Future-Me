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
  globalStream?: MediaStream | null;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  era,
  onCapture,
  onBack,
  isProcessing = false,
  devSelectedCareer = "random",
  setDevSelectedCareer,
  globalStream
}) => {
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

        if (globalStream) {
          if (videoRef.current) {
            videoRef.current.srcObject = globalStream;
            videoRef.current.play().catch(err => {
              console.warn("[CameraCapture] Error playing video stream:", err);
            });
          }
        } else {
          // Booth setup: Camera is physically rotated 90 degrees.
          // We request landscape resolution and rotate it in code.
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });

          // Attempt to disable autofocus by setting focusMode to manual if supported
          try {
            const track = mediaStream.getVideoTracks()[0];
            if (track) {
              const capabilities = track.getCapabilities() as any;
              const settings = track.getSettings() as any;
              if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
                const constraints: any = {
                  advanced: [{ focusMode: 'manual' }]
                };
                // Lock current focus distance if available to prevent autofocus on brightness changes
                if (settings.focusDistance !== undefined) {
                  constraints.advanced[0].focusDistance = 500; // Fixed to ~10-20cm range
                }
                await track.applyConstraints(constraints as any);
                console.log("[CameraCapture] Camera focusMode set to manual and focusDistance locked successfully.");
              }
            }
          } catch (focusErr) {
            console.warn("[CameraCapture] Failed to apply manual focusMode constraint:", focusErr);
          }

          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
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
  }, [globalStream]);

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
    setCountdown(5);
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

        {/* Foreground Frame Overlay during capturing for Snap a Memory (non-AI) */}
        {!era?.isAiGenerated && (
          <img
            src="./images/frame 15 june 2026.png"
            alt="Frame Overlay"
            className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
          />
        )}
      </div>



      {/* Model Loading Overlay */}
      {!modelsLoaded && !error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050E1A]/80 backdrop-blur-sm animate-fade-in">
          <RefreshCw className="w-12 h-12 text-[#C17F4E] animate-spin mb-4" />
          <p className="text-[#E8D5B5] text-lg font-bold brand-font tracking-wider">INITIALIZING AI</p>
          <p className="text-[#E8D5B5]/50 text-xs mt-2 font-mono">Loading neural networks...</p>
        </div>
      )}

      {/* ── Lalezar font and Spin animations ─────────────────────────────── */}
      <style>{`
        @font-face {
          font-family: 'Lalezar';
          src: url('./Lalezar-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @keyframes spin-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-anticlockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-clockwise {
          animation: spin-clockwise 3.5s linear infinite !important;
        }
        .animate-spin-anticlockwise {
          animation: spin-anticlockwise 3.5s linear infinite !important;
        }
        @keyframes ping-once {
          0% { transform: scale(1.4); opacity: 0; }
          20% { transform: scale(1); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .animate-ping-once {
          animation: ping-once 1s ease-out forwards;
        }
      `}</style>

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="relative animate-fade-in" style={{ width: 480, height: 480 }}>
            {/* Outer Ring - Anticlockwise */}
            <img
              src="./images/photo capture outer.png"
              alt="Outer Ring"
              className="absolute top-0 left-0 w-full h-full object-contain animate-spin-anticlockwise"
            />
            {/* Inner Ring - Clockwise */}
            <img
              src="./images/photo capture inner.png"
              alt="Inner Ring"
              className="absolute top-[10%] left-[10%] w-[80%] h-[80%] object-contain animate-spin-clockwise"
            />
            {/* Number Image */}
            <img
              key={countdown}
              src={
                countdown === 5 ? './images/1 (4).png' :
                  countdown === 4 ? './images/1 (3).png' :
                    countdown === 3 ? './images/1 (2).png' :
                      countdown === 2 ? './images/1 (1).png' :
                        './images/1.png'
              }
              alt={String(countdown)}
              className="absolute top-[32.5%] left-[32.5%] w-[35%] h-[35%] object-contain animate-ping-once"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
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
        </div>
      )}

      {/* Footer Controls */}
      {!isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 p-10 pb-16 z-20 flex justify-center items-center gap-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {/* Capture Button - Hidden when countdown starts or during detection */}
          {countdown === null && !isDetecting && (
            <button
              onClick={startCaptureSequence}
              className="group relative flex items-center justify-center focus:outline-none transition-transform active:scale-95 duration-200"
            >
              <img
                src="./images/capture button.png"
                alt="Capture"
                className="w-48 h-48 object-contain"
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
};