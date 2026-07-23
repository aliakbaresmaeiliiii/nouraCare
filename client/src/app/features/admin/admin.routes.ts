import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

/**
 * Admin console routes — architecture only (no business logic).
 * Mounted at `/admin`.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/admin-dashboard.page').then(
            (m) => m.AdminDashboardPage,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/admin-users.page').then((m) => m.AdminUsersPage),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/admin-reports.page').then(
            (m) => m.AdminReportsPage,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/admin-settings.page').then(
            (m) => m.AdminSettingsPage,
          ),
      },
    ],
  },
];
