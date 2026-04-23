import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { shouldOpenOnboardingFirst } from './onboarding-local-storage.util';

export const initialRouteGuard: CanActivateFn = () => {
  const router = inject(Router);
  const path = shouldOpenOnboardingFirst() ? '/onboarding' : '/welcome';
  return router.createUrlTree([path]);
};
