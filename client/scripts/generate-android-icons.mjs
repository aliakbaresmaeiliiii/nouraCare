/**
 * Launcher mipmaps + splash assets from assets/branding/logo.png
 * Run from client/: npm run icons:android
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');
const branding = path.join(clientRoot, 'src/assets/branding');
const launcherIconPath = path.join(branding, 'logo.png');
const resRoot = path.join(clientRoot, 'android/app/src/main/res');

const ICON_BG = { r: 248, g: 250, b: 252, alpha: 1 };
const ICON_INSET_RATIO = 0.08;

const DENSITIES = [
  { folder: 'mipmap-mdpi', legacy: 48, foreground: 108 },
  { folder: 'mipmap-hdpi', legacy: 72, foreground: 162 },
  { folder: 'mipmap-xhdpi', legacy: 96, foreground: 216 },
  { folder: 'mipmap-xxhdpi', legacy: 144, foreground: 324 },
  { folder: 'mipmap-xxxhdpi', legacy: 192, foreground: 432 },
];

async function renderCleanSquare(pngPath, outSize, outPath) {
  const inset = Math.round(outSize * ICON_INSET_RATIO);
  const iconSize = outSize - inset * 2;
  const icon = await sharp(pngPath)
    .resize(iconSize, iconSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: outSize,
      height: outSize,
      channels: 4,
      background: ICON_BG,
    },
  })
    .composite([{ input: icon, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true, effort: 10 })
    .toFile(outPath);
}

async function renderLegacy(size, pngPath, outPath) {
  await renderCleanSquare(pngPath, size, outPath);
}

async function renderForeground(size, pngPath, outPath) {
  await renderCleanSquare(pngPath, size, outPath);
}

async function renderSplashLogo(outPath, maxSize = 420) {
  const icon = await sharp(launcherIconPath)
    .resize(maxSize, maxSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const meta = await sharp(icon).metadata();
  const pad = 48;
  const w = (meta.width || maxSize) + pad * 2;
  const h = (meta.height || maxSize) + pad * 2;

  await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: icon, gravity: 'center' }])
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outPath);
}

async function main() {
  if (!fs.existsSync(launcherIconPath)) {
    console.error('Missing asset:', launcherIconPath);
    process.exit(1);
  }
  if (!fs.existsSync(resRoot)) {
    console.error('Missing Android res:', resRoot);
    process.exit(1);
  }

  const drawableNodpi = path.join(resRoot, 'drawable-nodpi');
  if (!fs.existsSync(drawableNodpi)) {
    fs.mkdirSync(drawableNodpi, { recursive: true });
  }

  for (const { folder, legacy, foreground } of DENSITIES) {
    const dir = path.join(resRoot, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await renderLegacy(legacy, launcherIconPath, path.join(dir, 'ic_launcher.png'));
    await renderLegacy(legacy, launcherIconPath, path.join(dir, 'ic_launcher_round.png'));
    await renderForeground(foreground, launcherIconPath, path.join(dir, 'ic_launcher_foreground.png'));
    console.log(folder, '→', legacy, '/', foreground, '(logo.png)');
  }

  await renderSplashLogo(path.join(drawableNodpi, 'splash_full.png'), 420);
  await renderSplashLogo(path.join(drawableNodpi, 'splash_app_name.png'), 320);
  console.log('drawable-nodpi → splash_full.png, splash_app_name.png');
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
