/**
 * Force a fresh web bundle on the device after UI/design changes.
 *
 * 1. Clears Angular build cache + dist output
 * 2. Rebuilds with mobile config (local environment.ts)
 * 3. Syncs assets into android/ and patches Gradle
 *
 * Then in Android Studio: Run (debug). If the phone still shows old UI,
 * uninstall DoreHealth once and install again.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');

function run(cmd, args, label) {
  console.error(`\n→ ${label}`);
  const r = spawnSync(cmd, args, {
    cwd: clientRoot,
    stdio: 'inherit',
    env: process.env,
    shell: os.platform() === 'win32',
  });
  if ((r.status ?? 1) !== 0) {
    process.exit(r.status ?? 1);
  }
}

function rmDir(rel) {
  const abs = path.join(clientRoot, rel);
  if (!fs.existsSync(abs)) {
    return;
  }
  fs.rmSync(abs, { recursive: true, force: true });
  console.error(`Removed ${rel}`);
}

console.error('Refreshing Android web bundle (clears caches + rebuilds)…\n');

rmDir('.angular/cache');
rmDir('dist/app');

run('npm', ['run', 'build:mobile'], 'Build web app (mobile config)');
run('npx', ['cap', 'sync', 'android'], 'Capacitor sync');
run('node', ['scripts/patch-android-flatdir.mjs'], 'Patch Android Gradle');

console.error(`
Done.

Next steps:
  1. Open Android Studio and click Run (debug APK).
  2. If the phone still shows the old design, uninstall DoreHealth and run again.
  3. Do not use plain "cap sync" after "ng build" — use "npm run android:refresh" or "npm run cap:sync:mobile".
`);
