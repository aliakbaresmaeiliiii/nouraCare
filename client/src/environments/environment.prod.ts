export const environment = {
  production: true,

  // LAN IP of the machine running the API (phone must be on same Wi‑Fi). Server: PORT default 3000, HOST 0.0.0.0 in server/src/main.ts
  apiEndPoint: 'http://172.20.10.4:3000/api/v1/',
  urlProfileImg: 'http://172.20.10.4:3000/uploads/',
  profileImageFallback: 'assets/images/bg-01.png',
  neshanBaseUrl: 'https://api.neshan.org',
  neshanApiKey: 'service.KVVe90o9etGdBaZMu1jT2tlhVuc2yXdMDcYkYded',
  mapboxToken:
    'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',

  /** Same OAuth 2.0 Web client as dev (Google Cloud Console → Credentials). */
  googleWebClientId:
    '1088321651982-l914r5o4bj5c73cua6qdcg0ttjnd8hbh.apps.googleusercontent.com',
  googleIOSClientId: '',


 
  // firebaseConfig: {
  //   apiKey: 'AIzaSyBaQzqPdV4Z5hHmN_GTZHbaSkXWhKAlbIA',
  //   authDomain: 'clinic-55f53.firebaseapp.com',
  //   projectId: 'clinic-55f53',
  //   storageBucket: 'clinic-55f53.appspot.com',
  //   messagingSenderId: '357428854325',
  //   appId: '1:357428854325:web:04fd91819ab7e8945a3b7c',
  //   measurementId: 'G-Y8RLZHZ7NM',
  // },
};
