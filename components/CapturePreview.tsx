import React, { useState, useEffect, useRef } from 'react';
import { EraData } from '../types';

interface CapturePreviewProps {
  imageSrc: string;
  onRetake: () => void;
  onProceed: () => void;
  era: EraData | null;
}

export const CapturePreview: React.FC<CapturePreviewProps> = ({ 
  imageSrc, 
  onRetake, 
  onProceed, 
  era 
}) => {
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  console.log("[CapturePreview] Render - era:", era, "shouldShowFrame:", !era?.isAiGenerated);

  useEffect(() => {
    const startTimer = () => {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            onProceed();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    startTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onProceed, countdown]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-transparent flex flex-col items-center justify-center p-6">
      {/* Background - transparent overlay over the blurred global webcam */}
      <div className="absolute inset-0 z-0 bg-black/15 backdrop-blur-[2px] pointer-events-none" />

      {/* Main Preview Container - Clean rounded corners and shadow directly on the framed image */}
      <div className="w-full flex-1 max-h-[68vh] flex items-center justify-center animate-scale-in relative z-10 min-h-0">
        <div className="aspect-[2/3] max-w-full max-h-full w-auto h-auto relative rounded-[38px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
          <img 
            src={imageSrc} 
            alt="Captured Preview" 
            className="w-full h-full object-cover" 
          />
          {/* Overlay frame in preview */}
          <img
            src={era?.isAiGenerated ? "./Frame/AI frame.png" : "./Frame/frame in result.png"}
            alt="Frame Overlay"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        </div>
      </div>

      {/* Actions Container - Horizontal alignment */}
      <div className="relative z-20 flex flex-row items-center justify-center gap-10 mt-8 w-full animate-slide-in-bottom">
        
        {/* Retake Button on the left */}
        <button
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            onRetake();
          }}
          className="active:scale-95 transition-transform duration-200 focus:outline-none"
        >
          <img 
            src="./images/retake photo.png" 
            alt="Retake Photo" 
            className="h-[130px] md:h-[160px] object-contain"
          />
        </button>

        {/* Concentric countdown rings on the right */}
        {countdown > 0 && (
          <div className="relative rounded-full bg-white flex items-center justify-center shadow-lg" style={{ width: 140, height: 140 }}>
            {/* Outer Ring - Anticlockwise */}
            <img 
              src="./images/proceed countdown outer.png" 
              alt="Outer Ring" 
              className="absolute top-[6%] left-[6%] w-[88%] h-[88%] object-contain animate-spin-anticlockwise"
            />
            {/* Inner Ring - Clockwise */}
            <img 
              src="./images/proceed countdown inner.png" 
              alt="Inner Ring" 
              className="absolute top-[16%] left-[16%] w-[68%] h-[68%] object-contain animate-spin-clockwise"
            />
            {/* Number Image */}
            <img 
              key={countdown}
              src={
                countdown === 5 ? './images/1 (4) small.png' :
                countdown === 4 ? './images/1 (3) small.png' :
                countdown === 3 ? './images/1 (2) small.png' :
                countdown === 2 ? './images/1 (1) small.png' :
                './images/1 small.png'
              } 
              alt={String(countdown)} 
              className="absolute top-[34%] left-[34%] w-[32%] h-[32%] object-contain animate-ping-once"
            />
          </div>
        )}
      </div>

      <style>{`
        .brand-font {
          font-family: 'IM Fell English', serif;
        }

        @keyframes scale-in {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-in-bottom {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-bottom {
          animation: slide-in-bottom 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
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
          animation: spin-clockwise 3.5s linear infinite;
        }
        .animate-spin-anticlockwise {
          animation: spin-anticlockwise 3.5s linear infinite;
        }
        @keyframes ping-once {
          0% { transform: scale(1.35); opacity: 0; }
          20% { transform: scale(1); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .animate-ping-once {
          animation: ping-once 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
