import React, { useState, useCallback } from 'react';
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
  './Videos/US_01.mp4',
  './Videos/US_02.mp4',
  './Videos/US_03.mp4'
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
  const [devSelectedCareer, setDevSelectedCareer] = useState<string>(() => {
    return localStorage.getItem('devSelectedCareer') || 'random';
  });

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

  const startAIProcessing = useCallback(async () => {
    if (!selectedEra || !capturedImage || !faceDetectionResult) return;

    setCurrentScreen(AppScreen.PROCESSING);

    try {
      if (selectedEra.isAiGenerated === false) {
        setGeneratedPrompt('Snap a Memory');
        try {
          const finalImage = await applyFrame(capturedImage, './Frame/Frame.png', true);
          setRawGeneratedImage(finalImage);
          setGeneratedImage(finalImage);
        } catch (err) {
          console.error("Failed to apply frame", err);
          setRawGeneratedImage(capturedImage);
          setGeneratedImage(capturedImage);
        }
        setCurrentScreen(AppScreen.RESULT);
        return;
      }

      // Execute the real AI image generation flow
      console.log("[App] startAIProcessing - calling generateHistoricalImage with devSelectedCareer:", devSelectedCareer);
      const result = await generateHistoricalImage(
        capturedImage,
        selectedEra,
        faceDetectionResult,
        devSelectedCareer
      );

      if (result && result.image) {
        setGeneratedPrompt(result.prompt);
        
        try {
          const finalImage = await applyFrame(result.image, './Frame/Frame.png', true);
          setRawGeneratedImage(finalImage);
          setGeneratedImage(finalImage);
        } catch (err) {
          console.error("Failed to apply frame", err);
          setRawGeneratedImage(result.image);
          setGeneratedImage(result.image);
        }

        setCurrentScreen(AppScreen.RESULT);
      } else {
        throw new Error("No image data received from the API.");
      }
    } catch (e) {
      console.error("AI Processing Error:", e);
      setCurrentScreen(AppScreen.PREVIEW);
      alert('An error occurred while generating your historical portrait. Please try again.');
    }
  }, [selectedEra, capturedImage, faceDetectionResult, applyFrame, devSelectedCareer]);

  const handleRestart = () => {
    setCapturedImage(null);
    setGeneratedImage(null);
    setGeneratedPrompt('');
    setSelectedEra(null);
    setFaceDetectionResult(null);

    setSessionKey(prev => prev + 1);
    setCurrentScreen(AppScreen.SPLASH);
  };

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
        return <LoadingScreen />;

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
      {/* Layer 1: Dynamic Background Video */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
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
      </div>

      {/* Layer 2: Semi-transparent Animated Gradient Filter */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none" 
        style={{
          background: 'linear-gradient(-45deg, rgba(11,21,48,0.85), rgba(46,11,18,0.85), rgba(17,20,41,0.85), rgba(36,8,16,0.85))',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 22s ease-in-out infinite'
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