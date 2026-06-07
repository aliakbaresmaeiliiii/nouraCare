import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { shouldOpenOnboardingFirst } from './onboarding-local-storage.util';

export function getInitialAppPath(): string {
  return shouldOpenOnboardingFirst() ? '/onboarding' : '/auth/sign-in';
}

export const initialRouteGuard: CanActivateFn = () => {
  const router = inject(Router);
  return router.createUrlTree([getInitialAppPath()]);
};
