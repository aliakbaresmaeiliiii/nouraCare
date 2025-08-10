import { Routes } from '@angular/router';

export const appRoutes: Routes = [

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
];
