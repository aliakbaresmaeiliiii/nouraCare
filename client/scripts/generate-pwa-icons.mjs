/**
 * PWA + iOS home-screen icons from src/assets/pwa/source-icon.svg
 * Run from client/: npm run icons:pwa
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');
const sourceIcon = path.join(clientRoot, 'src/assets/pwa/source-icon.svg');
const outDir = path.join(clientRoot, 'src/assets/icon');

const SIZES = [
  { name: 'favicon.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
];

async function main() {
  if (!fs.existsSync(sourceIcon)) {
    console.error('Missing source icon:', sourceIcon);
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const { name, size } of SIZES) {
    const outPath = path.join(outDir, name);
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 248, g: 250, b: 252, alpha: 1 },
      })
      .png()
      .toFile(outPath);
    console.log(`${name} (${size}x${size})`);
  }

  console.log('PWA icons written to src/assets/icon/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
