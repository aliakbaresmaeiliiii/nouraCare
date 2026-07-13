  /**
   * Production environment — used by `ng build` (see angular.json fileReplacements).
   *
   * Before store release:
   * 1. Set PROD_API_ORIGIN to your HTTPS API (e.g. https://api.dorehealth.ir)
   * 2. Create iOS OAuth client in Google Cloud → set googleIOSClientId
   * 3. Configure Sign in with Apple → set appleServiceId + appleRedirectUrl
   * 4. Match GOOGLE_CLIENT_IDS / APPLE_CLIENT_IDS on server .env
   */

  /** Public HTTPS origin of the NestJS API (no trailing slash). */
  const PROD_API_ORIGIN = 'https://api.dorehealth.ir';

  const API_VERSION_PATH = '/api/v1/';

  

  export const environment = {
    production: true,

    devAuthEmail: '',

    apiEndPoint: `${PROD_API_ORIGIN}${API_VERSION_PATH}`,
    urlProfileImg: `${PROD_API_ORIGIN}/uploads/`,
    profileImageFallback: 'assets/images/bg-01.png',

    

    /** Public URL for App Store / Play privacy policy field */
    privacyPolicyUrl: 'https://dorehealth.ir/privacy',

    /** Public HTTPS URL where the PWA is hosted (Add to Home Screen on iOS). */
    pwaInstallUrl: 'https://dorehealth.ir',

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
    appleBundleId: 'com.tecknnycs.dorehealth',
    /** Apple Services ID for Android + web Sign in with Apple. */
    appleServiceId: 'com.tecknnycs.dorehealth.signin',
    /** Return URL registered in Apple Developer for the Services ID. */
    appleRedirectUrl: `${PROD_API_ORIGIN}/auth/apple/callback`,
    /** Temporarily hide/disable Sign in with Apple on auth screens. */
    appleSignInEnabled: false,
    /**
     * When false, email sign-in/register skip OTP and go straight to home.
     * Re-enable by setting true (and EMAIL_OTP_ENABLED=true on the server).
     */
    emailOtpEnabled: false,
  };
