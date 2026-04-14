/**
 * Launcher mipmaps from assets/branding/download.png (cover = fills entire icon).
 * Splash assets from wordmark SVGs.
 * Run from client/: node scripts/generate-android-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');
const branding = path.join(clientRoot, 'src/assets/branding');
const launcherPngPath = path.join(branding, 'download.png');
const wordmarkSvgPath = path.join(branding, 'nouraflow-wordmark.svg');
const splashNameSvgPath = path.join(branding, 'nouraflow-splash-name.svg');
const resRoot = path.join(clientRoot, 'android/app/src/main/res');

/**
 * Scale factor > 1 zooms in slightly so the subject fills the squircle after
 * OEM masking (portrait art reads larger on the home screen).
 */
const LAUNCHER_COVER_ZOOM = 1.08;

const DENSITIES = [
  { folder: 'mipmap-mdpi', legacy: 48, foreground: 108 },
  { folder: 'mipmap-hdpi', legacy: 72, foreground: 162 },
  { folder: 'mipmap-xhdpi', legacy: 96, foreground: 216 },
  { folder: 'mipmap-xxhdpi', legacy: 144, foreground: 324 },
  { folder: 'mipmap-xxxhdpi', legacy: 192, foreground: 432 },
];

async function renderCoverSquare(pngPath, outSize, outPath) {
  const z = LAUNCHER_COVER_ZOOM;
  const inner = Math.ceil(outSize * z);
  const resized = await sharp(pngPath)
    .resize(inner, inner, {
      fit: 'cover',
      position: 'centre',
    })
    .png()
    .toBuffer();

  await sharp(resized)
    .extract({
      left: Math.floor((inner - outSize) / 2),
      top: Math.floor((inner - outSize) / 2),
      width: outSize,
      height: outSize,
    })
    .png()
    .toFile(outPath);
}

async function renderLegacy(size, pngPath, outPath) {
  await renderCoverSquare(pngPath, size, outPath);
}

async function renderForeground(size, pngPath, outPath) {
  await renderCoverSquare(pngPath, size, outPath);
}

async function renderSplashWordmark(outPath) {
  const maxW = 920;
  const overlay = await sharp(wordmarkSvgPath)
    .resize(maxW, null, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const meta = await sharp(overlay).metadata();
  const pad = 48;
  const w = (meta.width || maxW) + pad * 2;
  const h = (meta.height || 400) + pad * 2;

  await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: overlay, gravity: 'center' }])
    .png()
    .toFile(outPath);
}

async function renderSplashAppName(outPath) {
  await sharp(splashNameSvgPath)
    .resize(800, null, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outPath);
}

async function main() {
  for (const p of [launcherPngPath, wordmarkSvgPath, splashNameSvgPath]) {
    if (!fs.existsSync(p)) {
      console.error('Missing asset:', p);
      process.exit(1);
    }
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
    await renderLegacy(legacy, launcherPngPath, path.join(dir, 'ic_launcher.png'));
    await renderLegacy(legacy, launcherPngPath, path.join(dir, 'ic_launcher_round.png'));
    await renderForeground(foreground, launcherPngPath, path.join(dir, 'ic_launcher_foreground.png'));
    console.log(folder, '→', legacy, '/', foreground, '(download.png cover)');
  }

  await renderSplashWordmark(path.join(drawableNodpi, 'splash_full.png'));
  await renderSplashAppName(path.join(drawableNodpi, 'splash_app_name.png'));
  console.log('drawable-nodpi → splash_full.png, splash_app_name.png');
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
