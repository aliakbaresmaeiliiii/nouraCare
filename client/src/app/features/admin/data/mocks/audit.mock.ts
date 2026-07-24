import { AdminAuditEvent } from '../models/admin.models';

export const MOCK_AUDIT_LOGS: AdminAuditEvent[] = [
  {
    id: 'a1',
    type: 'login',
    actor: 'ops@dore.health',
    message: 'Admin signed in from Tehran',
    at: '2026-07-23T10:44:00Z',
  },
  {
    id: 'a2',
    type: 'role_change',
    actor: 'ops@dore.health',
    target: 'zahra.a@example.com',
    message: 'Role updated from editor → admin',
    at: '2026-07-23T09:12:00Z',
  },
  {
    id: 'a3',
    type: 'user_update',
    actor: 'support@dore.health',
    target: 'maryam.h@example.com',
    message: 'User status set to suspended',
    at: '2026-07-22T16:40:00Z',
  },
  {
    id: 'a4',
    type: 'admin_action',
    actor: 'ops@dore.health',
    message: 'Feature flag pregnancy_v2 enabled for 10% rollout',
    at: '2026-07-22T14:05:00Z',
  },
  {
    id: 'a5',
    type: 'delete',
    actor: 'ops@dore.health',
    target: 'forum-topic-8841',
    message: 'Deleted moderated community topic',
    at: '2026-07-21T11:28:00Z',
  },
  {
    id: 'a6',
    type: 'error',
    actor: 'system',
    message: 'Background job email-digest failed (attempt 3/5)',
    at: '2026-07-21T08:02:00Z',
  },
  {
    id: 'a7',
    type: 'login',
    actor: 'zahra.a@example.com',
    message: 'Admin signed in from Mashhad',
    at: '2026-07-20T19:50:00Z',
  },
  {
    id: 'a8',
    type: 'admin_action',
    actor: 'ops@dore.health',
    message: 'Exported users CSV (128 rows)',
    at: '2026-07-20T12:14:00Z',
  },
];
