/**
 * Fix misplaced @app import prefixes after folder moves.
 * Architecture-only: import path corrections, no logic changes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (/\.ts$/.test(e.name) && !e.name.endsWith('.d.ts')) out.push(f);
  }
  return out;
}

const replacements = [
  [/@app\/features\/auth\//g, '@app/core/auth/'],
  [/@app\/features\/guards\//g, '@app/core/guards/'],
  [/@app\/features\/layout\//g, '@app/core/layout/'],
  [/@app\/features\/side-menu\//g, '@app/core/side-menu/'],
  [/@app\/(?:core|features)(?:\/[a-z0-9_-]+)*\/guards\//g, '@app/core/guards/'],
  [/@app\/(?:core|features)(?:\/[a-z0-9_-]+)*\/shared\//g, '@app/shared/'],
  [/@app\/shared\/components\//g, '@app/shared/ui/'],
];

let changed = 0;
for (const file of walk(root)) {
  let c = fs.readFileSync(file, 'utf8');
  const before = c;
  for (const [re, to] of replacements) c = c.replace(re, to);
  if (c !== before) {
    fs.writeFileSync(file, c);
    changed++;
  }
}
console.log('Fixed files:', changed);
