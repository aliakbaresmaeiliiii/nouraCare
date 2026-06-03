import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { hasLocalNouraCareOnboardingProfile } from './onboarding-local-storage.util';

/**
 * `/auth/sign-in` is for users who already have a local questionnaire snapshot or an auth session.
 * Otherwise send them through `/onboarding` first (including the in-flow welcome step).
 */
export const welcomeRequiresProfileOrSessionGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (typeof localStorage === 'undefined') {
    return router.createUrlTree(['/onboarding']);
  }
  if (hasLocalNouraCareOnboardingProfile() || localStorage.getItem('userInfo')) {
    return true;
  }
  return router.createUrlTree(['/onboarding']);
};
