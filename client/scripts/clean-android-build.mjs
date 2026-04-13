/**
 * Deletes Android Gradle output dirs (fixes corrupt intermediates like compile-file-map.properties).
 * Run from client/: node scripts/clean-android-build.mjs
 *
 * On Windows, deep trees under node_modules\@capacitor\android\capacitor\build break normal deletes
 * (MAX_PATH, OneDrive, half-deleted .dex paths). We use robocopy /MIR from an empty folder, then
 * rmdir with \\?\ — same approach as a manual fix for "Unable to delete ... updated_navigation_xml".
 */
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');
const androidRoot = path.join(clientRoot, 'android');

const capNmBuild = path.join(
  clientRoot,
  'node_modules',
  '@capacitor',
  'android',
  'capacitor',
  'build',
);

/** Robocopy uses bitmask exit codes; 0–7 = OK for our mirror-empty use case. */
function robocopyMirrorEmptyInto(targetAbs) {
  const empty = path.join(os.tmpdir(), `cap-rm-empty-${process.pid}-${Date.now()}`);
  fs.mkdirSync(empty, { recursive: true });
  try {
    const r = spawnSync('robocopy', [empty, targetAbs, '/MIR', '/R:0', '/W:0'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    const code = r.status ?? 1;
    if (code >= 8) {
      throw new Error(`robocopy failed (exit ${code}): ${(r.stderr || r.stdout || '').trim()}`);
    }
  } finally {
    try {
      fs.rmSync(empty, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

function rmdirWinLongPath(absPath) {
  const extended = `\\\\?\\${path.resolve(absPath)}`;
  execSync(`cmd /c rmdir /s /q "${extended}"`, { stdio: 'inherit' });
}

/** Windows-only: reliably remove trees that break fs.rmSync / Explorer. */
function rmDirWinDeep(p) {
  if (!fs.existsSync(p)) return;
  const abs = path.resolve(p);
  robocopyMirrorEmptyInto(abs);
  rmdirWinLongPath(abs);
}

function rmDir(p) {
  if (!fs.existsSync(p)) return;
  if (os.platform() === 'win32') {
    rmDirWinDeep(p);
  } else {
    fs.rmSync(p, { recursive: true, force: true });
  }
  console.log('Removed', p);
}

const toRemove = [
  path.join(androidRoot, 'build'),
  path.join(androidRoot, 'app', 'build'),
  path.join(androidRoot, 'capacitor-cordova-android-plugins', 'build'),
  path.join(androidRoot, '.gradle'),
  capNmBuild,
];

console.log('Closing Gradle can help if a delete fails: close Android Studio, then retry.\n');

for (const p of toRemove) {
  try {
    rmDir(p);
  } catch (e) {
    console.error('Failed to remove:', p);
    console.error(e?.message || e);
    process.exitCode = 1;
  }
}

if (process.exitCode === 1) {
  console.error(
    '\nIf still locked: Task Manager → end "OpenJDK" / "Java" for this project, or reboot. ' +
      'OneDrive on Desktop often locks build folders — pause syncing or move the repo outside OneDrive.',
  );
} else {
  console.log('\nDone. Then: npx cap sync android   (or rebuild in Android Studio)');
}
