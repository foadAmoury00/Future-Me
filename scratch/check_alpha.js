import fs from 'fs';
import path from 'path';

// Simple PNG parser to find bounding box of non-transparent pixels
function getPngOpaqueBounds(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.readUInt32BE(0) !== 0x89504E47) {
      throw new Error('Not a valid PNG file');
    }
    
    // Find IHDR chunk to get width and height
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    
    // Find IDAT chunk or just read raw pixels if we can.
    // Since we don't have a full png decoder library installed, let's just log dimensions.
    // Wait, let's see if we can install pngjs or just use canvas if available?
    // Actually, we can run a simple node check using a lightweight method.
    return { width, height };
  } catch (err) {
    return { error: err.message };
  }
}

console.log('proceed countdown background:', getPngOpaqueBounds('public/images/proceed countdown background.png'));
console.log('proceed countdown outer:', getPngOpaqueBounds('public/images/proceed countdown outer.png'));
console.log('proceed countdown inner:', getPngOpaqueBounds('public/images/proceed countdown inner.png'));
