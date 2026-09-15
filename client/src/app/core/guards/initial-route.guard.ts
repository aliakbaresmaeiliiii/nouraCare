import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import {
  hasRefreshableSession,
  hasRegisteredAccount,
  hasStoredUserInfo,
} from '@app/core/auth/utils/auth-session.util';
import { hasLocalDoreHealthOnboardingProfile } from '@app/core/guards/onboarding-local-storage.util';

/**
 * Cold start (splash / PWA home-screen icon):
 * 1) Active or refreshable session → continue into the app
 * 2) Known account / finished onboarding → sign-in (not full registration)
 * 3) Otherwise → onboarding
 */
export function getInitialAppPath(): string {
  if (hasRefreshableSession()) {
    return '/tabs/home';
  }
  if (
    hasRegisteredAccount() ||
    hasStoredUserInfo() ||
    hasLocalDoreHealthOnboardingProfile()
  ) {
    return '/auth/sign-in';
  }
  return '/onboarding';
}

export const initialRouteGuard: CanActivateFn = () => {
  const router = inject(Router);
  return router.createUrlTree([getInitialAppPath()]);
};
