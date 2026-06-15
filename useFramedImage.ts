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

          if (isOverlay) {
            // Mode A: Frame goes OVER the photo (Transparent center PNG)
            // Make canvas the exact size of the frame
            canvas.width = frameImg.width;
            canvas.height = frameImg.height;

            // Draw the user's photo first (stretched to fit, or you can adjust math to center it)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Draw the transparent frame on top
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
            
          } else {
            // Mode B: Photo goes OVER the frame (Border padding style)
            // Calculate padding to leave room for the frame (e.g., 5%)
            const framePadding = Math.max(img.width, img.height) * 0.05; 

            canvas.width = img.width + (framePadding * 2);
            canvas.height = img.height + (framePadding * 2);

            // Draw the background frame filling the entire canvas
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

            // Draw the user's photo centered on top of the frame
            ctx.drawImage(img, framePadding, framePadding, img.width, img.height);
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
