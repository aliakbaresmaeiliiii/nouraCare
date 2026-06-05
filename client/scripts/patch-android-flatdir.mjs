/**
 * Removes deprecated flatDir {} blocks from Android Gradle files after `cap sync`.
 * flatDir triggers AGP warnings and is unnecessary when libs use fileTree (*.jar / *.aar).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const androidRoot = path.join(__dirname, '..', 'android');

const targets = [
  path.join(androidRoot, 'app', 'build.gradle'),
  path.join(androidRoot, 'capacitor-cordova-android-plugins', 'build.gradle'),
];

const flatDirBlock = /\n\s*flatDir\s*\{[^}]*\}/gs;

const appDepsPatch = {
  old: /implementation fileTree\(include: \['\*\.jar'\], dir: 'libs'\)/,
  new: `implementation fileTree(dir: 'libs', include: ['*.jar', '*.aar'])
    implementation fileTree(
        dir: '../capacitor-cordova-android-plugins/src/main/libs',
        include: ['*.jar', '*.aar']
    )`,
};

const cordovaJarOnly = /implementation fileTree\(dir: 'src\/main\/libs', include: \['\*\.jar'\]\)/;
const cordovaPatched =
  /implementation fileTree\(dir: 'src\/main\/libs', include: \['\*\.jar', '\*\.aar'\]\)/;

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  let text = fs.readFileSync(filePath, 'utf8');
  const before = text;

  text = text.replace(flatDirBlock, '');

  if (filePath.endsWith(`${path.sep}app${path.sep}build.gradle`)) {
    if (!text.includes("capacitor-cordova-android-plugins/src/main/libs")) {
      text = text.replace(appDepsPatch.old, appDepsPatch.new);
    }
    text = text.replace(/\nrepositories \{\s*\}\n/g, '\n');
  }

  if (filePath.includes('capacitor-cordova-android-plugins')) {
    if (!cordovaPatched.test(text)) {
      text = text.replace(
        cordovaJarOnly,
        `implementation fileTree(dir: 'src/main/libs', include: ['*.jar', '*.aar'])
    implementation fileTree(dir: 'libs', include: ['*.jar', '*.aar'])`,
      );
    }
  }

  if (text !== before) {
    fs.writeFileSync(filePath, text);
    console.log('Patched', path.relative(androidRoot, filePath));
    return true;
  }
  return false;
}

let changed = 0;
for (const p of targets) {
  if (patchFile(p)) changed += 1;
}

if (changed === 0) {
  console.log('Android Gradle files already omit flatDir.');
} else {
  console.log(`Updated ${changed} file(s).`);
}
