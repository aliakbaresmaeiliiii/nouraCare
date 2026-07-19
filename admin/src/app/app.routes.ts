import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users').then((m) => m.Users),
      },
      {
        path: 'doctors',
        loadComponent: () =>
          import('./pages/doctors/doctors').then((m) => m.Doctors),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./pages/appointments/appointments').then((m) => m.Appointments),
      },
      {
        path: 'forums',
        loadComponent: () => import('./pages/forums/forums').then((m) => m.Forums),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./pages/subscriptions/subscriptions').then((m) => m.Subscriptions),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
