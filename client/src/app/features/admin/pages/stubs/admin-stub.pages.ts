import { Component } from '@angular/core';
import { AdminStubPageComponent } from '../../shared-ui/stub-page/admin-stub-page.component';

@Component({
  selector: 'app-admin-sessions-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="Sessions" description="Session volume, duration, and bounce analysis." relatedPath="/admin/analytics" relatedLabel="Open analytics" />`,
})
export class AdminSessionsPage {}

@Component({
  selector: 'app-admin-retention-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="Retention" description="Cohort retention and churn deep-dives." relatedPath="/admin/dashboard" relatedLabel="View cohort on dashboard" />`,
})
export class AdminRetentionPage {}

@Component({
  selector: 'app-admin-revenue-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="Revenue" description="MRR, ARR, and growth charts." relatedPath="/admin/dashboard" relatedLabel="View revenue KPI" />`,
})
export class AdminRevenuePage {}

@Component({
  selector: 'app-admin-subscriptions-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="Subscriptions" description="Plan mix, upgrades, and cancellations." relatedPath="/admin/users" relatedLabel="Open users" />`,
})
export class AdminSubscriptionsPage {}

@Component({
  selector: 'app-admin-payments-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="Payments" description="Payment attempts, failures, and refunds." relatedPath="/admin/revenue" relatedLabel="Open revenue" />`,
})
export class AdminPaymentsPage {}

@Component({
  selector: 'app-admin-notifications-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="Notifications" description="System notifications, push, email campaigns, and announcements." relatedPath="/admin/settings" relatedLabel="Open settings" />`,
})
export class AdminNotificationsPage {}

@Component({
  selector: 'app-admin-roles-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="Roles & Permissions" description="RBAC matrix for admin operators." relatedPath="/admin/audit-logs" relatedLabel="Open audit logs" />`,
})
export class AdminRolesPage {}

@Component({
  selector: 'app-admin-system-status-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="System Status" description="Public status page mirror for incidents and maintenance." relatedPath="/admin/health" relatedLabel="Open health" />`,
})
export class AdminSystemStatusPage {}

@Component({
  selector: 'app-admin-api-monitoring-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="API Monitoring" description="Latency, error rate, and endpoint throughput." relatedPath="/admin/health" relatedLabel="Open health" />`,
})
export class AdminApiMonitoringPage {}

@Component({
  selector: 'app-admin-integrations-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="Integrations" description="Third-party connectors and webhook endpoints." relatedPath="/admin/settings" relatedLabel="Open settings" />`,
})
export class AdminIntegrationsPage {}

@Component({
  selector: 'app-admin-feature-flags-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  template: `<app-admin-stub-page title="Feature Flags" description="Rollouts, experiments, and kill switches." relatedPath="/admin/settings" relatedLabel="Manage in settings" />`,
})
export class AdminFeatureFlagsPage {}
