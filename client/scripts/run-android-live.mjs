/**
 * Runs `ionic capacitor run android --livereload --external` with JAVA_HOME set.
 * Gradle fails if JAVA_HOME is unset; this picks a working JDK when env is missing.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');

function javaBinName() {
  return os.platform() === 'win32' ? 'java.exe' : 'java';
}

function javaPath(home) {
  return path.join(home, 'bin', javaBinName());
}

function isWorkingJdk(home) {
  const exe = javaPath(home);
  if (!fs.existsSync(exe)) return false;
  const r = spawnSync(exe, ['-version'], { encoding: 'utf8' });
  return r.status === 0;
}

function findJavaHome() {
  if (process.env.JAVA_HOME && isWorkingJdk(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }

  const candidates = [];

  if (os.platform() === 'win32') {
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const local = process.env.LOCALAPPDATA || '';
    const javaRoot = path.join(pf, 'Java');
    if (fs.existsSync(javaRoot)) {
      for (const name of fs.readdirSync(javaRoot)) {
        if (name === 'jdk' || name.startsWith('jdk-') || name.startsWith('jdk')) {
          candidates.push(path.join(javaRoot, name));
        }
      }
    }
    candidates.push(
      path.join(pf, 'Android', 'Android Studio', 'jbr'),
      path.join(local, 'Programs', 'Android', 'Android Studio', 'jbr'),
    );
  } else {
    const roots = ['/Library/Java/JavaVirtualMachines', '/usr/lib/jvm'];
    for (const root of roots) {
      if (!fs.existsSync(root)) continue;
      for (const name of fs.readdirSync(root)) {
        const sub = path.join(root, name);
        if (name.endsWith('.jdk')) {
          candidates.push(path.join(sub, 'Contents', 'Home'));
        } else {
          candidates.push(sub);
        }
      }
    }
  }

  for (const home of candidates) {
    if (home && isWorkingJdk(home)) return home;
  }
  return null;
}

const javaHome = findJavaHome();
if (!javaHome) {
  console.error(
    'No working JDK found. Install a JDK (17+), then set JAVA_HOME to its folder (not bin), e.g. C:\\Program Files\\Java\\jdk-17',
  );
  process.exit(1);
}

process.env.JAVA_HOME = javaHome;
const bin = path.join(javaHome, 'bin');
process.env.PATH = `${bin}${path.delimiter}${process.env.PATH || ''}`;

const extra = process.argv.slice(2);
const ionicArgs = ['ionic', 'capacitor', 'run', 'android', '--livereload', '--external', ...extra];

console.error(`Using JAVA_HOME=${javaHome}`);

const r = spawnSync('npx', ionicArgs, {
  cwd: clientRoot,
  stdio: 'inherit',
  env: process.env,
  shell: os.platform() === 'win32',
});

process.exit(r.status === null ? 1 : r.status);
