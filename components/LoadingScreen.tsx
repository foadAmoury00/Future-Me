import React from 'react';
import { Fireworks3D } from './Fireworks3D';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  Sparkles, 
  Globe, 
  Music, 
  Code, 
  PenTool, 
  Palette, 
  Lightbulb, 
  Brain, 
  School, 
  Calculator, 
  Trophy, 
  Heart, 
  Star, 
  Compass, 
  Flag, 
  Flame, 
  Scroll, 
  Smile, 
  Book, 
  Glasses 
} from 'lucide-react';

interface LoadingScreenProps {
  isAi?: boolean;
}

// Pre-defined static background icons to avoid re-render shifts
// Positions avoid the center area (x: 30%-70%, y: 30%-70%)
const BACKGROUND_DOODLES = [
  // Top Area
  { id: 1, name: 'Sparkles', x: 10, y: 12, size: 28, color: '#FF5E97', delay: 0.2, duration: 3.5, rotation: 15 },
  { id: 2, name: 'GraduationCap', x: 25, y: 8, size: 32, color: '#A770EF', delay: 1.5, duration: 4.2, rotation: -10 },
  { id: 3, name: 'Flag', x: 50, y: 10, size: 30, color: '#3E8EED', delay: 0.8, duration: 3.8, rotation: 5 },
  { id: 4, name: 'Star', x: 72, y: 7, size: 24, color: '#FFD700', delay: 2.1, duration: 3.0, rotation: 25 },
  { id: 5, name: 'Award', x: 88, y: 14, size: 34, color: '#00E5FF', delay: 0.5, duration: 4.5, rotation: -15 },
  
  // Left Sidebar Area
  { id: 6, name: 'BookOpen', x: 8, y: 28, size: 30, color: '#00E5FF', delay: 1.1, duration: 3.9, rotation: -20 },
  { id: 7, name: 'Lightbulb', x: 22, y: 26, size: 28, color: '#FFD700', delay: 2.4, duration: 4.1, rotation: 12 },
  { id: 8, name: 'Glasses', x: 12, y: 42, size: 32, color: '#A770EF', delay: 0.3, duration: 3.6, rotation: -5 },
  { id: 9, name: 'Code', x: 24, y: 48, size: 26, color: '#FF5E97', delay: 1.7, duration: 4.4, rotation: 18 },
  { id: 10, name: 'Brain', x: 7, y: 58, size: 34, color: '#3E8EED', delay: 0.9, duration: 3.7, rotation: -12 },
  { id: 11, name: 'Music', x: 20, y: 64, size: 28, color: '#00E5FF', delay: 2.2, duration: 4.0, rotation: 15 },
  
  // Right Sidebar Area
  { id: 12, name: 'Scroll', x: 90, y: 28, size: 32, color: '#FF5E97', delay: 1.8, duration: 4.3, rotation: 20 },
  { id: 13, name: 'Trophy', x: 78, y: 24, size: 34, color: '#FFD700', delay: 0.6, duration: 3.5, rotation: -10 },
  { id: 14, name: 'Calculator', x: 86, y: 44, size: 28, color: '#3E8EED', delay: 2.3, duration: 4.2, rotation: 8 },
  { id: 15, name: 'School', x: 74, y: 49, size: 30, color: '#A770EF', delay: 1.2, duration: 3.8, rotation: -15 },
  { id: 16, name: 'PenTool', x: 92, y: 60, size: 26, color: '#00E5FF', delay: 0.4, duration: 4.6, rotation: 25 },
  { id: 17, name: 'Palette', x: 78, y: 66, size: 32, color: '#FF5E97', delay: 1.9, duration: 3.9, rotation: -8 },
  
  // Bottom Area
  { id: 18, name: 'Compass', x: 14, y: 78, size: 30, color: '#FFD700', delay: 0.7, duration: 4.0, rotation: 30 },
  { id: 19, name: 'Book', x: 28, y: 86, size: 28, color: '#3E8EED', delay: 1.4, duration: 3.7, rotation: -15 },
  { id: 20, name: 'Heart', x: 48, y: 88, size: 26, color: '#FF5E97', delay: 2.5, duration: 3.3, rotation: 5 },
  { id: 21, name: 'Smile', x: 68, y: 85, size: 30, color: '#A770EF', delay: 0.2, duration: 4.1, rotation: 10 },
  { id: 22, name: 'Flame', x: 86, y: 79, size: 28, color: '#FFD700', delay: 1.6, duration: 3.6, rotation: -20 },
  
  // Extra Scattered Accents (Corners & Mid-Gaps)
  { id: 23, name: 'Star', x: 5, y: 8, size: 20, color: '#3E8EED', delay: 2.8, duration: 3.2, rotation: 40 },
  { id: 24, name: 'Sparkles', x: 94, y: 6, size: 22, color: '#A770EF', delay: 1.0, duration: 3.4, rotation: -30 },
  { id: 25, name: 'Globe', x: 3, y: 85, size: 26, color: '#00E5FF', delay: 0.5, duration: 4.3, rotation: 12 },
  { id: 26, name: 'Star', x: 95, y: 92, size: 22, color: '#FF5E97', delay: 1.3, duration: 3.1, rotation: -15 },
  { id: 27, name: 'Sparkles', x: 35, y: 16, size: 24, color: '#FFD700', delay: 1.7, duration: 3.8, rotation: 8 },
  { id: 28, name: 'Star', x: 65, y: 15, size: 22, color: '#00E5FF', delay: 0.9, duration: 4.0, rotation: -22 }
];

