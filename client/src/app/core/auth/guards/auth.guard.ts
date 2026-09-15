import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/core/auth/services/auth';

/**
 * Auth guard:
 * - Allows routes when access token is valid OR a refresh token can restore the session.
 * - JwtInterceptor refreshes on 401 when needed (including after Add-to-Home-Screen open).
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
