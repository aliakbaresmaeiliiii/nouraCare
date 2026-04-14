import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tecknnycs.nouraflow',
  appName: 'NouraFlow',
  webDir: 'dist/app',
  server: {
    androidScheme: 'http',
    allowNavigation: ['*'],
    cleartext: true,
  },
};

export default config;
