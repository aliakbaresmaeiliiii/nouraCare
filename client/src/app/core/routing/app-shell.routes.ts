import { inject } from '@angular/core';
import { Router, Routes, UrlSegment } from '@angular/router';

/** Top-level app path segments (pre-/app URLs redirect here). */
const APP_ROOT_SEGMENTS = new Set([
  'about',
  'article',
  'auth',
  'blocked-users',
  'chatbot',
  'check-version',
  'consultation',
  'cycle-calendar',
  'data-usage',
  'doctor',
  'doctors',
  'dorehealth-pro',
  'edit-profile',
  'forums',
  'help-support',
  'home',
  'insights',
  'invite-friends',
  'my-favorites',
  'my-friends',
  'notifications',
  'onboarding',
  'payment',
  'period-date-picker',
  'period-edit',
  'postpartum',
  'pregnancy',
  'pregnancy-journey',
  'pregnancy-mode',
  'pregnancy-planning',
  'privacy-policy',
  'privacy-settings',
  'profile',
  'reproductive-status',
  'saved-information',
  'school',
  'secret-chats',
  'settings',
  'shop',
  'symptoms-detail',
  'symptoms-history',
  'symptoms-tracker',
  'tabs',
  'terms',
  'test-onboarding',
  'tool-pages',
  'tools',
  'week-detail',
  'welcome',
]);

function legacyAppRedirectMatcher(segments: UrlSegment[]) {
  const first = segments[0]?.path;
  if (!first || first === 'app') {
    return null;
  }
  if (!APP_ROOT_SEGMENTS.has(first)) {
    return null;
  }
  return { consumed: segments };
}

/**
 * Redirect legacy absolute app URLs (`/tabs/...`, `/auth/...`) to `/app/...`
 * so existing navigations keep working without touching feature code.
 */
export const LEGACY_APP_REDIRECTS: Routes = [
  {
    matcher: legacyAppRedirectMatcher,
    redirectTo: ({ url, queryParams }) => {
      const router = inject(Router);
      return router.createUrlTree(['/app', ...url.map((s) => s.path)], {
        queryParams,
      });
    },
  },
];
