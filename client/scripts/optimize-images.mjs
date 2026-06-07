/**
 * Lossless/near-lossless raster optimization for src/assets and server uploads.
 * Run from client/: npm run images:optimize
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');
const repoRoot = path.join(clientRoot, '..');

const SCAN_ROOTS = [
  path.join(clientRoot, 'src/assets'),
  path.join(repoRoot, 'server/public'),
  path.join(repoRoot, 'server/server/public'),
];

const SKIP_DIRS = new Set(['fonts', 'node_modules', '.git']);
const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

/** Skip PWA icons — regenerated separately from source SVG. */
const SKIP_PATH_PARTS = ['/assets/icon/'];

const JPEG_QUALITY = 82;
const PNG_COMPRESSION = 9;
const WEBP_QUALITY = 82;
const MIN_SAVINGS_BYTES = 64;
const MAX_EDGE_PX = 2048;
const RESIZE_MIN_BYTES = 350_000;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (RASTER_EXT.has(ext)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function shouldSkip(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return SKIP_PATH_PARTS.some((part) => normalized.includes(part));
}

async function maybeDownscale(pipeline, filePath, beforeSize) {
  if (beforeSize < RESIZE_MIN_BYTES) return pipeline;
  const meta = await sharp(filePath).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const longest = Math.max(width, height);
  if (longest <= MAX_EDGE_PX) return pipeline;
  return pipeline.resize(MAX_EDGE_PX, MAX_EDGE_PX, {
    fit: 'inside',
    withoutEnlargement: true,
  });
}

async function optimizeRaster(filePath) {
  const before = fs.statSync(filePath).size;
  const ext = path.extname(filePath).toLowerCase();
  const tmpPath = `${filePath}.opt.tmp`;

  let pipeline = sharp(filePath, { failOn: 'none' }).rotate();
  pipeline = await maybeDownscale(pipeline, filePath, before);

  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({
      quality: JPEG_QUALITY,
      mozjpeg: true,
      progressive: true,
    });
  } else if (ext === '.png') {
    const meta = await sharp(filePath).metadata();
    const hasAlpha = meta.hasAlpha === true;
    pipeline = pipeline.png({
      compressionLevel: PNG_COMPRESSION,
      palette: !hasAlpha,
      quality: 90,
      effort: 10,
    });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: WEBP_QUALITY, effort: 6 });
  } else {
    return { filePath, before, after: before, saved: 0, skipped: true };
  }

  await pipeline.toFile(tmpPath);
  const after = fs.statSync(tmpPath).size;
  const minSavings = before > 500_000 ? 0 : MIN_SAVINGS_BYTES;

  if (after + minSavings < before) {
    fs.renameSync(tmpPath, filePath);
    return { filePath, before, after, saved: before - after, skipped: false };
  }

  fs.unlinkSync(tmpPath);
  return { filePath, before, after: before, saved: 0, skipped: true };
}

function isBrokenPlaceholder(filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size > 2048) return false;
  const head = fs.readFileSync(filePath).subarray(0, 80).toString('utf8');
  return head.includes('<?xml') || head.includes('<Error>');
}

async function repairBrokenPlaceholders() {
  const sourceIcon = path.join(clientRoot, 'src/assets/pwa/source-icon.svg');
  const welcomeJpg = path.join(clientRoot, 'src/assets/images/welcome2.jpg');
  const nurse = path.join(clientRoot, 'src/assets/images/nurse.png');

  const appIconWelcome = path.join(clientRoot, 'src/assets/branding/AppIcon-welcome.png');
  if (fs.existsSync(sourceIcon)) {
    await sharp(sourceIcon)
      .resize(224, 224, {
        fit: 'contain',
        background: { r: 248, g: 250, b: 252, alpha: 1 },
      })
      .png({ compressionLevel: PNG_COMPRESSION, palette: true, effort: 10 })
      .toFile(appIconWelcome);
    console.log('Regenerated AppIcon-welcome.png from source-icon.svg (224px)');
  }

  const welcome2Png = path.join(clientRoot, 'src/assets/images/welcome2.png');
  if (fs.existsSync(welcome2Png) && fs.existsSync(welcomeJpg)) {
    const pngSize = fs.statSync(welcome2Png).size;
    const jpgSize = fs.statSync(welcomeJpg).size;
    if (isBrokenPlaceholder(welcome2Png) || pngSize > jpgSize * 1.25) {
      fs.unlinkSync(welcome2Png);
      console.log(
        `Removed welcome2.png (${Math.round(pngSize / 1024)} KB); app uses welcome2.jpg (${Math.round(jpgSize / 1024)} KB)`,
      );
    }
  }

  const bg01 = path.join(clientRoot, 'src/assets/images/bg-01.png');
  if (isBrokenPlaceholder(bg01) && fs.existsSync(nurse)) {
    await sharp(nurse)
      .resize(128, 128, { fit: 'cover' })
      .blur(1.2)
      .png({ compressionLevel: PNG_COMPRESSION, palette: true, effort: 10 })
      .toFile(bg01);
    console.log('Rebuilt bg-01.png placeholder from nurse.png');
  }
}

