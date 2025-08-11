export interface Config {
  production: boolean;
  apiEndPoint: string;
  urlProfileImg: string;
  neshanBaseUrl: any;
  neshanApiKey: string;
  mapboxToken: string;
  firebaseConfig: {};
}

// ********************* locall********************

// export const environment: Config = {
//   firebaseConfig: {
//     apiKey: 'AIzaSyBaQzqPdV4Z5hHmN_GTZHbaSkXWhKAlbIA',
//     authDomain: 'clinic-55f53.firebaseapp.com',
//     projectId: 'clinic-55f53',
//     storageBucket: 'clinic-55f53.appspot.com',
//     messagingSenderId: '357428854325',
//     appId: '1:357428854325:web:04fd91819ab7e8945a3b7c',
//     measurementId: 'G-Y8RLZHZ7NM',
//   },
//   production: true,
//   // SERVER_API: 'https://api.example.com',
//   apiEndPoint: 'http://localhost:8080/v1/',
//   urlProfileImg: 'http://localhost:8080/images/',
//   neshanBaseUrl: 'https://api.neshan.org',
//   neshanApiKey: 'service.KVVe90o9etGdBaZMu1jT2tlhVuc2yXdMDcYkYded',
//   mapboxToken:
//     'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',
//   //  ' pk.eyJ1IjoiYWxpYWtiYXJlc21hZWlsaSIsImEiOiJjbHp6ODI1ZDAwdjBpMmxyMjZpcjdvZzZlIn0.kQouXthroqQGvAYDArZ3uQ'
// };

// ********************* Office********************

export const environment: Config = {
  firebaseConfig: {
    apiKey: 'AIzaSyBaQzqPdV4Z5hHmN_GTZHbaSkXWhKAlbIA',
    authDomain: 'clinic-55f53.firebaseapp.com',
    projectId: 'clinic-55f53',
    storageBucket: 'clinic-55f53.appspot.com',
    messagingSenderId: '357428854325',
    appId: '1:357428854325:web:04fd91819ab7e8945a3b7c',
    measurementId: 'G-Y8RLZHZ7NM',
  },
  production: true,
  // SERVER_API: 'https://api.example.com',
  apiEndPoint: 'http://localhost:8080/v1/',
  urlProfileImg: 'http://localhost:8080/images/',
  neshanBaseUrl: 'https://api.neshan.org',
  neshanApiKey: 'service.KVVe90o9etGdBaZMu1jT2tlhVuc2yXdMDcYkYded',
  mapboxToken:
    'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',
  //  ' pk.eyJ1IjoiYWxpYWtiYXJlc21hZWlsaSIsImEiOiJjbHp6ODI1ZDAwdjBpMmxyMjZpcjdvZzZlIn0.kQouXthroqQGvAYDArZ3uQ'
};

// ********************* hostspot********************

// export const environment: Config = {
//   firebaseConfig: {
//     apiKey: 'AIzaSyBaQzqPdV4Z5hHmN_GTZHbaSkXWhKAlbIA',
//     authDomain: 'clinic-55f53.firebaseapp.com',
//     projectId: 'clinic-55f53',
//     storageBucket: 'clinic-55f53.appspot.com',
//     messagingSenderId: '357428854325',
//     appId: '1:357428854325:web:04fd91819ab7e8945a3b7c',
//     measurementId: 'G-Y8RLZHZ7NM',
//   },
//   production: true,
//   // SERVER_API: 'https://api.example.com',
//   apiEndPoint: 'http://172.22.64.1:8080/v1/',
//   urlProfileImg: 'http://172.22.64.1:8080/images/',
//   neshanBaseUrl: 'https://api.neshan.org',
//   neshanApiKey: 'service.KVVe90o9etGdBaZMu1jT2tlhVuc2yXdMDcYkYded',
//   mapboxToken:
//     'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',
//   //  ' pk.eyJ1IjoiYWxpYWtiYXJlc21hZWlsaSIsImEiOiJjbHp6ODI1ZDAwdjBpMmxyMjZpcjdvZzZlIn0.kQouXthroqQGvAYDArZ3uQ'
// };
