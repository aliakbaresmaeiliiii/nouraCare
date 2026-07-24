import { Injectable, signal } from '@angular/core';
import {
  MOCK_BROWSER_USAGE,
  MOCK_DASHBOARD_KPIS,
  MOCK_DAU_SERIES,
  MOCK_DEVICE_USAGE,
  MOCK_FEATURE_ADOPTION,
  MOCK_FUNNEL,
  MOCK_OS_USAGE,
  MOCK_PLATFORM_USAGE,
  MOCK_RETENTION_COHORTS,
  MOCK_REVENUE_SERIES,
  MOCK_SESSION_METRICS,
  MOCK_TOP_CITIES,
  MOCK_TOP_COUNTRIES,
} from '../mocks/metrics.mock';

@Injectable({ providedIn: 'root' })
export class AdminMetricsService {
  readonly kpis = signal(MOCK_DASHBOARD_KPIS);
  readonly dau = signal(MOCK_DAU_SERIES);
  readonly revenue = signal(MOCK_REVENUE_SERIES);
  readonly platforms = signal(MOCK_PLATFORM_USAGE);
  readonly devices = signal(MOCK_DEVICE_USAGE);
  readonly browsers = signal(MOCK_BROWSER_USAGE);
  readonly os = signal(MOCK_OS_USAGE);
  readonly countries = signal(MOCK_TOP_COUNTRIES);
  readonly cities = signal(MOCK_TOP_CITIES);
  readonly funnel = signal(MOCK_FUNNEL);
  readonly features = signal(MOCK_FEATURE_ADOPTION);
  readonly cohorts = signal(MOCK_RETENTION_COHORTS);
  readonly sessions = signal(MOCK_SESSION_METRICS);
}
