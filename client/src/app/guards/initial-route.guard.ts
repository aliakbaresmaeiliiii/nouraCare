import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const initialRouteGuard: CanActivateFn = () => {
  const router = inject(Router);
  const hasStoredData = localStorage.length > 0;

  return router.createUrlTree([hasStoredData ? '/welcome' : '/onboarding']);
};
