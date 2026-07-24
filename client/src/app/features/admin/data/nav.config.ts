import { AdminNavGroup } from './models/admin.models';

/** Production nav — stubs remain routable but are hidden from the sidebar. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'admin.nav.overview',
    items: [
      { path: '/admin/dashboard', label: 'admin.nav.dashboard', icon: 'grid' },
      { path: '/admin/analytics', label: 'admin.nav.analytics', icon: 'chart' },
    ],
  },
  {
    label: 'admin.nav.usersGrowth',
    items: [
      { path: '/admin/users', label: 'admin.nav.users', icon: 'users' },
    ],
  },
  {
    label: 'admin.nav.operations',
    items: [
      { path: '/admin/health', label: 'admin.nav.health', icon: 'health' },
    ],
  },
  {
    label: 'admin.nav.system',
    items: [
      { path: '/admin/settings', label: 'admin.nav.settings', icon: 'settings' },
    ],
  },
];

export const ADMIN_BREADCRUMB_KEYS: Record<string, string> = {
  dashboard: 'admin.nav.dashboard',
  analytics: 'admin.nav.analytics',
  users: 'admin.nav.users',
  sessions: 'admin.nav.sessions',
  retention: 'admin.nav.retention',
  revenue: 'admin.nav.revenue',
  subscriptions: 'admin.nav.subscriptions',
  payments: 'admin.nav.payments',
  health: 'admin.nav.health',
  reports: 'admin.nav.reports',
  notifications: 'admin.nav.notifications',
  'audit-logs': 'admin.nav.auditLogs',
  settings: 'admin.nav.settings',
  roles: 'admin.nav.roles',
  'system-status': 'admin.nav.systemStatus',
  'api-monitoring': 'admin.nav.apiMonitoring',
  integrations: 'admin.nav.integrations',
  'feature-flags': 'admin.nav.featureFlags',
};
