import { AdminNotificationItem } from '../models/admin.models';

export const MOCK_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: 'n1',
    title: 'API latency spike',
    body: 'p95 response time exceeded 420ms for 8 minutes.',
    at: '2026-07-23T08:12:00Z',
    read: false,
    tone: 'warning',
  },
  {
    id: 'n2',
    title: 'New enterprise signup',
    body: 'Acme Health activated a 50-seat Pro plan.',
    at: '2026-07-23T07:40:00Z',
    read: false,
    tone: 'success',
  },
  {
    id: 'n3',
    title: 'Weekly report ready',
    body: 'Growth report for week 29 is available to export.',
    at: '2026-07-22T18:00:00Z',
    read: true,
    tone: 'info',
  },
  {
    id: 'n4',
    title: 'Failed background job',
    body: 'email-digest job failed 3 times — retry scheduled.',
    at: '2026-07-22T15:22:00Z',
    read: false,
    tone: 'danger',
  },
];
