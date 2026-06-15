import { useCallback } from 'react';

/**
 * A React hook that provides a function to apply a frame to an image.
 * This can be used in your new photobooth project to merge a captured 
 * photo with a custom frame overlay or background.
 */
export const useFramedImage = () => {
  /**
   * Applies a custom frame to a given image data URL.
   * 
   * @param imageDataUrl The base64 data URL of the original captured photo
   * @param frameImagePath The path to the custom frame image (e.g., './assets/MyNewFrame.png')
   * @param isOverlay If true, draws the frame ON TOP of the photo (for transparent PNG frames). 
   *                  If false, draws the photo on top of the frame (for borders/backgrounds).
   * @returns A Promise that resolves to the final composed image as a data URL.
   */
  const applyFrame = useCallback((
    imageDataUrl: string, 
    frameImagePath: string, 
    isOverlay: boolean = false
  ): Promise<string> => {
    return new Promise((resolve) => {
      // 1. Load the original captured image
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Helpful if dealing with external URLs
      
      img.onload = () => {
        // 2. Load your custom background/overlay frame
        const frameImg = new Image();
        frameImg.crossOrigin = "Anonymous";

        frameImg.onload = () => {
          // 3. Create an offscreen canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(imageDataUrl); // Fallback if canvas is not supported
            return;
          }

          // Make canvas the exact size of the frame (1200x1800)
          canvas.width = frameImg.width;
          canvas.height = frameImg.height;

          // Fill canvas background with white
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Helper to draw image center-cropped (cover fit)
          const drawImageCover = (c: CanvasRenderingContext2D, image: HTMLImageElement, tx: number, ty: number, tw: number, th: number) => {
            const imgRatio = image.width / image.height;
            const targetRatio = tw / th;
            let sx = 0, sy = 0, sw = image.width, sh = image.height;
            if (imgRatio > targetRatio) {
              sw = image.height * targetRatio;
              sx = (image.width - sw) / 2;
            } else {
              sh = image.width / targetRatio;
              sy = (image.height - sh) / 2;
            }
            c.drawImage(image, sx, sy, sw, sh, tx, ty, tw, th);
          };

          if (isOverlay) {
            // Mode A (Snap a Memory): Draw photo inside the transparent window coordinates of frame in result.png
            // Bounding box of transparent area in frame in result.png is minX=130, minY=334, maxX=1069, maxY=1503.
            // We apply 5px bleed to ensure it sits cleanly under the frame borders.
            const tx = 125;
            const ty = 329;
            const tw = 950;
            const th = 1180;

            drawImageCover(ctx, img, tx, ty, tw, th);
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          } else {
            // Mode B (AI Mode): Draw photo inside the transparent window coordinates of AI frame.png
            // Bounding box of transparent area in AI frame.png is minX=65, minY=62, maxX=1131, maxY=1665.
            // We apply 5px bleed to ensure it sits cleanly under the frame borders.
            const tx = 60;
            const ty = 57;
            const tw = 1080;
            const th = 1613;

            drawImageCover(ctx, img, tx, ty, tw, th);
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          }

          // 4. Resolve with the final composed image data URL
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        
        // Fallback: If the frame fails to load, return the original image
        frameImg.onerror = () => {
          console.error("Failed to load frame image from:", frameImagePath);
          resolve(imageDataUrl);
        };
        
        frameImg.src = frameImagePath;
      };
      
      img.onerror = () => {
        console.error("Failed to load original image data");
        resolve(imageDataUrl);
      };
      
      img.src = imageDataUrl;
    });
  }, []);

  return { applyFrame };
};
