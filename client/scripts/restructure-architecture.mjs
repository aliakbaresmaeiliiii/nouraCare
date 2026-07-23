/**
 * Architecture-only folder restructure for the Ionic Angular client.
 * Moves folders into core/ + features/, rewrites cross-imports to @app/*.
 * Does not change service/business logic bodies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'src', 'app');

/** @type {Array<[string, string]>} */
const MOVES = [
  // Core
  ['auth', 'core/auth'],
  ['guards', 'core/guards'],
  ['layout', 'core/layout'],
  ['side-menu', 'core/side-menu'],

  // Stage existing features/ tree (reproductive-status)
  ['features', '_staging_features'],

  // Shell / tabs features
  ['splash', 'features/splash'],
  ['onboarding', 'features/onboarding'],
  ['home', 'features/home'],
  ['tools', 'features/tools'],
  ['insights', 'features/insights'],
  ['consultation', 'features/consultation'],
  ['school', 'features/school'],
  ['about', 'features/about'],
  ['notifications', 'features/notifications'],

  // Community
  ['secret-chats', 'features/community/secret-chats'],
  ['forums', 'features/community/forums'],
  ['my-friends', 'features/community/my-friends'],
  ['blocked-users', 'features/community/blocked-users'],
  ['chatbot', 'features/community/chatbot'],

  // Profile
  ['profile', 'features/profile'],
  ['edit-profile', 'features/profile/edit-profile'],
  ['saved-information', 'features/profile/saved-information'],

  // Cycle
  ['cycle-calendar', 'features/cycle/cycle-calendar'],
  ['symptoms-tracker', 'features/cycle/symptoms-tracker'],
  ['symptoms-detail', 'features/cycle/symptoms-detail'],
  ['symptoms-history', 'features/cycle/symptoms-history'],
  ['period-date-picker-page', 'features/cycle/period-date-picker-page'],
  ['edit-period', 'features/cycle/edit-period'],

  // Pregnancy
  ['pregnancy-mode', 'features/pregnancy/pregnancy-mode'],
  ['pregnancy-planning', 'features/pregnancy/pregnancy-planning'],
  ['2', 'features/pregnancy/week-detail'],
  ['react-wrapper', 'features/pregnancy/react-wrapper'],

  // Doctors
  ['doctors', 'features/doctors/doctors'],
  ['doctor-profile', 'features/doctors/doctor-profile'],
  ['my-favorites', 'features/doctors/my-favorites'],
  ['create-doctor', 'features/doctors/create-doctor'],

  // Shop
  ['shop', 'features/shop/shop'],
  ['payment', 'features/shop/payment'],

  // Settings / content
  ['settings', 'features/settings'],
  ['check-version', 'features/settings/check-version'],
  ['tool-pages', 'features/content/tool-pages'],
  ['article-detail', 'features/content/article-detail'],
  ['dorehealth-pro', 'features/content/dorehealth-pro'],
  ['invite-friends', 'features/content/invite-friends'],
  ['offline', 'features/misc/offline'],
  ['test', 'features/misc/test'],

  // Shared UI rename (services stay put)
  ['shared/components', 'shared/ui'],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function movePath(fromRel, toRel) {
  const from = path.join(appDir, fromRel);
  const to = path.join(appDir, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`SKIP missing: ${fromRel}`);
    return;
  }
  if (fs.existsSync(to)) {
    console.warn(`SKIP target exists: ${toRel}`);
    return;
  }
  ensureDir(path.dirname(to));
  fs.renameSync(from, to);
  console.log(`MOVED ${fromRel} -> ${toRel}`);
}

