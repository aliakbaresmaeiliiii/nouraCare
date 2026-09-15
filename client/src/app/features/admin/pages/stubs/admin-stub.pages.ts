import { Component } from '@angular/core';
import { AdminStubPageComponent } from '../../shared-ui/stub-page/admin-stub-page.component';

@Component({
  selector: 'app-admin-sessions-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.sessions"
    description="admin.stub.sessions.desc"
    relatedPath="/admin/analytics"
    relatedLabel="admin.stub.sessions.related"
  />`,
})
export class AdminSessionsPage {}

@Component({
  selector: 'app-admin-retention-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.retention"
    description="admin.stub.retention.desc"
    relatedPath="/admin/dashboard"
    relatedLabel="admin.stub.retention.related"
  />`,
})
export class AdminRetentionPage {}

@Component({
  selector: 'app-admin-revenue-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.revenue"
    description="admin.stub.revenue.desc"
    relatedPath="/admin/dashboard"
    relatedLabel="admin.stub.revenue.related"
  />`,
})
export class AdminRevenuePage {}

@Component({
  selector: 'app-admin-subscriptions-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.subscriptions"
    description="admin.stub.subscriptions.desc"
    relatedPath="/admin/users"
    relatedLabel="admin.stub.subscriptions.related"
  />`,
})
export class AdminSubscriptionsPage {}

@Component({
  selector: 'app-admin-payments-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.payments"
    description="admin.stub.payments.desc"
    relatedPath="/admin/revenue"
    relatedLabel="admin.stub.payments.related"
  />`,
})
export class AdminPaymentsPage {}

@Component({
  selector: 'app-admin-roles-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.roles"
    description="admin.stub.roles.desc"
    relatedPath="/admin/audit-logs"
    relatedLabel="admin.stub.roles.related"
  />`,
})
export class AdminRolesPage {}

@Component({
  selector: 'app-admin-system-status-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.systemStatus"
    description="admin.stub.systemStatus.desc"
    relatedPath="/admin/health"
    relatedLabel="admin.stub.systemStatus.related"
  />`,
})
export class AdminSystemStatusPage {}

@Component({
  selector: 'app-admin-api-monitoring-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.apiMonitoring"
    description="admin.stub.apiMonitoring.desc"
    relatedPath="/admin/health"
    relatedLabel="admin.stub.apiMonitoring.related"
  />`,
})
export class AdminApiMonitoringPage {}

@Component({
  selector: 'app-admin-integrations-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.integrations"
    description="admin.stub.integrations.desc"
    relatedPath="/admin/settings"
    relatedLabel="admin.stub.integrations.related"
  />`,
})
export class AdminIntegrationsPage {}

@Component({
  selector: 'app-admin-feature-flags-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page
    title="admin.nav.featureFlags"
    description="admin.stub.featureFlags.desc"
    relatedPath="/admin/settings"
    relatedLabel="admin.stub.featureFlags.related"
  />`,
})
export class AdminFeatureFlagsPage {}
