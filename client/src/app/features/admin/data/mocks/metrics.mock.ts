import {
  AdminFeatureAdoption,
  AdminFunnelStep,
  AdminKpi,
  AdminNamedValue,
  AdminRetentionCohort,
  AdminSeries,
} from '../models/admin.models';

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date('2026-07-23T12:00:00Z');
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    out.push(
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    );
  }
  return out;
}

function series(name: string, values: number[], color?: string): AdminSeries {
  const labels = lastNDays(values.length);
  return {
    name,
    color,
    data: values.map((value, i) => ({ label: labels[i], value })),
  };
}

export const MOCK_DASHBOARD_KPIS: AdminKpi[] = [
  { id: 'total-users', label: 'Total Users', value: '128,420', delta: 3.2, tone: 'info' },
  { id: 'active-users', label: 'Active Users', value: '54,812', delta: 1.8, tone: 'success' },
  { id: 'new-today', label: 'New Users Today', value: '1,246', delta: 8.4 },
  { id: 'dau', label: 'DAU', value: '18,940', delta: 2.1 },
  { id: 'wau', label: 'WAU', value: '46,220', delta: 1.4 },
  { id: 'mau', label: 'MAU', value: '91,380', delta: 0.9 },
  { id: 'retention', label: 'Retention Rate', value: '42.6%', delta: 0.6, tone: 'success' },
  { id: 'churn', label: 'Churn Rate', value: '2.8%', delta: -0.3, tone: 'warning' },
  { id: 'conversion', label: 'Conversion Rate', value: '4.7%', delta: 0.4 },
  { id: 'revenue', label: 'Revenue', value: '$186.4k', delta: 5.9, tone: 'success' },
  { id: 'sessions', label: 'Active Sessions', value: '7,812', delta: 1.2 },
  { id: 'crash', label: 'Crash Rate', value: '0.18%', delta: -0.05, tone: 'success' },
  { id: 'api', label: 'API Response Time', value: '186ms', delta: -4.2, tone: 'info' },
  { id: 'errors', label: 'Errors Today', value: '37', delta: -12.0, tone: 'danger' },
];

export const MOCK_DAU_SERIES = series(
  'DAU',
  [15200, 15880, 16120, 16940, 17110, 16820, 17440, 17910, 18120, 17650, 18220, 18540, 18810, 18940],
  '#0f766e',
);

export const MOCK_REVENUE_SERIES = series(
  'Revenue',
  [9800, 10200, 11040, 10880, 12100, 11950, 12640, 13120, 12880, 13450, 14120, 13980, 14860, 15220],
  '#0284c7',
);

export const MOCK_PLATFORM_USAGE: AdminNamedValue[] = [
  { name: 'iOS', value: 41, color: '#0f766e' },
  { name: 'Android', value: 38, color: '#0284c7' },
  { name: 'Web', value: 21, color: '#7c3aed' },
];

export const MOCK_DEVICE_USAGE: AdminNamedValue[] = [
  { name: 'Mobile', value: 72 },
  { name: 'Tablet', value: 11 },
  { name: 'Desktop', value: 17 },
];

export const MOCK_BROWSER_USAGE: AdminNamedValue[] = [
  { name: 'Safari', value: 34 },
  { name: 'Chrome', value: 41 },
  { name: 'Samsung', value: 12 },
  { name: 'Other', value: 13 },
];

export const MOCK_OS_USAGE: AdminNamedValue[] = [
  { name: 'iOS', value: 41 },
  { name: 'Android', value: 38 },
  { name: 'Windows', value: 12 },
  { name: 'macOS', value: 9 },
];

export const MOCK_TOP_COUNTRIES: AdminNamedValue[] = [
  { name: 'Iran', value: 28400 },
  { name: 'Malaysia', value: 16220 },
  { name: 'UAE', value: 12110 },
  { name: 'Turkey', value: 9800 },
  { name: 'Indonesia', value: 8640 },
  { name: 'UK', value: 6120 },
  { name: 'Germany', value: 4980 },
  { name: 'USA', value: 4520 },
];

export const MOCK_TOP_CITIES: AdminNamedValue[] = [
  { name: 'Tehran', value: 11240 },
  { name: 'Kuala Lumpur', value: 7840 },
  { name: 'Dubai', value: 6210 },
  { name: 'Istanbul', value: 5100 },
  { name: 'Jakarta', value: 4320 },
];

export const MOCK_FUNNEL: AdminFunnelStep[] = [
  { name: 'Visit', value: 100000 },
  { name: 'Signup', value: 28400 },
  { name: 'Activate', value: 19620 },
  { name: 'Subscribe', value: 4680 },
  { name: 'Retain 30d', value: 3120 },
];

export const MOCK_FEATURE_ADOPTION: AdminFeatureAdoption[] = [
  { feature: 'Cycle Tracker', users: 64200, rate: 72 },
  { feature: 'Community', users: 38100, rate: 43 },
  { feature: 'Shop', users: 21400, rate: 24 },
  { feature: 'Doctors', users: 16800, rate: 19 },
  { feature: 'Pregnancy Mode', users: 12900, rate: 14 },
];

export const MOCK_RETENTION_COHORTS: AdminRetentionCohort[] = [
  { cohort: 'Apr', weeks: [100, 46, 38, 32, 29, 26] },
  { cohort: 'May', weeks: [100, 48, 40, 34, 30, 27] },
  { cohort: 'Jun', weeks: [100, 51, 42, 36, 31, 28] },
  { cohort: 'Jul', weeks: [100, 53, 44, 37, 0, 0] },
];

export const MOCK_SESSION_METRICS = {
  avgDurationSec: 312,
  bounceRate: 28.4,
  screenViews: 842200,
  sessionsToday: 21440,
};
