/**
 * PWA + iOS home-screen icons from src/assets/branding/logo.png
 * Run from client/: npm run icons:pwa
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');
const sourceIcon = path.join(clientRoot, 'src/assets/branding/logo.png');
const outDir = path.join(clientRoot, 'src/assets/icon');

const ICON_BG = { r: 248, g: 250, b: 252, alpha: 1 };

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
    const inset = Math.round(size * 0.08);
    const iconSize = size - inset * 2;
    const icon = await sharp(sourceIcon)
      .resize(iconSize, iconSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: ICON_BG,
      },
    })
      .composite([{ input: icon, gravity: 'center' }])
      .png({ compressionLevel: 9, palette: true, effort: 10 })
      .toFile(outPath);
    console.log(`${name} (${size}x${size})`);
  }

  console.log('PWA icons written to src/assets/icon/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