function optimizeSvg(filePath) {
  const before = fs.readFileSync(filePath, 'utf8');
  const after = before
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/"\s+/g, '" ')
    .trim();
  if (after.length + 8 < before.length) {
    fs.writeFileSync(filePath, after, 'utf8');
    return { before: before.length, after: after.length, saved: before.length - after.length };
  }
  return { before: before.length, after: before.length, saved: 0 };
}

async function ensureMissingAvatars() {
  const nurse = path.join(clientRoot, 'src/assets/images/nurse.png');
  const targets = [
    path.join(clientRoot, 'src/assets/default-avatar.png'),
    path.join(clientRoot, 'src/assets/images/user-avatar.png'),
  ];

  if (!fs.existsSync(nurse)) return;

  for (const target of targets) {
    if (!fs.existsSync(target)) {
      await sharp(nurse)
        .resize(256, 256, { fit: 'cover' })
        .png({ compressionLevel: PNG_COMPRESSION, palette: true, effort: 10 })
        .toFile(target);
      console.log(`Created missing avatar: ${path.relative(clientRoot, target)}`);
    }
  }
}

/** Asset paths not referenced anywhere in the app (verified against src/). */
const UNUSED_ASSET_PATHS = [
  'src/assets/branding/AppIcon.png',
  'src/assets/branding/appIcon1.png',
  'src/assets/branding/download.png',
  'src/assets/branding/finger-heart.png',
  'src/assets/images/welcome1.jpg',
  'src/assets/images/welcome3.jpg',
  'src/assets/images/avatarMen.png',
  'src/assets/images/avatarWomen.png',
  'src/assets/images/heart.png',
  'src/assets/images/instagram.png',
  'src/assets/images/telegram.png',
  'src/assets/images/noura.jpg',
  'src/assets/images/verified.png',
  'src/assets/images/wave.svg',
  'src/assets/images/onboarding/step2.jpg',
  'src/assets/images/onboarding/step3.jpg',
  'src/assets/images/onboarding/track-pregnancy-intro-confirm.png',
  'src/assets/images/onboarding/track-pregnancy-intro-step13-premium.png',
  'src/assets/images/onboarding/track-pregnancy-intro-step2-hearts.png',
  'src/assets/images/onboarding/track-pregnancy-intro-step3-privacy.png',
  'src/assets/images/onboarding/track-pregnancy-intro-step6-insights.png',
  'src/assets/svg/weeks4-5.png',
  'src/assets/svg/weeks6-7.png',
  'src/assets/svg/weeks8-9.png',
  'src/assets/svg/weeks10-12.png',
  'src/assets/svg/weeks-13-15.png',
];

const UNUSED_ASSET_DIRS = [
  'src/assets/branding/social',
  'src/assets/images/fetus',
  'src/assets/images/sliders',
  'src/assets/images/tools',
];

function removePath(targetPath) {
  if (!fs.existsSync(targetPath)) return 0;
  const size = fs.statSync(targetPath).size;
  fs.rmSync(targetPath, { recursive: true, force: true });
  return size;
}

function removeUnusedAssets() {
  let removedBytes = 0;
  let removedCount = 0;

  for (const relPath of UNUSED_ASSET_PATHS) {
    const abs = path.join(clientRoot, relPath);
    const saved = removePath(abs);
    if (saved > 0) {
      removedBytes += saved;
      removedCount += 1;
      console.log(`Removed unused asset: ${relPath} (${Math.round(saved / 1024)} KB)`);
    }
  }

  for (const relDir of UNUSED_ASSET_DIRS) {
    const abs = path.join(clientRoot, relDir);
    if (!fs.existsSync(abs)) continue;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const child = path.join(abs, entry.name);
      const saved = removePath(child);
      if (saved > 0) {
        removedBytes += saved;
        removedCount += 1;
        console.log(
          `Removed unused asset: ${path.join(relDir, entry.name).replace(/\\/g, '/')} (${Math.round(saved / 1024)} KB)`,
        );
      }
    }
    if (fs.existsSync(abs) && fs.readdirSync(abs).length === 0) {
      fs.rmdirSync(abs);
    }
  }

  if (removedCount) {
    console.log(
      `Removed ${removedCount} unused asset file(s), freed ${Math.round(removedBytes / 1024)} KB`,
    );
  }
}

