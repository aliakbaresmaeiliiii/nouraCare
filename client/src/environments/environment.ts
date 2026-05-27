import { LogLevel } from 'angular-auth-oidc-client';

/** Log level for OIDC client if you wire it up later (keeps import used). */
export const oidcLogLevel = LogLevel.Debug;

export const environment = {
  firebaseConfig: {
    apiKey: 'AIzaSyBaQzqPdV4Z5hHmN_GTZHbaSkXWhKAlbIA',
    authDomain: 'clinic-55f53.firebaseapp.com',
    storageBucket: 'clinic-55f53.appspot.com',
    messagingSenderId: '357428854325',
    appId: '1:357428854325:web:04fd91819ab7e8945a3b7c',
    measurementId: 'G-Y8RLZHZ7NM',
},
  production: false,
  apiEndPoint: 'http://192.168.1.143:3000/api/v1/',
  urlProfileImg: 'http://192.168.1.143:3000/uploads/',
  // apiEndPoint: 'http://10.42.66.237:3000/api/v1/',
  // urlProfileImg: 'http://10.42.66.237:3000/uploads/',
  profileImageFallback: 'assets/images/bg-01.png',
  neshanBaseUrl: 'https://api.neshan.org',
  neshanApiKey: 'service.KVVe90o9etGdBaZMu1jT2tlhVuc2yXdMDcYkYded',
  mapboxToken:
    'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',

  /** OAuth 2.0 Web client ID (Google Cloud Console). Same as GIS `client_id` for Sign In With Google. */
  googleWebClientId:
    '1088321651982-l914r5o4bj5c73cua6qdcg0ttjnd8hbh.apps.googleusercontent.com',
  /** iOS OAuth client ID; only needed for native iOS builds. */
  googleIOSClientId: '',
};
