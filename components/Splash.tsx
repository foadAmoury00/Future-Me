import React, { useEffect, useRef, useState } from 'react';

const SPLASH_VIDEOS = [
  './Videos/Graduation.mp4'
];

export const Splash: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const isTransitioningRef = useRef(false);
  const [videoIndex] = useState(() => {
    const saved = localStorage.getItem('splashVideoIndex');
    return saved ? parseInt(saved, 10) % SPLASH_VIDEOS.length : 0;
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTransition = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    // Increment video index for the next session restart
    const nextIndex = (videoIndex + 1) % SPLASH_VIDEOS.length;
    localStorage.setItem('splashVideoIndex', nextIndex.toString());

    onDismiss();
  };

  const handleVideoEnded = () => {
    handleTransition();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#FAF6EE] overflow-hidden"
      onClick={handleTransition}
    >
      {/* Background Video Layer */}
      <video
        ref={videoRef}
        autoPlay
        muted={false}
        playsInline
        onEnded={handleVideoEnded}
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={SPLASH_VIDEOS[videoIndex]} type="video/mp4" />
      </video>

      {/* Warm tea-stained vintage vignette overlay */}
      <div className="absolute inset-0 z-5 bg-gradient-to-t from-[#E3D4B6]/30 via-transparent to-[#FAF6EE]/20 pointer-events-none" />
    </div>
  );
};
