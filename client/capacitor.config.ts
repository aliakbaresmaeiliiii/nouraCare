import type { CapacitorConfig } from '@capacitor/cli';

/** Set by `npm run cap:sync:url` so the native app loads `ng serve` over LAN (like Next dev + Cap URL). */
const capServerUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.tecknnycs.nouracare',
  appName: 'NouraCare',
  webDir: 'dist/app',
  server: {
    androidScheme: 'http',
    allowNavigation: ['*'],
    cleartext: true,
    ...(capServerUrl ? { url: capServerUrl } : {}),
  },
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
