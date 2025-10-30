import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Gahvareh',
  webDir: 'www',
  server: {
    cleartext: true,
    allowNavigation: ['*'],
  },
};

export default config;
