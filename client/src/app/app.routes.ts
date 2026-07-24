import { Routes } from '@angular/router';
import { AUTH_ROUTES } from '@app/core/auth/auth.routes';
import { TABS_ROUTES } from '@app/core/layout/tabs.routes';
import { LEGACY_APP_REDIRECTS } from '@app/core/routing/app-shell.routes';
import { COMMUNITY_ROUTES } from '@app/features/community/community.routes';
import { CONTENT_ROUTES } from '@app/features/content/content.routes';
import { CYCLE_ROUTES } from '@app/features/cycle/cycle.routes';
import { DOCTORS_ROUTES } from '@app/features/doctors/doctors.routes';
import { superAdminGuard } from '@app/features/admin/guards/super-admin.guard';
import { PREGNANCY_ROUTES } from '@app/features/pregnancy/pregnancy.routes';
import { PROFILE_ROUTES } from '@app/features/profile/profile.routes';
import { SETTINGS_ROUTES } from '@app/features/settings/settings.routes';
import { SHOP_ROUTES } from '@app/features/shop/shop.routes';

/** Existing Ionic application — all paths live under `/app`. */
const IONIC_APP_ROUTES: Routes = [
  {
    path: 'onboarding',
    loadComponent: () =>
      import('@app/features/onboarding/onboarding.component').then((m) => {
        return m.OnboardingComponent;
      }),
  },
  {
    path: 'test-onboarding',
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
  ...AUTH_ROUTES,
  ...PROFILE_ROUTES,
  ...COMMUNITY_ROUTES,
  ...SETTINGS_ROUTES,
  ...CONTENT_ROUTES,
  ...CYCLE_ROUTES,
  ...DOCTORS_ROUTES,
  ...SHOP_ROUTES,
  ...PREGNANCY_ROUTES,
  ...TABS_ROUTES,
  {
    path: '',
    loadComponent: () =>
      import('@app/features/splash/splash.component').then((m) => m.SplashComponent),
  },
];

/**
 * Root routes:
 * - `/` → `/app` (Ionic app splash / shell)
 * - `/admin/**` → admin console shell
 * - `/app/**` → existing Ionic app
 * - legacy `/tabs`, `/auth`, … → `/app/...` (keeps existing navigations working)
 */
export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [superAdminGuard],
    loadChildren: () =>
      import('@app/features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'app',
    children: IONIC_APP_ROUTES,
  },
  ...LEGACY_APP_REDIRECTS,
  {
    path: '',
    redirectTo: 'app',
    pathMatch: 'full',
  },
];
