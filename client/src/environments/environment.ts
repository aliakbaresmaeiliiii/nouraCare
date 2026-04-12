import { LogLevel } from 'angular-auth-oidc-client';

export interface Config {
  production: boolean;
  apiEndPoint: string;
  urlProfileImg: string;
  /** Default avatar when API has no image (Angular path from project root, e.g. assets/...). */
  profileImageFallback: string;
  neshanBaseUrl: any;
  neshanApiKey: string;
  mapboxToken: string;
  firebaseConfig: {};
  oidc: any[];
}

// ********************* hostspot ********************
// export const environment = {
//   production: false,
//   apiEndPoint: 'http://192.168.50.193:8081/api/v1/',
//   urlProfileImg: 'http://192.168.50.193:8081/uploads/',
//   neshanBaseUrl: 'https://api.neshan.org',
//   neshanApiKey: 'service.KVVe90o9etGdBaZMu1jT2tlhVuc2yXdMDcYkYded',
//   mapboxToken:
//     'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',

//   firebaseConfig: {
//     apiKey: 'AIzaSyBaQzqPdV4Z5hHmN_GTZHbaSkXWhKAlbIA',
//     authDomain: 'clinic-55f53.firebaseapp.com',
//     projectId: 'clinic-55f53',
//     storageBucket: 'clinic-55f53.appspot.com',
//     messagingSenderId: '357428854325',
//     appId: '1:357428854325:web:04fd91819ab7e8945a3b7c',
//     measurementId: 'G-Y8RLZHZ7NM',
//   },
// };

// ********************* Localhost ********************
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
};

// ********************* Mobile / physical device (use PC LAN IP, not localhost) ********************
// export const environment = {
//   production: false,
//   apiEndPoint: 'http://172.20.10.4:3000/api/v1/',
//   urlProfileImg: 'http://172.20.10.4:3000/uploads/',
//   profileImageFallback: 'assets/images/bg-01.png',
//   firebaseConfig: { ...same as above... },
// };