function restoreStagedReproductiveStatus() {
  const staged = path.join(
    appDir,
    '_staging_features',
    'profile',
    'reproductive-status',
  );
  const dest = path.join(appDir, 'features', 'profile', 'reproductive-status');
  if (!fs.existsSync(staged)) {
    console.warn('No staged reproductive-status');
    const stagingRoot = path.join(appDir, '_staging_features');
    if (fs.existsSync(stagingRoot)) {
      fs.rmSync(stagingRoot, { recursive: true, force: true });
    }
    return;
  }
  if (fs.existsSync(dest)) {
    const alt = path.join(
      appDir,
      'features',
      'profile',
      'reproductive-status-legacy',
    );
    if (!fs.existsSync(alt)) {
      fs.renameSync(dest, alt);
      console.log(
        'Renamed conflicting reproductive-status -> reproductive-status-legacy',
      );
    }
  }
  ensureDir(path.dirname(dest));
  fs.renameSync(staged, dest);
  console.log('Restored features/profile/reproductive-status from staging');

  const stagingRoot = path.join(appDir, '_staging_features');
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  console.log('Removed _staging_features');
}

function buildPrefixMap() {
  /** @type {Array<[string, string]>} */
  const entries = [];
  for (const [from, to] of MOVES) {
    if (from === 'features') continue;
    entries.push([from.replace(/\\/g, '/'), to.replace(/\\/g, '/')]);
  }
  // Longest prefix first
  entries.sort((a, b) => b[0].length - a[0].length);
  return entries;
}

const PREFIX_MAP = buildPrefixMap();

function mapOldAppRelToNew(appRel) {
  const clean = appRel
    .replace(/\\/g, '/')
    .replace(/\.(ts|tsx|js|jsx)$/, '');

  for (const [from, to] of PREFIX_MAP) {
    if (clean === from || clean.startsWith(from + '/')) {
      return to + clean.slice(from.length);
    }
  }
  return clean;
}

function resolveRelativeToApp(filePath, spec) {
  if (!spec.startsWith('.')) return null;
  const abs = path.resolve(path.dirname(filePath), spec);
  const rel = path.relative(appDir, abs).replace(/\\/g, '/');
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel;
}

function toAtApp(appRelNoExt) {
  return '@app/' + appRelNoExt.replace(/\\/g, '/');
}

function rewriteSpecifier(filePath, spec) {
  if (!spec.startsWith('.')) return spec;
  const appRel = resolveRelativeToApp(filePath, spec);
  if (!appRel) return spec;

  // Preserve non-TS asset extensions in specifier
  const assetExt = appRel.match(/\.(json|scss|css|html|svg|png|jpg|webp)$/);
  if (assetExt) {
    // Keep relative for template/style sibling assets — caller filters
    const without = appRel.slice(0, -assetExt[0].length);
    const mapped = mapOldAppRelToNew(without);
    // For scss/html in same feature, prefer staying relative if still a sibling
    const newAbs = path.join(appDir, mapped + assetExt[0]);
    const rel = path.relative(path.dirname(filePath), newAbs).replace(/\\/g, '/');
    return rel.startsWith('.') ? rel : './' + rel;
  }

  const mapped = mapOldAppRelToNew(appRel);
  return toAtApp(mapped);
}

function rewriteFileContent(filePath, content) {
  let next = content;

  const replaceSpec = (_full, prefix, quote, spec) => {
    const updated = rewriteSpecifier(filePath, spec);
    return `${prefix}${quote}${updated}${quote}`;
  };

  next = next.replace(/(from\s+)(['"])([^'"]+)\2/g, replaceSpec);
  next = next.replace(/(import\s*\(\s*)(['"])([^'"]+)\2/g, replaceSpec);
  next = next.replace(/(export\s+\*\s+from\s+)(['"])([^'"]+)\2/g, replaceSpec);

  return next;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.ts$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  console.log('=== Moving folders ===');
  for (const [from, to] of MOVES) {
    movePath(from, to);
  }
  restoreStagedReproductiveStatus();

  console.log('=== Rewriting imports under src/ ===');
  const srcDir = path.join(root, 'src');
  const files = walk(srcDir);
  let changed = 0;
  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    const after = rewriteFileContent(file, before);
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      changed++;
    }
  }
  console.log(`Updated ${changed} files`);
  console.log('Done moves + import rewrite.');
}

main();
