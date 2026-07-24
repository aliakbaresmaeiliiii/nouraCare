export type AdminTheme = 'light' | 'dark';

export type AdminUserStatus = 'active' | 'inactive' | 'invited' | 'suspended';
export type AdminUserRole = 'admin' | 'editor' | 'viewer' | 'support' | 'user';
export type AdminPlatform = 'ios' | 'android' | 'web';
export type AdminSubscription = 'free' | 'pro' | 'enterprise';

export interface AdminKpi {
  id: string;
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  format?: 'number' | 'percent' | 'currency' | 'duration' | 'ms';
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface AdminChartPoint {
  label: string;
  value: number;
}

export interface AdminSeries {
  name: string;
  data: AdminChartPoint[];
  color?: string;
}

export interface AdminNamedValue {
  name: string;
  value: number;
  color?: string;
}

export interface AdminUser {
  id: string;
  avatarUrl?: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city?: string;
  platform: AdminPlatform;
  role: AdminUserRole;
  status: AdminUserStatus;
  registeredAt: string;
  lastLoginAt: string;
  subscription: AdminSubscription;
}

export interface AdminAuditEvent {
  id: string;
  type: 'login' | 'user_update' | 'role_change' | 'admin_action' | 'delete' | 'error';
  actor: string;
  target?: string;
  message: string;
  at: string;
  meta?: Record<string, string>;
}

export interface AdminHealthServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  uptime: string;
}

export interface AdminResourceGauge {
  name: string;
  used: number;
  total: number;
  unit: string;
}

export interface AdminJobQueue {
  name: string;
  pending: number;
  active: number;
  failed: number;
}

export interface AdminNotificationItem {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  tone?: 'info' | 'warning' | 'success' | 'danger';
}

export interface AdminNavItem {
  path: string;
  label: string;
  icon: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export interface AdminFunnelStep {
  name: string;
  value: number;
}

export interface AdminRetentionCohort {
  cohort: string;
  weeks: number[];
}

export interface AdminFeatureAdoption {
  feature: string;
  users: number;
  rate: number;
}
