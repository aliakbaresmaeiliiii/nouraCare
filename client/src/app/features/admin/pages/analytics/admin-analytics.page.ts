import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { AdminOverviewDto } from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminStatCardComponent } from '../../shared-ui/stat-card/admin-stat-card.component';
import { AdminChartCardComponent } from '../../shared-ui/chart-card/admin-chart-card.component';

const TIER_LABEL_KEYS: Record<string, string> = {
  FREE: 'admin.dashboard.tier.free',
  PREMIUM: 'admin.dashboard.tier.premium',
  PREMIUM_TRIAL: 'admin.dashboard.tier.trial',
};

@Component({
  selector: 'app-admin-analytics-page',
  standalone: true,
  imports: [AdminStatCardComponent, AdminChartCardComponent, TranslatePipe],
  templateUrl: './admin-analytics.page.html',
  styleUrl: './admin-analytics.page.scss',
})
export class AdminAnalyticsPage implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly i18n = inject(TranslationService);
  private readonly language = inject(LanguageService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly overview = signal<AdminOverviewDto | null>(null);
  private readonly lang = toSignal(this.language.currentLanguage$, {
    initialValue: this.language.getCurrentLanguage(),
  });

  readonly signupLabels = computed(
    () => this.overview()?.charts.signupsLast7Days.map((d) => d.day.slice(5)) ?? [],
  );
  readonly signupValues = computed(() => {
    this.lang();
    return [
      {
        label: this.i18n.translate('admin.dashboard.signups'),
        data: this.overview()?.charts.signupsLast7Days.map((d) => d.count) ?? [],
        color: '#6366f1',
        fill: true,
      },
    ];
  });

  readonly tierEntries = computed(() => {
    this.lang();
    const raw = this.overview()?.subscriptions.byTier ?? {};
    return Object.entries(raw).map(([key, value]) => ({
      label: this.i18n.translate(TIER_LABEL_KEYS[key] ?? key),
      value: Number(value) || 0,
    }));
  });

  readonly tierLabels = computed(() => this.tierEntries().map((e) => e.label));
  readonly tierValues = computed(() => [
    {
      label: this.i18n.translate('admin.analytics.tier'),
      data: this.tierEntries().map((e) => e.value),
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
        this.error.set('admin.common.error');
        this.loading.set(false);
      },
    });
  }
}
