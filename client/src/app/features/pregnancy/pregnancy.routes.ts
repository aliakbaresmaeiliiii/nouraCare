import { Routes } from '@angular/router';
import { authGuard } from '@app/core/auth/guards/auth.guard';
import { ReactWrapperComponent } from '@app/features/pregnancy/react-wrapper/react-wrapper.component';
import { TOOL_PAGE_ROUTES } from '@app/features/content/tool-pages/tool-pages.routes';

export const PREGNANCY_ROUTES: Routes = [
  {
    path: 'pregnancy',
    component: ReactWrapperComponent,
  },
  {
    path: 'week-detail',
    loadComponent: () =>
      import('@app/features/pregnancy/week-detail/week-detail.component').then(
        (m) => m.WeekDetailComponent,
      ),
  },
  {
    path: 'tool-pages',
    canActivate: [authGuard],
    children: TOOL_PAGE_ROUTES,
  },
  {
    path: 'pregnancy-mode',
    loadComponent: () =>
      import('@app/features/pregnancy/pregnancy-mode/pregnancy-mode.component').then(
        (m) => m.PregnancyModeComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'pregnancy-planning',
    loadComponent: () =>
      import(
        '@app/features/pregnancy/pregnancy-planning/pregnancy-planning.component'
      ).then((m) => m.PregnancyPlanningComponent),
    canActivate: [authGuard],
  },
  {
    path: 'pregnancy-journey',
    loadComponent: () =>
      import(
        '@app/features/pregnancy/pregnancy-planning/pregnancy-planning.component'
      ).then((m) => m.PregnancyPlanningComponent),
    canActivate: [authGuard],
  },
  {
    path: 'postpartum',
    loadComponent: () =>
      import(
        '@app/features/pregnancy/pregnancy-planning/pregnancy-planning.component'
      ).then((m) => m.PregnancyPlanningComponent),
    canActivate: [authGuard],
  },
];
