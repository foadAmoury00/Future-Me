import React, { useState, useEffect } from 'react';
import { EraData, FaceDetectionResult } from '../types';
import { Download, RotateCcw, Loader2, Printer, CheckCircle2, XCircle } from 'lucide-react';
import { Fireworks3D } from './Fireworks3D';

interface ResultScreenProps {
  imageSrc: string;
  rawImage: string;
  prompt: string;
  era: EraData;
  faceData: FaceDetectionResult | null;
  onRestart: () => void;
  onUpdateImage: (newImage: string) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  imageSrc,
  rawImage,
  prompt,
  era,
  faceData,
  onRestart,
  onUpdateImage
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(localStorage.getItem('preferredPrinter') || '');
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'success' | string>('idle');

  // Fetch System Printers (Electron)
  useEffect(() => {
    const isElectron = navigator.userAgent.indexOf('Electron') !== -1;
    if (isElectron && (window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.invoke('get-printers').then(({ printers: pList, config }: { printers: any[], config: any }) => {
        setPrinters(pList);
        if (!selectedPrinter) {
          if (config.printerName) {
            setSelectedPrinter(config.printerName);
          } else {
            const defaultP = pList.find((p: any) => p.isDefault);
            if (defaultP) {
              setSelectedPrinter(defaultP.name);
            }
          }
        }
      }).catch((err: any) => {
        console.error('[ResultScreen] Error fetching printers:', err);
      });
    }
  }, [selectedPrinter]);

  const handlePrinterChange = (name: string) => {
    setSelectedPrinter(name);
    localStorage.setItem('preferredPrinter', name);
  };

  // Auto-Upload Image to Cloud for QR Sharing
  useEffect(() => {
    const uploadImage = async () => {
      if (!imageSrc) return;
      setIsUploading(true);
      setQrCodeUrl(null);

      try {
        const response = await fetch(imageSrc);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('image', blob, 'result.png');
        formData.append('folder', 'Future-Me');
        formData.append('metadata', JSON.stringify({
          event: 'FutureMe-Photobooth',
          photobooth_id: 'FutureMe-Photobooth',
          era: era.name,
          prompt: prompt
        }));

        let apiResponse = null;
        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const uploadRes = await fetch('https://qr-web-api.vercel.app/upload', {
              method: 'POST',
              body: formData,
            });

            if (uploadRes.ok) {
              apiResponse = await uploadRes.json();
              break;
            }
          } catch (e) {
            console.warn(`[QR API] Attempt ${attempt} failed:`, e);
          }

          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(r => setTimeout(r, delay));
          }
        }

        if (apiResponse?.qrCodeUrl) {
          setQrCodeUrl(apiResponse.qrCodeUrl);
        } else {
          throw new Error('Failed to retrieve QR code URL after retries');
        }
      } catch (error) {
        console.error('[QR API] Final Error:', error);
      } finally {
        setIsUploading(false);
      }
    };