const iconMap: Record<string, React.ComponentType<any>> = {
  GraduationCap,
  Award,
  BookOpen,
  Sparkles,
  Globe,
  Music,
  Code,
  PenTool,
  Palette,
  Lightbulb,
  Brain,
  School,
  Calculator,
  Trophy,
  Heart,
  Star,
  Compass,
  Flag,
  Flame,
  Scroll,
  Smile,
  Book,
  Glasses
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isAi = false }) => {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md overflow-hidden select-none">
      {/* 3D WebGL Fireworks Celebration Background - glowing behind the dark overlay */}
      <Fireworks3D intensity="subtle" />

      {/* Atmospheric dark vignette and grid pattern overlay */}
      <div className="absolute inset-0 z-5 bg-radial-gradient pointer-events-none opacity-40" />

      {/* Scattered Blinking Background Doodles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {BACKGROUND_DOODLES.map((doodle) => {
          const IconComponent = iconMap[doodle.name] || GraduationCap;
          return (
            <div
              key={doodle.id}
              className="absolute animate-doodle-pulse"
              style={{
                left: `${doodle.x}%`,
                top: `${doodle.y}%`,
                transform: `translate(-50%, -50%) rotate(${doodle.rotation}deg)`,
                color: doodle.color,
                filter: `drop-shadow(0 0 8px ${doodle.color}40)`,
                animationDelay: `${doodle.delay}s`,
                animationDuration: `${doodle.duration}s`,
                opacity: 0.4
              }}
            >
              <IconComponent size={doodle.size} strokeWidth={1.5} />
            </div>
          );
        })}
      </div>

      {/* Center Container: Floating Mortarboard and Loading Text */}
      <div className="relative z-20 flex flex-col items-center justify-center gap-12">
        {/* Floating Mortarboard Area with glowing halo rings */}
        <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>
          {/* Inner Golden Halo Circle */}
          <div className="absolute w-[240px] h-[240px] rounded-full border-2 border-dashed border-[#FFD700]/30 animate-spin-slow" />
          
          {/* Outer Cyan/Pink Halo Circle */}
          <div className="absolute w-[270px] h-[270px] rounded-full border border-dotted border-[#00E5FF]/20 animate-spin-reverse-slow" />

          {/* Glowing Ambient Backlight */}
          <div className="absolute w-[160px] h-[160px] bg-gradient-to-tr from-[#A770EF]/30 to-[#FF5E97]/30 blur-[60px] rounded-full animate-pulse" />

          {/* Floating Mortarboard Logo */}
          <div className="relative z-30 animate-mortarboard-float">
            <GraduationCap 
              size={140} 
              strokeWidth={1.2} 
              className="text-[#FFD700] drop-shadow-[0_0_25px_rgba(255,215,0,0.6)]"
            />
            {/* Hanging Diploma Ribbon accent */}
            <div className="absolute -bottom-2 right-12 w-6 h-6 animate-pulse">
              <Scroll size={28} className="text-[#FF5E97] drop-shadow-[0_0_8px_rgba(255,94,151,0.5)]" />
            </div>
          </div>

          {/* Sparkle particles floating around */}
          <div className="absolute top-10 left-12 animate-sparkle-one">
            <Sparkles size={20} className="text-[#00E5FF] opacity-70" />
          </div>
          <div className="absolute bottom-12 right-10 animate-sparkle-two">
            <Sparkles size={16} className="text-[#A770EF] opacity-70" />
          </div>
        </div>
        
        {/* Title and Loading text below the center logo */}
        <div className="flex flex-col items-center gap-4 max-w-md px-6 text-center">
          <h1 
            className="text-lg md:text-xl uppercase tracking-[0.25em] text-[#E8D5B5] opacity-60 font-semibold"
            style={{ fontFamily: '"IM Fell English", serif' }}
          >
            Europaschule Kairo
          </h1>
          <h2 
            className="text-3xl md:text-4xl text-[#FFD700] tracking-widest animate-pulse font-bold brand-font"
            style={{ 
              fontFamily: '"IM Fell English", serif',
              fontStyle: 'italic',
              textShadow: '0 0 12px rgba(255,215,0,0.4), 0 4px 10px rgba(0,0,0,0.8)'
            }}
          >
            Processing your future...
          </h2>
        </div>
      </div>

      <style>{`
        .brand-font {
          font-family: 'IM Fell English', serif;
        }
        
        /* Floating Animation for Center Mortarboard */
        @keyframes mortarboard-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(1.5deg);
          }
        }
        .animate-mortarboard-float {
          animation: mortarboard-float 4s ease-in-out infinite;
        }

        /* Halo Rotation Animations */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 16s linear infinite;
        }

        /* Blinking / Pulse animation for background doodles */
        @keyframes doodle-pulse {
          0%, 100% {
            opacity: 0.12;
            transform: scale(0.9) translate(-50%, -50%);
          }
          50% {
            opacity: 0.55;
            transform: scale(1.05) translate(-50%, -50%);
          }
        }
        .animate-doodle-pulse {
          animation: doodle-pulse ease-in-out infinite;
        }

        /* Sparkle float and fade animations */
        @keyframes sparkle-one {
          0%, 100% { transform: translate(0, 0) scale(0.8); opacity: 0.3; }
          50% { transform: translate(-5px, -8px) scale(1.1); opacity: 0.8; }
        }
        @keyframes sparkle-two {
          0%, 100% { transform: translate(0, 0) scale(0.9); opacity: 0.4; }
          50% { transform: translate(6px, 10px) scale(1.2); opacity: 0.9; }
        }
        .animate-sparkle-one {
          animation: sparkle-one 3s ease-in-out infinite;
        }
        .animate-sparkle-two {
          animation: sparkle-two 3.5s ease-in-out infinite;
        }

        .bg-radial-gradient {
          background: radial-gradient(circle at center, rgba(167, 112, 239, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
        }
      `}</style>
    </div>
  );
};

