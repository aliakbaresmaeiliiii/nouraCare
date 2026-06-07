/**
 * Prints the LAN URL to open NouraCare on your phone (same Wi‑Fi).
 * Run: node scripts/print-lan-url.mjs
 */
import os from 'os';

const PORT = 4200;
const nets = os.networkInterfaces();
const ips = [];

for (const name of Object.keys(nets)) {
  for (const net of nets[name] ?? []) {
    if (net.family === 'IPv4' && !net.internal) {
      ips.push({ name, address: net.address });
    }
  }
}

console.log('\nNouraCare — open on your phone (same Wi‑Fi):\n');
if (ips.length === 0) {
  console.log('  No Wi‑Fi/LAN IPv4 found. Check your network connection.\n');
  process.exit(1);
}

for (const { name, address } of ips) {
  console.log(`  [${name}]  http://${address}:${PORT}/`);
}
console.log('\nMake sure you ran:  npm start   (or  npm run dev:lan)\n');
