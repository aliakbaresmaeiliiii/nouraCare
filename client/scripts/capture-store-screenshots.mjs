/**
 * Capture Cafe Bazaar / Play Store screenshots from the running dev app.
 *
 * Usage:
 *   1. Start API + client (`npm start` in server + client).
 *   2. Log in once in the browser OR pass tokens:
 *        $env:ACCESS_TOKEN="..."; $env:REFRESH_TOKEN="..."; node scripts/capture-store-screenshots.mjs
 *   3. Screenshots land in `client/store-screenshots/`.
 *
 * Requires: npx playwright (installed on first run).
 */

import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'store-screenshots');
const BASE_URL = process.env.APP_URL || 'http://localhost:4200';

/** Cafe Bazaar friendly phone viewport (9:19.5). */
const VIEWPORT = { width: 412, height: 892 };

const PAGES = [
  { file: '01-home-cycle', path: '/tabs/home', label: 'صفحه اصلی — ردیابی چرخه' },
  { file: '02-pregnancy-home', path: '/tabs/home', label: 'صفحه اصلی — حالت بارداری' },
  { file: '03-insights', path: '/tabs/insights', label: 'بینش‌ها و مقالات' },
  { file: '04-tools', path: '/tabs/tools', label: 'ابزارهای سلامت' },
  { file: '05-cycle-calendar', path: '/cycle-calendar', label: 'تقویم چرخه' },
  { file: '06-chatbot', path: '/chatbot', label: 'دستیار هوشمند' },
  { file: '07-forums', path: '/forums', label: 'انجمن و جامعه' },
  { file: '08-school', path: '/tabs/school', label: 'مدرسه سلامت' },
  { file: '09-consultation', path: '/tabs/consultation', label: 'مشاوره تخصصی' },
  { file: '10-symptoms-tracker', path: '/symptoms-tracker', label: 'ثبت علائم' },
];

const EXISTING_ASSETS = [
  {
    src: path.join(__dirname, '..', '..', 'landing', 'src', 'assets', 'images', 'screen-home.webp'),
    dest: 'existing-home-cycle.webp',
  },
  {
    src: path.join(__dirname, '..', '..', 'landing', 'src', 'assets', 'images', 'screen-pregnancy.webp'),
    dest: 'existing-pregnancy-home.webp',
  },
  {
    src: path.join(__dirname, '..', '..', 'landing', 'src', 'assets', 'images', 'IMG_9669.PNG'),
    dest: 'existing-home-cycle-phone.png',
  },
  {
    src: path.join(__dirname, '..', '..', 'landing', 'src', 'assets', 'images', 'IMG_9670.PNG'),
    dest: 'existing-pregnancy-home-phone.png',
  },
];

async function seedAuth(page) {
  const accessToken = process.env.ACCESS_TOKEN?.trim();
  const refreshToken = process.env.REFRESH_TOKEN?.trim();
  const userInfo = process.env.USER_INFO?.trim();

  if (!accessToken) {
    return false;
  }

  await page.addInitScript(
    ({ accessToken, refreshToken, userInfo }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('selectedLanguage', 'fa');
      if (refreshToken) {
        const existing = userInfo ? JSON.parse(userInfo) : {};
        localStorage.setItem(
          'userInfo',
          JSON.stringify({ ...existing, refreshToken }),
        );
      } else if (userInfo) {
        localStorage.setItem('userInfo', userInfo);
      }
    },
    { accessToken, refreshToken, userInfo },
  );

  return true;
}

async function copyExistingAssets() {
  for (const asset of EXISTING_ASSETS) {
    try {
      await copyFile(asset.src, path.join(OUT_DIR, asset.dest));
      console.log(`Copied ${asset.dest}`);
    } catch {
      console.warn(`Skip missing asset: ${asset.src}`);
    }
  }
}

async function interactiveLogin(context) {
  const loginPage = await context.newPage();
  await loginPage.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
  console.log('\n=== Interactive login ===');
  console.log('1. Sign in in the opened browser window.');
  console.log('2. Wait until you reach /tabs/home');
  console.log('3. Press Enter here to capture screenshots.\n');

  await new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', resolve);
  });

  const url = loginPage.url();
  await loginPage.close();
  return url.includes('/tabs/') || url.includes('/onboarding');
}

async function main() {
  const interactive = process.argv.includes('--login');
  await mkdir(OUT_DIR, { recursive: true });
  await copyExistingAssets();

  const { chromium } = await import('playwright');

  const hasToken = Boolean(process.env.ACCESS_TOKEN?.trim());
  const browser = await chromium.launch({ headless: !interactive });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'fa-IR',
    colorScheme: 'light',
  });
  const page = await context.newPage();

  let loggedIn = hasToken;
  if (hasToken) {
    await seedAuth(page);
  } else if (interactive) {
    loggedIn = await interactiveLogin(context);
    if (!loggedIn) {
      console.warn('Still on sign-in — only public pages will be captured.');
    }
  } else {
    console.log('\nNo ACCESS_TOKEN — capturing public pages only.');
    console.log('Tip: run with --login to sign in manually, then capture all pages.\n');
  }

  const publicOnly = new Set(['/cycle-calendar', '/chatbot', '/forums']);
  const targets = loggedIn
    ? PAGES
    : PAGES.filter((p) => publicOnly.has(p.path));

  for (const target of targets) {
    const url = `${BASE_URL}${target.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForTimeout(2500);

      const currentUrl = page.url();
      if (currentUrl.includes('/auth/sign-in')) {
        console.warn(`Skip ${target.file} — redirected to sign-in`);
        continue;
      }

      const outPath = path.join(OUT_DIR, `${target.file}.png`);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Saved ${target.file}.png — ${target.label}`);
    } catch (error) {
      console.error(`Failed ${target.file}:`, error.message);
    }
  }

  await browser.close();
  console.log(`\nDone. Screenshots: ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
