import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { AdminOverviewDto } from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminStatCardComponent } from '../../shared-ui/stat-card/admin-stat-card.component';
import { AdminChartCardComponent } from '../../shared-ui/chart-card/admin-chart-card.component';

@Component({
  selector: 'app-admin-analytics-page',
  standalone: true,
  imports: [AdminStatCardComponent, AdminChartCardComponent, TranslatePipe],
  templateUrl: './admin-analytics.page.html',
  styleUrl: './admin-analytics.page.scss',
})
export class AdminAnalyticsPage implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly overview = signal<AdminOverviewDto | null>(null);

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
