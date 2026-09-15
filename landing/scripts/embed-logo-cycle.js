const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const cyclePath = path.join(root, "public/images/human/feature-cycle.png");
const logoPath = path.join(root, "public/images/logo.png");
const tmpPath = path.join(root, "public/images/human/feature-cycle.tmp.png");

async function main() {
  const meta = await sharp(cyclePath).metadata();
  const w = meta.width;
  const h = meta.height;
  const logoSize = Math.round(w * 0.17);
  const plateSize = Math.round(logoSize * 1.35);

  const r = plateSize / 2 - 2;
  const plateSvg = Buffer.from(
    `<svg width="${plateSize}" height="${plateSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#6366f1" flood-opacity="0.18"/>
        </filter>
      </defs>
      <circle cx="${plateSize / 2}" cy="${plateSize / 2}" r="${r}"
        fill="white" fill-opacity="0.92"
        stroke="#6366f1" stroke-opacity="0.25" stroke-width="3"
        filter="url(#b)"/>
    </svg>`
  );

  const plate = await sharp(plateSvg).png().toBuffer();
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Cycle ring center (right side of the illustration)
  const cx = Math.round(w * 0.62);
  const cy = Math.round(h * 0.4);

  await sharp(cyclePath)
    .composite([
      {
        input: plate,
        left: Math.round(cx - plateSize / 2),
        top: Math.round(cy - plateSize / 2),
      },
      {
        input: logo,
        left: Math.round(cx - logoSize / 2),
        top: Math.round(cy - logoSize / 2),
      },
    ])
    .png()
    .toFile(tmpPath);

  fs.renameSync(tmpPath, cyclePath);
  console.log(`OK ${w}x${h} logo=${logoSize} at (${cx},${cy})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
