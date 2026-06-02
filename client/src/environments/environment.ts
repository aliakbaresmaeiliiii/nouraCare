import { LogLevel } from 'angular-auth-oidc-client';

/**
 * Local development config (`ng serve`).
 *
 * To use a different machine/network for the API, change ACTIVE_BACKEND below.
 * Production builds swap this file for `environment.prod.ts` (see angular.json).
 */

/** Log level for OIDC client if you wire it up later. */
export const oidcLogLevel = LogLevel.Debug;

// ---------------------------------------------------------------------------
// Backend — pick one profile (host only; port and paths stay the same)
// ---------------------------------------------------------------------------

const BACKEND_PROFILES = {
  /** Home Wi‑Fi — API running on your LAN PC */
  house: '192.168.1.143',
  /** Phone hotspot — use your laptop IP as seen on the hotspot */
  phone: '10.42.66.237',
  /** Another network (e.g. café) */
  coffee: '192.168.1.7',
  /** phone pedar (e.g. café) */
  phonePedar: '10.209.157.237',
} as const;

/** Set to `house`, `phone`, or `coffee` to switch where API requests go. */
const ACTIVE_BACKEND: keyof typeof BACKEND_PROFILES = 'phonePedar';

const API_PORT = 3000;
const API_VERSION_PATH = '/api/v1/';

function buildLocalBackendUrls(host: string) {
  const origin = `http://${host}:${API_PORT}`;
  return {
    apiEndPoint: `${origin}${API_VERSION_PATH}`,
    urlProfileImg: `${origin}/uploads/`,
  };
}

const { apiEndPoint, urlProfileImg } = buildLocalBackendUrls(
  BACKEND_PROFILES[ACTIVE_BACKEND],
);

// ---------------------------------------------------------------------------
// App settings
// ---------------------------------------------------------------------------

export const environment = {
  production: false,

  apiEndPoint,
  urlProfileImg,
  profileImageFallback: 'assets/images/bg-01.png',

  // Maps
  neshanBaseUrl: 'https://api.neshan.org',
  neshanApiKey: 'service.KVVe90o9etGdBaZMu1jT2tlhVuc2yXdMDcYkYded',
  mapboxToken:
    'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',

  // Google Sign-In (Google Cloud Console → Credentials)
  /** OAuth 2.0 Web client ID; same value as GIS `client_id`. */
  googleWebClientId:
    '1088321651982-l914r5o4bj5c73cua6qdcg0ttjnd8hbh.apps.googleusercontent.com',
  /** iOS OAuth client ID; only needed for native iOS builds. */
  googleIOSClientId: '',

  // Firebase (optional — uncomment in environment.prod.ts when needed)
  firebaseConfig: {
    apiKey: 'AIzaSyBaQzqPdV4Z5hHmN_GTZHbaSkXWhKAlbIA',
    authDomain: 'clinic-55f53.firebaseapp.com',
    storageBucket: 'clinic-55f53.appspot.com',
    messagingSenderId: '357428854325',
    appId: '1:357428854325:web:04fd91819ab7e8945a3b7c',
    measurementId: 'G-Y8RLZHZ7NM',
  },
};
