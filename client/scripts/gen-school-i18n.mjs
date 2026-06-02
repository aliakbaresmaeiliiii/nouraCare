import fs from 'fs';

const src = fs.readFileSync('src/app/school/school.component.ts', 'utf8');
const babySrc = fs.readFileSync(
  'src/app/shared/services/baby-development.service.ts',
  'utf8',
);

const devBlock = src.match(
  /getBabyDevelopmentFacts[\s\S]*?const facts[^=]*=\s*(\{[\s\S]*?\});/,
)?.[1];
const funBlock = src.match(/getFunFacts[\s\S]*?const funFacts[^=]*=\s*(\{[\s\S]*?\});/)?.[1];
const lenBlock = src.match(/getBabyLength[\s\S]*?const lengths[^=]*=\s*(\{[\s\S]*?\});/)?.[1];

const dev = Function(`return ${devBlock}`)();
const fun = Function(`return ${funBlock}`)();
const len = Function(`return ${lenBlock}`)();

const sizeRows = [...babySrc.matchAll(
  /\{\s*week:\s*(\d+),\s*size:\s*'([^']*)',\s*weight:\s*'([^']*)',\s*description:\s*'([^']*)'\s*\}/g,
)];

const esc = (s) =>
  String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');

const lines = [];
lines.push("      'school.dev.default': 'Your baby is growing and developing beautifully! Each week brings new milestones and amazing changes.',");
lines.push("      'school.fun.default': 'Your baby is growing and developing beautifully! Each week brings new milestones and amazing changes.',");
lines.push("      'school.length.default': 'Growing...',");

for (let w = 4; w <= 40; w++) {
  if (dev[w]) lines.push(`      'school.dev.w${w}': '${esc(dev[w])}',`);
  if (fun[w]) lines.push(`      'school.fun.w${w}': '${esc(fun[w])}',`);
  if (len[w]) lines.push(`      'school.length.w${w}': '${esc(len[w])}',`);
}

for (const [, week, size, , description] of sizeRows) {
  lines.push(`      'school.size.w${week}': '${esc(size)}',`);
  lines.push(`      'school.sizeDesc.w${week}': '${esc(description)}',`);
}

fs.writeFileSync('scripts/school-week-en.txt', lines.join('\n'));
console.log('Wrote', lines.length, 'lines');
