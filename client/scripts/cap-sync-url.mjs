/**
 * Sync Android with Capacitor `server.url` pointing at your LAN dev server
 * (same idea as Next: `next dev --hostname 0.0.0.0` + cap sync with URL).
 *
 * Terminal 1: npm run dev:lan
 * Terminal 2: npm run cap:sync:url  →  then run the app once (e.g. npm run android:live or Android Studio Run)
 *
 * To go back to bundled dist: run `npm run cap:sync` (no CAP_SERVER_URL).
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');

function parsePort(argv) {
  const arg = argv.find((a) => a.startsWith('--port='));
  if (arg) return Number(arg.slice('--port='.length)) || 4200;
  return Number(process.env.CAP_SERVER_PORT) || 4200;
}

function firstLanIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      const v4 = net.family === 'IPv4' || net.family === 4;
      if (v4 && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

const port = parsePort(process.argv.slice(2));
const host = process.env.CAP_SERVER_HOST || firstLanIPv4();
const url = `http://${host}:${port}`;

const env = { ...process.env, CAP_SERVER_URL: url };

console.error(`CAP_SERVER_URL=${url} (Angular dev server must be running, e.g. npm run dev:lan)`);

const r = spawnSync('npx', ['cap', 'sync', 'android'], {
  cwd: clientRoot,
  stdio: 'inherit',
  env,
  shell: os.platform() === 'win32',
});

process.exit(r.status === null ? 1 : r.status);
