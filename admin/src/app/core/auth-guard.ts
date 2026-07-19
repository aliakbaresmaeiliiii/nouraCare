import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getAccessToken()) {
    return router.createUrlTree(['/login']);
  }

  if (auth.user()?.role === 'ADMIN') {
    return true;
  }

  return auth.loadMe().pipe(
    map((user) => {
      if (user?.role === 'ADMIN') {
        return true;
      }
      auth.logout();
      return router.createUrlTree(['/login']);
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated() && auth.user()?.role === 'ADMIN') {
    return router.createUrlTree(['/']);
  }
  return true;
};
