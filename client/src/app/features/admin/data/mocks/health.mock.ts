import {
  AdminHealthServiceStatus,
  AdminJobQueue,
  AdminResourceGauge,
} from '../models/admin.models';

export const MOCK_HEALTH_SERVICES: AdminHealthServiceStatus[] = [
  { name: 'API Gateway', status: 'healthy', latencyMs: 42, uptime: '99.98%' },
  { name: 'Auth Service', status: 'healthy', latencyMs: 58, uptime: '99.95%' },
  { name: 'Primary DB', status: 'healthy', latencyMs: 12, uptime: '99.99%' },
  { name: 'Redis Cache', status: 'degraded', latencyMs: 120, uptime: '99.80%' },
  { name: 'Object Storage', status: 'healthy', latencyMs: 88, uptime: '99.97%' },
  { name: 'Push Worker', status: 'healthy', latencyMs: 35, uptime: '99.90%' },
];

export const MOCK_RESOURCE_GAUGES: AdminResourceGauge[] = [
  { name: 'CPU', used: 48, total: 100, unit: '%' },
  { name: 'Memory', used: 21.4, total: 32, unit: 'GB' },
  { name: 'Storage', used: 1.8, total: 4, unit: 'TB' },
];

export const MOCK_JOB_QUEUES: AdminJobQueue[] = [
  { name: 'email-digest', pending: 24, active: 2, failed: 3 },
  { name: 'push-notifications', pending: 8, active: 5, failed: 0 },
  { name: 'report-export', pending: 1, active: 1, failed: 0 },
  { name: 'image-optimize', pending: 40, active: 4, failed: 1 },
];
