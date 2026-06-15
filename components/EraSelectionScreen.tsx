import React from 'react';
import { EraData } from '../types';
import { ERAS } from '../constants';

export const EraSelectionScreen: React.FC<{ onSelectEra: (era: EraData) => void }> = ({ onSelectEra }) => {
  const careerEra = ERAS.find(e => e.isAiGenerated);
  const snapMemoryEra = ERAS.find(e => !e.isAiGenerated);

  return (
    <div className="fixed inset-0 z-[9999] bg-transparent overflow-hidden flex flex-col items-center justify-end pb-20 cursor-none p-6">
      <div className="flex flex-col items-center gap-5 animate-scale-in w-full">
        {/* Snap The Memory Button (non-AI Choice) */}
        {snapMemoryEra && (
          <button
            onClick={() => onSelectEra(snapMemoryEra)}
            className="active:scale-95 transition-transform duration-200 focus:outline-none group w-full flex justify-center"
          >
            <img
              src="./images/snap memory button.png"
              alt="Snap The Memory"
              className="w-[85%] max-w-[840px] h-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)] group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        )}

        {/* Future Major Button (AI Choice) */}
        {careerEra && (
          <button
            onClick={() => onSelectEra(careerEra)}
            className="active:scale-95 transition-transform duration-200 focus:outline-none group w-full flex justify-center"
          >
            <img
              src="./images/career button.png"
              alt="Future Major"
              className="w-[85%] max-w-[840px] h-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)] group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        )}
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