async function convertOversizedOpaquePngs() {
  const uploadRoots = [
    path.join(repoRoot, 'server/public/uploads'),
    path.join(repoRoot, 'server/server/public/uploads'),
  ];
  const minBytes = 400_000;
  let savedBytes = 0;
  let converted = 0;

  for (const uploadRoot of uploadRoots) {
    if (!fs.existsSync(uploadRoot)) continue;
    for (const filePath of walk(uploadRoot)) {
      if (!filePath.toLowerCase().endsWith('.png')) continue;
      const before = fs.statSync(filePath).size;
      if (before < minBytes) continue;

      const meta = await sharp(filePath).metadata();
      if (meta.hasAlpha) continue;

      const jpegPath = filePath.replace(/\.png$/i, '.jpg');
      await sharp(filePath)
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
        .toFile(jpegPath);

      const after = fs.statSync(jpegPath).size;
      if (after < before) {
        fs.unlinkSync(filePath);
        savedBytes += before - after;
        converted += 1;
        console.log(
          `Converted oversized PNG to JPEG: ${rel(filePath)} (${Math.round(before / 1024)} → ${Math.round(after / 1024)} KB)`,
        );
      } else {
        fs.unlinkSync(jpegPath);
      }
    }
  }

  if (converted) {
    console.log(
      `Converted ${converted} oversized PNG(s) to JPEG, saved ${Math.round(savedBytes / 1024)} KB`,
    );
  }
}

function dedupeServerUploads() {
  const uploadRoots = [
    path.join(repoRoot, 'server/public/uploads'),
    path.join(repoRoot, 'server/server/public/uploads'),
  ];

  let removedBytes = 0;
  let removedCount = 0;

  for (const uploadRoot of uploadRoots) {
    if (!fs.existsSync(uploadRoot)) continue;

    for (const bucket of fs.readdirSync(uploadRoot, { withFileTypes: true })) {
      if (!bucket.isDirectory()) continue;
      const bucketDir = path.join(uploadRoot, bucket.name);
      const byHash = new Map();

      for (const name of fs.readdirSync(bucketDir)) {
        const filePath = path.join(bucketDir, name);
        if (!fs.statSync(filePath).isFile()) continue;
        const hash = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
        const group = byHash.get(hash) ?? [];
        group.push(filePath);
        byHash.set(hash, group);
      }

      for (const group of byHash.values()) {
        if (group.length < 2) continue;
        group.sort();
        const [, ...duplicates] = group;
        for (const dup of duplicates) {
          const size = fs.statSync(dup).size;
          fs.unlinkSync(dup);
          removedBytes += size;
          removedCount += 1;
          console.log(`Removed duplicate upload: ${rel(dup)} (${Math.round(size / 1024)} KB)`);
        }
      }
    }
  }

  if (removedCount) {
    console.log(
      `Removed ${removedCount} duplicate upload(s), freed ${Math.round(removedBytes / 1024)} KB`,
    );
  }
}

function rel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

async function main() {
  removeUnusedAssets();
  dedupeServerUploads();
  await convertOversizedOpaquePngs();
  await ensureMissingAvatars();
  await repairBrokenPlaceholders();

  const files = SCAN_ROOTS.flatMap((root) => walk(root)).filter((f) => !shouldSkip(f));

  let totalBefore = 0;
  let totalAfter = 0;
  let optimized = 0;
  const topSavings = [];

  for (const filePath of files) {
    try {
      const result = await optimizeRaster(filePath);
      totalBefore += result.before;
      totalAfter += result.after;
      if (result.saved > 0) {
        optimized += 1;
        topSavings.push(result);
      }
    } catch (err) {
      console.warn(`Skip ${rel(filePath)}: ${err.message}`);
    }
  }

  topSavings.sort((a, b) => b.saved - a.saved);

  console.log('\n--- Image optimization summary ---');
  console.log(`Files scanned: ${files.length}`);
  console.log(`Files optimized: ${optimized}`);
  console.log(
    `Total: ${Math.round(totalBefore / 1024)} KB → ${Math.round(totalAfter / 1024)} KB (saved ${Math.round((totalBefore - totalAfter) / 1024)} KB)`,
  );

  if (topSavings.length) {
    console.log('\nTop savings:');
    for (const row of topSavings.slice(0, 15)) {
      console.log(
        `  -${Math.round(row.saved / 1024)} KB  ${rel(row.filePath)} (${Math.round(row.before / 1024)} → ${Math.round(row.after / 1024)} KB)`,
      );
    }
  }

  const svgFiles = walk(path.join(clientRoot, 'src/assets')).filter((f) =>
    f.toLowerCase().endsWith('.svg'),
  );
  let svgSaved = 0;
  for (const svgPath of svgFiles) {
    const result = optimizeSvg(svgPath);
    svgSaved += result.saved;
  }
  if (svgFiles.length) {
    console.log(`\nSVG files minified: ${svgFiles.length} (saved ${svgSaved} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
