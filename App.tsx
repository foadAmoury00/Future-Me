import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppScreen, EraData, FaceDetectionResult } from './types';
import { CameraCapture } from './components/CameraCapture';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultScreen } from './components/ResultScreen';
import { CapturePreview } from './components/CapturePreview';
import { generateHistoricalImage } from './services/geminiService';
import { Splash } from './components/Splash';
import { EraSelectionScreen } from './components/EraSelectionScreen';
import { useFramedImage } from './useFramedImage';

const SPLASH_VIDEOS = [
  './Videos/Graduation.mp4'
];

const App: React.FC = () => {
  const { applyFrame } = useFramedImage();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.SPLASH);
  const [selectedEra, setSelectedEra] = useState<EraData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [rawGeneratedImage, setRawGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [faceDetectionResult, setFaceDetectionResult] = useState<FaceDetectionResult | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [devSelectedCareer, setDevSelectedCareer] = useState<string>('random');

  const [globalStream, setGlobalStream] = useState<MediaStream | null>(null);

  // Pre-warm the camera stream globally
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        // Attempt to disable autofocus by setting focusMode to manual if supported
        try {
          const track = stream.getVideoTracks()[0];
          if (track) {
            const capabilities = track.getCapabilities() as any;
            const settings = track.getSettings() as any;
            if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
              const constraints: any = {
                advanced: [{ focusMode: 'manual' }]
              };
              // Lock current focus distance if available to prevent autofocus on brightness changes
              if (settings.focusDistance !== undefined) {
                constraints.advanced[0].focusDistance = settings.focusDistance;
              }
              await track.applyConstraints(constraints as any);
              console.log("[App] Camera focusMode set to manual and focusDistance locked successfully.");
            }
          }
        } catch (focusErr) {
          console.warn("[App] Failed to apply manual focusMode constraint:", focusErr);
        }

        setGlobalStream(stream);
        activeStream = stream;
      } catch (err) {
        console.error('[App] Global camera access failed or denied:', err);
      }
    };
    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Callback ref to play background video instantly upon mounting
  const bgVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && globalStream) {
      node.srcObject = globalStream;
      node.play().catch(err => {
        console.warn("[App] Error playing background video:", err);
      });
    }
  }, [globalStream]);

  const handleSetDevSelectedCareer = useCallback((career: string) => {
    console.log("[App] handleSetDevSelectedCareer called with:", career);
    setDevSelectedCareer(career);
    localStorage.setItem('devSelectedCareer', career);
  }, []);

  const [bgVideoIndex, setBgVideoIndex] = useState(() => {
    const saved = localStorage.getItem('splashVideoIndex');
    return saved ? parseInt(saved, 10) % SPLASH_VIDEOS.length : 0;
  });

  React.useEffect(() => {
    const saved = localStorage.getItem('splashVideoIndex');
    const idx = saved ? parseInt(saved, 10) % SPLASH_VIDEOS.length : 0;
    setBgVideoIndex(idx);
  }, [sessionKey]);

  const handleCapture = (imageSrc: string, faceData: FaceDetectionResult) => {
    setCapturedImage(imageSrc);
    setFaceDetectionResult(faceData);
    setCurrentScreen(AppScreen.PREVIEW);
  };

  const handleRestart = useCallback(() => {
    setCapturedImage(null);
    setGeneratedImage(null);
    setGeneratedPrompt('');
    setSelectedEra(null);
    setFaceDetectionResult(null);

    setSessionKey(prev => prev + 1);
    setCurrentScreen(AppScreen.SPLASH);
  }, []);

  const startAIProcessing = useCallback(async () => {
    if (!selectedEra || !capturedImage || !faceDetectionResult) return;

    setCurrentScreen(AppScreen.PROCESSING);

    try {
      if (selectedEra.isAiGenerated === false) {
        setGeneratedPrompt('Snap a Memory');
        try {
          const finalImage = await applyFrame(capturedImage, './Frame/frame in result.png', true);
          setRawGeneratedImage(capturedImage);
          setGeneratedImage(finalImage);
        } catch (err) {
          console.error("Failed to apply frame", err);
          setRawGeneratedImage(capturedImage);
          setGeneratedImage(capturedImage);
        }
        setCurrentScreen(AppScreen.RESULT);
        return;
      }

      // Execute the real AI image generation flow with retry logic
      console.log("[App] startAIProcessing - calling generateHistoricalImage with devSelectedCareer:", devSelectedCareer);
      let attempts = 0;
      const maxAttempts = 3;
      let result = null;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`[App] startAIProcessing - Attempt ${attempts} of ${maxAttempts}...`);
          result = await generateHistoricalImage(
            capturedImage,
            selectedEra,
            faceDetectionResult,
            devSelectedCareer
          );
          if (result && result.image) {
            break;
          } else {
            throw new Error("No image data received from the API.");
          }
        } catch (err) {
          console.error(`[App] startAIProcessing - Attempt ${attempts} failed:`, err);
          if (attempts >= maxAttempts) {
            console.error("[App] startAIProcessing - Max retries exceeded. Returning to Splash screen.");
            handleRestart();
            return;
          }
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (result && result.image) {
        setGeneratedPrompt(result.prompt);
        setRawGeneratedImage(result.image);
        
        try {
          const framedImage = await applyFrame(result.image, './Frame/AI frame.png', false);
          setGeneratedImage(framedImage);
        } catch (err) {
          console.error("[App] Failed to apply AI final frame", err);
          setGeneratedImage(result.image);
        }
        
        setCurrentScreen(AppScreen.RESULT);
      }
    } catch (e) {
      console.error("AI Processing Error:", e);
      // Fallback in case of unexpected errors outside the main generation call
      handleRestart();
    }
  }, [selectedEra, capturedImage, faceDetectionResult, applyFrame, devSelectedCareer, handleRestart]);



  const handleUpdateImage = (newImage: string) => {
    setGeneratedImage(newImage);
  };

  const handleGlobalClick = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.SPLASH:
        return (
          <Splash
            onDismiss={() => {
              setCurrentScreen(AppScreen.ERA_SELECTION);
            }}
          />
        );

      case AppScreen.ERA_SELECTION:
        return (
          <EraSelectionScreen
            onSelectEra={(era) => {
              setSelectedEra(era);
              setCurrentScreen(AppScreen.CAMERA);
            }}
          />
        );

      case AppScreen.CAMERA:
        return (
          <CameraCapture
            era={selectedEra}
            onCapture={handleCapture}
            onBack={() => setCurrentScreen(AppScreen.SPLASH)}
            devSelectedCareer={devSelectedCareer}
            setDevSelectedCareer={handleSetDevSelectedCareer}
            globalStream={globalStream}
          />
        );

      case AppScreen.PREVIEW:
        return capturedImage ? (
          <CapturePreview
            imageSrc={capturedImage}
            era={selectedEra}
            onRetake={() => setCurrentScreen(AppScreen.CAMERA)}
            onProceed={startAIProcessing}
          />
        ) : null;

      case AppScreen.PROCESSING:
        return <LoadingScreen isAi={selectedEra?.isAiGenerated} />;

      case AppScreen.RESULT:
        return (
          selectedEra && generatedImage ? (
            <ResultScreen
              imageSrc={generatedImage}
              rawImage={rawGeneratedImage || ''}
              prompt={generatedPrompt}
              era={selectedEra}
              faceData={faceDetectionResult}
              onRestart={handleRestart}
              onUpdateImage={handleUpdateImage}
            />
          ) : <LoadingScreen />
        );

      default:
        return (
          <Splash
            onDismiss={() => {
              setCurrentScreen(AppScreen.ERA_SELECTION);
            }}
          />
        );
    }
  };

  return (
    <div
      className="h-[100dvh] w-screen bg-transparent text-[#E8D5B5] flex flex-col overflow-hidden"
      onClick={handleGlobalClick}
    >
      {/* Layer 1: Dynamic Background Video / Blurred Camera Feed */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {currentScreen === AppScreen.SPLASH ? (
          <video
            key={`bg-video-${bgVideoIndex}`}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={SPLASH_VIDEOS[bgVideoIndex]} type="video/mp4" />
          </video>
        ) : (
          globalStream && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
              <video
                ref={bgVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute object-cover filter blur-[10px] opacity-50"
                style={{
                  width: '100vh',
                  height: '100vw',
                  maxWidth: 'none',
                  transform: 'rotate(90deg) scaleX(-1) scale(1.15)'
                }}
              />
            </div>
          )
        )}
      </div>

      {/* Layer 2: Semi-transparent Animated Gradient Filter */}
      <div
        className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500"
        style={{
          background: 'linear-gradient(-45deg, rgba(11,21,48,0.85), rgba(46,11,18,0.85), rgba(17,20,41,0.85), rgba(36,8,16,0.85))',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 22s ease-in-out infinite',
          opacity: currentScreen === AppScreen.SPLASH ? 1 : 0
        }}
      />

      {/* Layer 3: Application UI */}
      <main className="flex-grow relative z-20 h-full w-full" key={sessionKey}>
        {renderScreen()}
      </main>
    </div>
  );
};

export default App;