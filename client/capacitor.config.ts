import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tecknnycs.nouracare',
  appName: 'NouraCare',
  webDir: 'dist/app',
  server: {
    androidScheme: 'http',
    allowNavigation: ['*'],
    cleartext: true,
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
