import { Routes } from '@angular/router';
import { Welcome } from './pages/welcome/welcome';

export const appRoutes: Routes = [
  {
    path: '',
    component: Welcome,
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },

  {
    path: 'home',
    loadChildren: () =>
      import('./pages/pages-module').then((m) => m.PagesModule),
  },
  { path: '', redirectTo: 'auth/sign-in', pathMatch: 'full' },
];
