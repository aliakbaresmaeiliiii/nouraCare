# DoreHealth PWA (iOS & Web)

The PWA lives inside the same `client/` Ionic app — no separate frontend project is required. Build output goes to `dist/app/` and is hosted over **HTTPS** (required for iOS “Add to Home Screen”).

## Why PWA?

App Store / Play Store distribution is limited in some regions. A PWA lets iPhone users install DoreHealth from Safari:

1. Open `https://app.dorehealth.app` (or your Firebase Hosting URL)
2. Tap **Share** → **Add to Home Screen**
3. Launch like a native app (standalone, full screen)

## Build & deploy

```bash
cd client
npm run icons:pwa      # regenerate icons (optional)
npm run build:pwa      # production build + service worker
npm run deploy:pwa     # build + firebase deploy
```

Firebase Hosting config: `client/firebase.json` (serves `dist/app`).

## Files

| Path | Purpose |
|------|---------|
| `src/manifest.webmanifest` | Install metadata, theme colors, icons |
| `ngsw-config.json` | Offline caching for JS/CSS/assets |
| `src/assets/icon/` | PWA + Apple touch icons |
| `src/assets/branding/logo.png` | Master icon for regeneration (`npm run icons:pwa`) |
| `scripts/generate-pwa-icons.mjs` | Icon generator |

## iOS notes

- Must use **HTTPS** (Firebase Hosting provides this).
- Service worker is **disabled** inside Capacitor native shells (Android APK only).
- Safe area / notch: `viewport-fit=cover` is set in `index.html`.
- Push notifications on iOS PWA require iOS 16.4+ and extra setup (not included yet).

## Local PWA test

```bash
npm run build:pwa
npx http-server dist/app -p 8080 -S -C cert.pem -K key.pem
```

Open `https://localhost:8080` on your iPhone (same Wi‑Fi) to test install flow.
