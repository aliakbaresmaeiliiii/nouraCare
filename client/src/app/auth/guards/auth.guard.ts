import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Simple auth guard:
 * - Relies on AuthService.isAuthenticated() (which is driven by token state).
 * - JwtInterceptor handles 401/refresh, so the guard doesn't decode/refresh tokens itself.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/sign-in'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
