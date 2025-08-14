import { Routes } from '@angular/router';
import { Login } from './auth/components/login/login';
import { Layout } from './pages/layout/layout';
import { Home } from './pages/home/home';

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
