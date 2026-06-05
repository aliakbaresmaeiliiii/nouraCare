/**
 * Production environment — used by `ng build` (see angular.json fileReplacements).
 *
 * Before store release:
 * 1. Set PROD_API_ORIGIN to your HTTPS API (e.g. https://api.nouracare.com)
 * 2. Create iOS OAuth client in Google Cloud → set googleIOSClientId
 * 3. Configure Sign in with Apple → set appleServiceId + appleRedirectUrl
 * 4. Match GOOGLE_CLIENT_IDS / APPLE_CLIENT_IDS on server .env
 */

/** Public HTTPS origin of the NestJS API (no trailing slash). */
const PROD_API_ORIGIN = 'https://api.nouracare.com';

const API_VERSION_PATH = '/api/v1/';

export const environment = {
  production: true,

  devAuthEmail: '',

  apiEndPoint: `${PROD_API_ORIGIN}${API_VERSION_PATH}`,
  urlProfileImg: `${PROD_API_ORIGIN}/uploads/`,
  profileImageFallback: 'assets/images/bg-01.png',

  /** Public URL for App Store / Play privacy policy field */
  privacyPolicyUrl: 'https://nouracare.com/privacy',

  neshanBaseUrl: 'https://api.neshan.org',
  neshanApiKey: 'service.KVVe90o9etGdBaZMu1jT2tlhVuc2yXdMDcYkYded',
  mapboxToken:
    'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',

  /** OAuth 2.0 Web client (Google Cloud Console). */
  googleWebClientId:
    '1088321651982-l914r5o4bj5c73cua6qdcg0ttjnd8hbh.apps.googleusercontent.com',
  /** iOS OAuth client ID (same project, iOS application type). */
  googleIOSClientId: '',

  /** Must match Capacitor appId / Apple App ID bundle. */
  appleBundleId: 'com.tecknnycs.nouracare',
  /** Apple Services ID for Android + web Sign in with Apple. */
  appleServiceId: 'com.tecknnycs.nouracare.signin',
  /** Return URL registered in Apple Developer for the Services ID. */
  appleRedirectUrl: `${PROD_API_ORIGIN}/auth/apple/callback`,
  /** Temporarily hide/disable Sign in with Apple on auth screens. */
  appleSignInEnabled: false,
};
