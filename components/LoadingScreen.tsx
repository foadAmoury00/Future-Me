import React from 'react';
import { Fireworks3D } from './Fireworks3D';

interface LoadingScreenProps {
  isAi?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isAi = false }) => {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-transparent overflow-hidden cursor-none">
      {/* 3D WebGL Fireworks Celebration Background - disabled for AI path */}
      {!isAi && <Fireworks3D intensity="medium" />}

      {/* Atmospheric vignette overlay */}
      <div className="absolute inset-0 z-5 bg-gradient-to-tr from-[#050E1A]/40 via-transparent to-[#08162B]/30 pointer-events-none" />

      {/* Spinner Container */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-10">
        <div className="relative animate-scale-in" style={{ width: 320, height: 320 }}>
          {/* Outer Ring - Anticlockwise */}
          <img 
            src="./images/result loading outer.png" 
            alt="Outer Loading Ring" 
            className="absolute top-0 left-0 w-full h-full object-contain animate-spin-anticlockwise"
          />
          {/* Inner Ring - Clockwise */}
          <img 
            src="./images/result loading inner.png" 
            alt="Inner Loading Ring" 
            className="absolute top-[10%] left-[10%] w-[80%] h-[80%] object-contain animate-spin-clockwise"
          />
        </div>
        
        {/* Loading text below the spinner */}
        <h2 
          className="text-3xl md:text-4xl text-center text-[#E8D5B5] tracking-widest animate-pulse brand-font"
          style={{ 
            fontFamily: '"IM Fell English", serif',
            fontStyle: 'italic',
            textShadow: '0 4px 12px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)'
          }}
        >
          Initializing Visual Synthesis...
        </h2>
      </div>

      <style>{`
        .brand-font {
          font-family: 'IM Fell English', serif;
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
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
