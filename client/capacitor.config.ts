import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tecknnycs.gahvareh',
  appName: 'Social Sharing App',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*'],
  },
};

export default config;
