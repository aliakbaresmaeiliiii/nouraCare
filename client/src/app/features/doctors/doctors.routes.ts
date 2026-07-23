import { Routes } from '@angular/router';

export const DOCTORS_ROUTES: Routes = [
  {
    path: 'doctors/category/:categoryId',
    loadComponent: () =>
      import('@app/features/doctors/doctors/doctors.component').then(
        (m) => m.DoctorsComponent,
      ),
  },
  {
    path: 'doctors',
    loadComponent: () =>
      import('@app/features/doctors/doctors/doctors.component').then(
        (m) => m.DoctorsComponent,
      ),
  },
  {
    path: 'doctor/:id',
    loadComponent: () =>
      import('@app/features/doctors/doctor-profile/doctor-profile.component').then(
        (m) => m.DoctorProfileComponent,
      ),
  },
  {
    path: 'my-favorites',
    loadComponent: () =>
      import('@app/features/doctors/my-favorites/my-favorites.component').then(
        (m) => m.MyFavoritesComponent,
      ),
  },
];
