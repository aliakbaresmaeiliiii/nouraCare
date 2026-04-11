import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tecknnycs.muslimkids',
  appName: 'Muslim Kids',
  webDir: 'dist/app',
  server: {
    androidScheme: 'http',
    allowNavigation: ['*'],
    cleartext: true,
  },
};

export default config;
