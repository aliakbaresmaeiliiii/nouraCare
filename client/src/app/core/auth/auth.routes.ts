import { Routes } from '@angular/router';
import { welcomeToSignInRedirectGuard } from '@app/core/guards/welcome-to-sign-in.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'welcome',
    canActivate: [welcomeToSignInRedirectGuard],
    loadComponent: () =>
      import('@app/core/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth',
    children: [
      {
        path: 'sign-in',
        loadComponent: () =>
          import('@app/core/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('@app/core/auth/verify-email/verify-email.component').then(
            (m) => m.VerifyEmailComponent,
          ),
      },
    ],
  },
];
