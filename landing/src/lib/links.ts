/** Public URLs for CTAs — override via env in production */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorehealth.ir";

/** Ionic / PWA app (separate from marketing landing) */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dorehealth.ir";

/** Store listings — set real URLs when published */
export const STORE_URLS = {
  play: process.env.NEXT_PUBLIC_PLAY_URL ?? "#",
  bazaar: process.env.NEXT_PUBLIC_BAZAAR_URL ?? "#",
  appStore: process.env.NEXT_PUBLIC_APPSTORE_URL ?? "#",
} as const;
