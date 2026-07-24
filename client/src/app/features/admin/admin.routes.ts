import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

/**
 * Admin console routes — mounted at `/admin`.
 * Priority pages are fully built; remaining pages are polished stubs.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/admin-dashboard.page').then(
            (m) => m.AdminDashboardPage,
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/analytics/admin-analytics.page').then(
            (m) => m.AdminAnalyticsPage,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/admin-users.page').then((m) => m.AdminUsersPage),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then((m) => m.AdminSessionsPage),
      },
      {
        path: 'retention',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then((m) => m.AdminRetentionPage),
      },
      {
        path: 'revenue',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then((m) => m.AdminRevenuePage),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then(
            (m) => m.AdminSubscriptionsPage,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then((m) => m.AdminPaymentsPage),
      },
      {
        path: 'health',
        loadComponent: () =>
          import('./pages/health/admin-health.page').then((m) => m.AdminHealthPage),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/admin-reports.page').then(
            (m) => m.AdminReportsPage,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then(
            (m) => m.AdminNotificationsPage,
          ),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./pages/audit-logs/admin-audit-logs.page').then(
            (m) => m.AdminAuditLogsPage,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/admin-settings.page').then(
            (m) => m.AdminSettingsPage,
          ),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then((m) => m.AdminRolesPage),
      },
      {
        path: 'system-status',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then(
            (m) => m.AdminSystemStatusPage,
          ),
      },
      {
        path: 'api-monitoring',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then(
            (m) => m.AdminApiMonitoringPage,
          ),
      },
      {
        path: 'integrations',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then(
            (m) => m.AdminIntegrationsPage,
          ),
      },
      {
        path: 'feature-flags',
        loadComponent: () =>
          import('./pages/stubs/admin-stub.pages').then(
            (m) => m.AdminFeatureFlagsPage,
          ),
      },
    ],
  },
];
