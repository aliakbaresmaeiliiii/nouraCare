import { Injectable, signal } from '@angular/core';
import {
  MOCK_HEALTH_SERVICES,
  MOCK_JOB_QUEUES,
  MOCK_RESOURCE_GAUGES,
} from '../mocks/health.mock';

@Injectable({ providedIn: 'root' })
export class AdminHealthService {
  readonly services = signal(MOCK_HEALTH_SERVICES);
  readonly gauges = signal(MOCK_RESOURCE_GAUGES);
  readonly queues = signal(MOCK_JOB_QUEUES);
}
