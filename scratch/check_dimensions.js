import fs from 'fs';
import path from 'path';

// Simple PNG parser to read dimensions
function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // PNG signature check
    if (buffer.readUInt32BE(0) !== 0x89504E47) {
      throw new Error('Not a valid PNG file');
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  } catch (err) {
    return { error: err.message };
  }
}

const files = [
  'public/images/photo capture outer.png',
  'public/images/photo capture inner.png',
  'public/images/result loading outer.png',
  'public/images/result loading inner.png',
  'public/images/proceed countdown outer.png',
  'public/images/proceed countdown inner.png'
];

files.forEach(f => {
  const fullPath = path.resolve('d:/Projects/Web/US-Embassy-Photobooth', f);
  console.log(`${f}:`, getPngDimensions(fullPath));
});
