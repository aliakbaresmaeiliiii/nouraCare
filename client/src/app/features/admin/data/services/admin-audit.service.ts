import { Injectable, signal } from '@angular/core';
import { AdminAuditEvent } from '../models/admin.models';
import { MOCK_AUDIT_LOGS } from '../mocks/audit.mock';

@Injectable({ providedIn: 'root' })
export class AdminAuditService {
  readonly events = signal<AdminAuditEvent[]>([...MOCK_AUDIT_LOGS]);
}
