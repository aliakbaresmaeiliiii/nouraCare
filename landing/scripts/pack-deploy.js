/**
 * Packs static export into one upload folder (like Angular dist).
 *
 * Usage:
 *   npm run build:deploy
 *
 * Upload `deploy-out/` to the server nginx root, e.g. /home/dorehealth/landing
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "out");
const deployOut = path.join(root, "deploy-out");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing: ${src}. Run npm run build first.`);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

rimraf(deployOut);
copyRecursive(outDir, deployOut);

console.log("Packed -> landing/deploy-out/");
console.log("Upload THIS folder to the server (nginx static root).");
console.log("No PM2 / node server.js needed.");