    uploadImage();
  }, [imageSrc, era.name, prompt]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `us-embassy-photobooth-2026-${era.id}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = async () => {
    const isElectron = navigator.userAgent.indexOf('Electron') !== -1;
    setPrintStatus('printing');

    if (isElectron && (window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        let printableImage = imageSrc;

        const isCP910 = selectedPrinter.toLowerCase().includes('cp910');
        console.log(`[Printer] Model detection: "${selectedPrinter}" → ${isCP910 ? 'CP910 (safe-zone margins)' : 'Other printer (no margins)'}`);

        const preparePrintImage = async (base64: string): Promise<string> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              // Enforce exactly 1200 x 1800 resolution for printing
              canvas.width = 1200;
              canvas.height = 1800;
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(base64); return; }

              ctx.fillStyle = 'black';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              if (isCP910) {
                // Canon SELPHY CP910: apply calibrated safe-zone margins to compensate
                // for the printer's ~2% borderless bleed expansion on all sides.
                // padTop=70, padBottom=40, padLeft/Right=24 (see PRINTING_SETUP.md)
                const padTop = 70;
                const padBottom = 40;
                const padLeft = 24;
                const padRight = 24;

                ctx.drawImage(
                  img,
                  padLeft, padTop,
                  canvas.width - (padLeft + padRight),
                  canvas.height - (padTop + padBottom)
                );
                console.log('[Printer] Applied CP910 safe-zone margins');
              } else {
                // All other printers (e.g. CP1500 via PrintFab): render the image
                // edge-to-edge at full 1200x1800. The driver/RIP handles its own bleed.
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                console.log('[Printer] No margins applied — full 1200x1800 image sent to driver');
              }

              resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
            img.onerror = () => resolve(base64);
            img.src = base64;
          });
        };

        try {
          printableImage = await preparePrintImage(imageSrc);
          const result = await ipcRenderer.invoke('print-image', { imageSrc: printableImage, printerName: selectedPrinter });

          if (result.success) {
            setPrintStatus('success');
            setTimeout(() => setPrintStatus('idle'), 3000);
          } else {
            setPrintStatus(`error:${result.failureReason}`);
            setTimeout(() => setPrintStatus('idle'), 5000);
          }
        } catch (e) {
          console.error('[ResultScreen] Electron print failed', e);
          browserPrint(printableImage);
          setPrintStatus('idle');
        }
      } catch (err) {
        console.error('[ResultScreen] Print setup failed', err);
        setPrintStatus('idle');
      }
    } else {
      browserPrint(imageSrc);
      setPrintStatus('idle');
    }
  };

  const handleTestPrint = async () => {
    const isElectron = navigator.userAgent.indexOf('Electron') !== -1;
    if (!isElectron || !(window as any).require) {
      alert('Test print only works in Electron build');
      return;
    }

    setPrintStatus('printing');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 600);
        ctx.fillStyle = '#8B2942';
        ctx.fillRect(50, 50, 300, 500);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TEST PRINT', 200, 300);
      }

      const testImageSrc = canvas.toDataURL('image/png');
      const { ipcRenderer } = (window as any).require('electron');
      const result = await ipcRenderer.invoke('print-image', {
        imageSrc: testImageSrc,
        printerName: selectedPrinter
      });

      if (result.success) {
        setPrintStatus('success');
        setTimeout(() => setPrintStatus('idle'), 3000);
      } else {
        setPrintStatus(`error:${result.failureReason}`);
        setTimeout(() => setPrintStatus('idle'), 5000);
      }
    } catch (e) {
      console.error('[ResultScreen] Test print failed:', e);
      setPrintStatus('error:Exception occurred');
      setTimeout(() => setPrintStatus('idle'), 5000);
    }
  };

  const browserPrint = (src: string = imageSrc) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.write(`
        <html>
          <head>
            <style>
              @page { margin: 0; size: 4in 6in; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; background: black; }
              img { max-width: 100%; height: auto; display: block; }
            </style>
          </head>
          <body>
            <img src="${src}" />
            <script>
              window.onload = () => {
                window.focus();
                window.print();
                setTimeout(() => {
                  window.parent.document.body.removeChild(window.frameElement);
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-transparent flex flex-col items-center justify-center py-6 px-4">
      {/* 3D WebGL Fireworks Shooting Stars Background */}
      <Fireworks3D intensity="medium" />

      {/* Floating settings button on the very top-right - styled in sepia glass */}
      <div className="absolute top-4 right-4 z-20">
        {((window as any).require || navigator.userAgent.indexOf('Electron') !== -1) && (
          <button
            onClick={() => setShowPrinterSettings(true)}
            className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-[#E8D5B5] border border-white/10 shadow-lg active:scale-95 group transition-all"
            title="Printer Settings"
          >
            <Printer size={20} className="group-hover:rotate-12 transition-transform" />
          </button>
        )}
      </div>

      {/* Printing Feedback Overlay */}
      {printStatus !== 'idle' && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-[110] flex flex-col items-center justify-center animate-scale-in">
          <div className="bg-[#FAF7F2]/95 backdrop-blur-xl border-2 border-[#D2C5AD] p-12 rounded-[40px] flex flex-col items-center gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] min-w-[300px]">
            {printStatus === 'printing' && (
              <>
                <div className="relative">
                  <Printer className="text-[#B22234] animate-bounce" size={64} />
                  <div className="absolute -inset-4 bg-[#B22234]/10 blur-2xl rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl font-black text-[#201C18] uppercase tracking-widest brand-font">Printing...</span>
                  <span className="text-xs text-[#B22234]/80 font-bold uppercase tracking-widest">Preparing physical print</span>
                </div>
              </>
            )}

            {printStatus === 'success' && (
              <>
                <CheckCircle2 className="text-[#3C3B6E] animate-in zoom-in-50 duration-500" size={64} />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl font-black text-[#201C18] uppercase tracking-widest brand-font">Completed!</span>
                  <span className="text-xs text-[#3C3B6E] font-bold uppercase tracking-widest">Take your memory with you</span>
                </div>
              </>
            )}

            {typeof printStatus === 'string' && printStatus.startsWith('error') && (
              <>
                <XCircle className="text-[#E8733A]" size={64} />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl font-black text-[#201C18] uppercase tracking-widest brand-font">Printer Error</span>
                  <span className="text-xs text-[#E8733A]/85 font-bold uppercase tracking-widest text-center max-w-[250px]">
                    {printStatus.split(':')[1] || 'Unknown error occurred'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Printer Settings Overlay (Modal) */}
      {showPrinterSettings && (
        <div className="absolute inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#FAF7F2] border-2 border-[#D2C5AD] p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-[#B22234] uppercase tracking-wider brand-font">Printer Settings</h2>
              <button
                onClick={() => setShowPrinterSettings(false)}
                className="text-[#201C18]/40 hover:text-[#201C18] text-lg font-bold"
              >✕</button>
            </div>

            <div className="space-y-4">
              <label className="block text-xs uppercase tracking-widest text-[#201C18]/50 font-bold">Select Target Printer</label>
              {printers.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {printers.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handlePrinterChange(p.name)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedPrinter === p.name
                        ? 'border-[#B22234] bg-[#B22234]/10 text-[#201C18]'
                        : 'border-[#D2C5AD]/40 bg-white/40 text-[#201C18]/60 hover:bg-white/70'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate mr-2">{p.name}</span>
                        {p.isDefault && <span className="text-[10px] bg-[#E3D4B6] px-2 py-0.5 rounded uppercase font-bold text-[#201C18]/80">Default</span>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-[#201C18]/30 italic">No printers found. (Requires Electron)</div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleTestPrint}
                disabled={!selectedPrinter || printStatus === 'printing'}
                className="flex-1 bg-[#B22234] hover:bg-[#D32F2F] disabled:bg-[#FAF7F2] disabled:text-[#201C18]/20 text-[#FAF6EE] py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-md"
              >
                {printStatus === 'printing' ? 'Printing...' : 'Test Print'}
              </button>
              <button
                onClick={() => setShowPrinterSettings(false)}
                className="flex-1 py-3 bg-[#D2C5AD] hover:bg-[#C8B99D] text-[#201C18] font-bold rounded-xl transition-all uppercase tracking-widest text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Card: Clean cinematic portrait without white outline */}
      <div className="w-full max-h-[72vh] flex items-center justify-center animate-scale-in relative z-10 mb-8">
        <div className="h-full aspect-[2/3] max-w-full relative rounded-[38px] shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden bg-black">
          <img
            src={imageSrc}
            alt="Generated Portrait"
            draggable="false"
            className="w-full h-full object-cover transform transition-all duration-700"
          />
        </div>
      </div>

      {/* Bottom Stacked Grid: Stacked buttons left, QR code card right */}
      <div className="absolute bottom-6 z-10 w-full max-w-lg md:max-w-2xl px-8 flex items-center justify-center gap-10 md:gap-14 pb-4 animate-slide-in-bottom">

        {/* Left column stacked buttons */}
        <div className="flex flex-col gap-8 w-[57%]">
          {/* PRINT PHOTO Button — Patriot Red */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-4 py-5 px-8 bg-[#B22234] hover:bg-[#D32F2F] text-[#FAF6EE] font-extrabold rounded-[28px] shadow-[0_8px_16px_rgba(178,34,52,0.15)] border-b-4 border-[#7F171F] active:border-b-0 active:translate-y-1 transition-all duration-100 uppercase tracking-widest text-base md:text-xl"
          >
            <Printer size={28} />
            <span>Print Photo</span>
          </button>

          {/* NEW ADVENTURE Button — Patriot Blue */}
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-4 py-5 px-8 bg-[#3C3B6E] hover:bg-[#4E4D8A] text-[#FAF6EE] font-extrabold rounded-[28px] shadow-[0_8px_16px_rgba(60,59,110,0.15)] border-b-4 border-[#25244C] active:border-b-0 active:translate-y-1 transition-all duration-100 uppercase tracking-widest text-base md:text-xl"
          >
            <RotateCcw size={26} />
            <span>New Adventure</span>
          </button>
        </div>

        {/* Right column QR card container */}
        <div className="flex flex-col items-center gap-2.5 w-[43%]">
          <div className="w-32 h-32 md:w-36 md:h-36 bg-white rounded-[30px] md:rounded-[34px] shadow-lg p-3 relative flex items-center justify-center border border-slate-100">
            {isUploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="animate-spin text-[#B22234]" size={32} />
                <span className="text-[9.5px] text-slate-500 font-extrabold uppercase tracking-widest">Uploading</span>
              </div>
            ) : qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" draggable="false" className="w-full h-full object-contain" />
            ) : (
              <Loader2 className="animate-spin text-slate-300" size={32} />
            )}
          </div>
          <span
            className="text-sm md:text-base text-[#E8D5B5] font-black tracking-widest uppercase text-center block mt-3 animate-pulse"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}
          >
            Scan to<br />Get Your Photo
          </span>
        </div>

      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-in-bottom {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-bottom {
          animation: slide-in-bottom 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }
        .brand-font {
          font-family: 'IM Fell English', serif;
        }
      `}</style>
    </div>
  );
};