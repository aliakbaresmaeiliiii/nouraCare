import { Routes } from '@angular/router';

export const appRoutes: Routes = [

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },

  {
    path: 'home',
    loadChildren:()=>import('./pages/pages-module').then(m=>m.PagesModule)
  },
  { path: '', redirectTo: 'auth/sign-in', pathMatch: 'full' },
];
