import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TranslationService } from '@app/shared/services/translation.service';
import { AdminOverviewDto } from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminStatCardComponent } from '../../shared-ui/stat-card/admin-stat-card.component';
import { AdminChartCardComponent } from '../../shared-ui/chart-card/admin-chart-card.component';
import { AdminSkeletonComponent } from '../../shared-ui/skeleton/admin-skeleton.component';

const TIER_LABEL_KEYS: Record<string, string> = {
  FREE: 'admin.dashboard.tier.free',
  PREMIUM: 'admin.dashboard.tier.premium',
  PREMIUM_TRIAL: 'admin.dashboard.tier.trial',
};

const REPRO_LABEL_KEYS: Record<string, string> = {
  CYCLE: 'admin.dashboard.mode.cycle',
  PREGNANCY: 'admin.dashboard.mode.pregnancy',
  PLANNING: 'admin.dashboard.mode.planning',
  POSTPARTUM: 'admin.dashboard.mode.postpartum',
  MENOPAUSE: 'admin.dashboard.mode.menopause',
};

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
  private readonly i18n = inject(TranslationService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly overview = signal<AdminOverviewDto | null>(null);

  readonly primaryKpis = computed(() => {
    const o = this.overview();
    if (!o) return [];
    return [
      { id: 'total', labelKey: 'admin.dashboard.kpi.totalUsers', value: o.users.total, tone: 'info' as const, icon: 'users' as const },
      { id: 'active', labelKey: 'admin.dashboard.kpi.activeUsers', value: o.users.active, tone: 'success' as const, icon: 'active' as const },
      { id: 'today', labelKey: 'admin.dashboard.kpi.newToday', value: o.users.newToday, icon: 'spark' as const },
      { id: 'week', labelKey: 'admin.dashboard.kpi.newWeek', value: o.users.newThisWeek, icon: 'calendar' as const },
      { id: 'suspended', labelKey: 'admin.dashboard.kpi.suspended', value: o.users.suspended, tone: 'warning' as const, icon: 'warning' as const },
      { id: 'admins', labelKey: 'admin.dashboard.kpi.admins', value: o.users.admins, icon: 'shield' as const },
    ];
  });

  readonly secondaryKpis = computed(() => {
    const o = this.overview();
    if (!o) return [];
    const tier = o.subscriptions.byTier ?? {};
    return [
      { id: 'month', labelKey: 'admin.dashboard.kpi.newMonth', value: o.users.newThisMonth, icon: 'calendar' as const },
      { id: 'verified', labelKey: 'admin.dashboard.kpi.verified', value: o.users.verified, tone: 'success' as const, icon: 'verified' as const },
      { id: 'doctors', labelKey: 'admin.dashboard.kpi.doctors', value: o.doctors.total, icon: 'doctor' as const },
      { id: 'appts', labelKey: 'admin.dashboard.kpi.appointments', value: o.appointments.total, icon: 'appointments' as const },
      { id: 'threads', labelKey: 'admin.dashboard.kpi.threads', value: o.community.threads, icon: 'forum' as const },
      { id: 'posts', labelKey: 'admin.dashboard.kpi.posts', value: o.community.posts, icon: 'posts' as const },
      { id: 'premium', labelKey: 'admin.dashboard.kpi.premium', value: tier['PREMIUM'] ?? 0, tone: 'success' as const, icon: 'premium' as const },
      { id: 'trial', labelKey: 'admin.dashboard.kpi.trial', value: tier['PREMIUM_TRIAL'] ?? 0, icon: 'trial' as const },
    ];
  });

  readonly signupLabels = computed(
    () => this.overview()?.charts.signupsLast7Days.map((d) => d.day.slice(5)) ?? [],
  );
  readonly signupValues = computed(() => [
    {
      label: this.i18n.translate('admin.dashboard.signups'),
      data: this.overview()?.charts.signupsLast7Days.map((d) => d.count) ?? [],
      color: '#6366f1',
      fill: true,
    },
  ]);

  readonly tierEntries = computed(() => {
    const raw = this.overview()?.subscriptions.byTier ?? {};
    return Object.entries(raw).map(([key, value]) => ({
      key,
      label: this.i18n.translate(TIER_LABEL_KEYS[key] ?? key),
      value: Number(value) || 0,
    }));
  });

  readonly tierLabels = computed(() => this.tierEntries().map((e) => e.label));
  readonly tierValues = computed(() => [
    {
      label: this.i18n.translate('admin.dashboard.subscriptions'),
      data: this.tierEntries().map((e) => e.value),
    },
  ]);
  readonly tierTotal = computed(() =>
    this.tierEntries().reduce((a, e) => a + e.value, 0),
  );

  readonly reproEntries = computed(() => {
    const raw = this.overview()?.reproductive.byState ?? {};
    return Object.entries(raw).map(([key, value]) => ({
      key,
      label: this.i18n.translate(REPRO_LABEL_KEYS[key] ?? key),
      value: Number(value) || 0,
    }));
  });

  readonly reproLabels = computed(() => this.reproEntries().map((e) => e.label));
  readonly reproValues = computed(() => [
    {
      label: this.i18n.translate('admin.dashboard.reproductive'),
      data: this.reproEntries().map((e) => e.value),
      color: '#14b8a6',
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

  initials(name: string | null | undefined, email: string | null | undefined, id: number): string {
    const src = (name || email || String(id)).trim();
    return src
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
}
