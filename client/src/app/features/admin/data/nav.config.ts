import { AdminNavGroup } from './models/admin.models';

/** Admin sidebar nav — groups with expandable submenus where useful. */
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
      {
        label: 'admin.nav.growth',
        icon: 'activity',
        children: [
          { path: '/admin/sessions', label: 'admin.nav.sessions', icon: 'activity' },
          { path: '/admin/retention', label: 'admin.nav.retention', icon: 'retain' },
        ],
      },
    ],
  },
  {
    label: 'admin.nav.care',
    items: [
      { path: '/admin/doctors', label: 'admin.nav.doctors', icon: 'doctor' },
      {
        path: '/admin/appointments',
        label: 'admin.nav.appointments',
        icon: 'calendar',
      },
    ],
  },
  {
    label: 'admin.nav.monetization',
    items: [
      {
        label: 'admin.nav.billing',
        icon: 'revenue',
        children: [
          { path: '/admin/revenue', label: 'admin.nav.revenue', icon: 'revenue' },
          {
            path: '/admin/subscriptions',
            label: 'admin.nav.subscriptions',
            icon: 'sub',
          },
          { path: '/admin/payments', label: 'admin.nav.payments', icon: 'pay' },
        ],
      },
    ],
  },
  {
    label: 'admin.nav.operations',
    items: [
      { path: '/admin/health', label: 'admin.nav.health', icon: 'health' },
      { path: '/admin/reports', label: 'admin.nav.reports', icon: 'report' },
      { path: '/admin/tickets', label: 'admin.nav.tickets', icon: 'ticket' },
      {
        path: '/admin/notifications',
        label: 'admin.nav.notifications',
        icon: 'bell',
      },
      {
        label: 'admin.nav.monitoring',
        icon: 'status',
        children: [
          {
            path: '/admin/system-status',
            label: 'admin.nav.systemStatus',
            icon: 'status',
          },
          {
            path: '/admin/api-monitoring',
            label: 'admin.nav.apiMonitoring',
            icon: 'api',
          },
        ],
      },
    ],
  },
  {
    label: 'admin.nav.security',
    items: [
      { path: '/admin/audit-logs', label: 'admin.nav.auditLogs', icon: 'audit' },
      { path: '/admin/roles', label: 'admin.nav.roles', icon: 'shield' },
    ],
  },
  {
    label: 'admin.nav.system',
    items: [
      { path: '/admin/settings', label: 'admin.nav.settings', icon: 'settings' },
      {
        label: 'admin.nav.platform',
        icon: 'plug',
        children: [
          {
            path: '/admin/integrations',
            label: 'admin.nav.integrations',
            icon: 'plug',
          },
          {
            path: '/admin/feature-flags',
            label: 'admin.nav.featureFlags',
            icon: 'flag',
          },
        ],
      },
    ],
  },
];

export const ADMIN_BREADCRUMB_KEYS: Record<string, string> = {
  dashboard: 'admin.nav.dashboard',
  analytics: 'admin.nav.analytics',
  users: 'admin.nav.users',
  doctors: 'admin.nav.doctors',
  appointments: 'admin.nav.appointments',
  sessions: 'admin.nav.sessions',
  retention: 'admin.nav.retention',
  revenue: 'admin.nav.revenue',
  subscriptions: 'admin.nav.subscriptions',
  payments: 'admin.nav.payments',
  health: 'admin.nav.health',
  reports: 'admin.nav.reports',
  tickets: 'admin.nav.tickets',
  notifications: 'admin.nav.notifications',
  'audit-logs': 'admin.nav.auditLogs',
  settings: 'admin.nav.settings',
  roles: 'admin.nav.roles',
  'system-status': 'admin.nav.systemStatus',
  'api-monitoring': 'admin.nav.apiMonitoring',
  integrations: 'admin.nav.integrations',
  'feature-flags': 'admin.nav.featureFlags',
};
