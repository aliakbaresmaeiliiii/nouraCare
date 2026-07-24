import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { AdminOverviewDto } from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminStatCardComponent } from '../../shared-ui/stat-card/admin-stat-card.component';
import { AdminChartCardComponent } from '../../shared-ui/chart-card/admin-chart-card.component';
import { AdminSkeletonComponent } from '../../shared-ui/skeleton/admin-skeleton.component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [
    AdminStatCardComponent,
    AdminChartCardComponent,
    AdminSkeletonComponent,
    TranslatePipe,
    DatePipe,
  ],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss',
})
export class AdminDashboardPage implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly overview = signal<AdminOverviewDto | null>(null);

  /** Primary KPIs first — denser secondary metrics below. */
  readonly primaryKpis = computed(() => {
    const o = this.overview();
    if (!o) return [];
    return [
      { id: 'total', labelKey: 'admin.dashboard.kpi.totalUsers', value: o.users.total, tone: 'info' as const },
      { id: 'active', labelKey: 'admin.dashboard.kpi.activeUsers', value: o.users.active, tone: 'success' as const },
      { id: 'today', labelKey: 'admin.dashboard.kpi.newToday', value: o.users.newToday },
      { id: 'week', labelKey: 'admin.dashboard.kpi.newWeek', value: o.users.newThisWeek },
      { id: 'suspended', labelKey: 'admin.dashboard.kpi.suspended', value: o.users.suspended, tone: 'warning' as const },
      { id: 'admins', labelKey: 'admin.dashboard.kpi.admins', value: o.users.admins },
    ];
  });

  readonly secondaryKpis = computed(() => {
    const o = this.overview();
    if (!o) return [];
    const tier = o.subscriptions.byTier ?? {};
    return [
      { id: 'month', labelKey: 'admin.dashboard.kpi.newMonth', value: o.users.newThisMonth },
      { id: 'verified', labelKey: 'admin.dashboard.kpi.verified', value: o.users.verified },
      { id: 'doctors', labelKey: 'admin.dashboard.kpi.doctors', value: o.doctors.total },
      { id: 'appts', labelKey: 'admin.dashboard.kpi.appointments', value: o.appointments.total },
      { id: 'threads', labelKey: 'admin.dashboard.kpi.threads', value: o.community.threads },
      { id: 'posts', labelKey: 'admin.dashboard.kpi.posts', value: o.community.posts },
      { id: 'premium', labelKey: 'admin.dashboard.kpi.premium', value: tier['PREMIUM'] ?? 0, tone: 'success' as const },
      { id: 'trial', labelKey: 'admin.dashboard.kpi.trial', value: tier['PREMIUM_TRIAL'] ?? 0 },
    ];
  });

  readonly signupLabels = computed(
    () => this.overview()?.charts.signupsLast7Days.map((d) => d.day.slice(5)) ?? [],
  );
  readonly signupValues = computed(() => [
    {
      label: 'Signups',
      data: this.overview()?.charts.signupsLast7Days.map((d) => d.count) ?? [],
      color: '#6366f1',
      fill: true,
    },
  ]);

  readonly tierLabels = computed(() =>
    Object.keys(this.overview()?.subscriptions.byTier ?? {}),
  );
  readonly tierValues = computed(() => [
    {
      label: 'Tier',
      data: Object.values(this.overview()?.subscriptions.byTier ?? {}),
    },
  ]);

  readonly reproLabels = computed(() =>
    Object.keys(this.overview()?.reproductive.byState ?? {}),
  );
  readonly reproValues = computed(() => [
    {
      label: 'State',
      data: Object.values(this.overview()?.reproductive.byState ?? {}),
    },
  ]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getOverview().subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('admin.dashboard.error');
        this.loading.set(false);
      },
    });
  }
}
