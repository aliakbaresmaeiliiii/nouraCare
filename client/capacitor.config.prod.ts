import type { CapacitorConfig } from '@capacitor/cli';
import base from './capacitor.config';

/**
 * Production native build: HTTPS scheme, no cleartext, no dev server URL.
 * Use: npm run cap:sync:prod
 */
const config: CapacitorConfig = {
  ...base,
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: ['https://*'],
  },
};

export default config;
