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
  apiEndPoint: 'http://172.20.10.4:3000/api/v1/',
  urlProfileImg: 'http://172.20.10.4:3000/uploads/',
  profileImageFallback: 'assets/images/bg-01.png',
  neshanBaseUrl: 'https://api.neshan.org',
  neshanApiKey: 'service.KVVe90o9etGdBaZMu1jT2tlhVuc2yXdMDcYkYded',
  mapboxToken:
    'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',
};
