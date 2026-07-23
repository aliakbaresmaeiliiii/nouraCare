import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/** Legacy `/welcome` URLs → single login page at `/auth/sign-in`. */
export const welcomeToSignInRedirectGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  return router.createUrlTree(['/auth/sign-in'], {
    queryParams: route.queryParams,
  });
};
