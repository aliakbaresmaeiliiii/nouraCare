import fs from 'fs';

const txt = fs.readFileSync('scripts/school-week-en.txt', 'utf8');
const entries = {};
for (const line of txt.split('\n')) {
  const m = line.match(/^\s+'([^']+)':\s*'(.*)',\s*$/);
  if (!m) continue;
  entries[m[1]] = m[2].replace(/\\'/g, "'");
}

const out = `/** Auto-generated school week strings (EN). */\nexport const SCHOOL_WEEK_EN: Record<string, string> = ${JSON.stringify(entries, null, 2)};\n`;
fs.writeFileSync('src/app/shared/content/school-week.en.content.ts', out);
console.log('keys', Object.keys(entries).length);
