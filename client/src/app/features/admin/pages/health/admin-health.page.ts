import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TranslationService } from '@app/shared/services/translation.service';
import { AdminHealthDto } from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminMetricCardComponent } from '../../shared-ui/metric-card/admin-metric-card.component';
import { AdminSkeletonComponent } from '../../shared-ui/skeleton/admin-skeleton.component';
import { AdminTrendCardComponent } from '../../shared-ui/trend-card/admin-trend-card.component';

@Component({
  selector: 'app-admin-health-page',
  standalone: true,
  imports: [
    AdminTrendCardComponent,
    AdminMetricCardComponent,
    AdminSkeletonComponent,
    TranslatePipe,
  ],
  templateUrl: './admin-health.page.html',
  styleUrl: './admin-health.page.scss',
  providers: [DatePipe],
})
export class AdminHealthPage implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly i18n = inject(TranslationService);
  private readonly datePipe = inject(DatePipe);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly health = signal<AdminHealthDto | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getHealth().subscribe({
      next: (data) => {
        this.health.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('admin.common.error');
        this.loading.set(false);
      },
    });
  }

  statusClass(status: string): string {
    if (status === 'healthy' || status === 'up') return 'admin-badge--success';
    if (status === 'degraded') return 'admin-badge--warning';
    return 'admin-badge--danger';
  }

  statusLabel(status: string): string {
    const key = `admin.health.status.${status}`;
    const translated = this.i18n.translate(key);
    return translated === key ? status : translated;
  }

  systemStatusLabel(status: string): string {
    return this.i18n.translateParams('admin.health.systemStatus', {
      status: this.statusLabel(status),
    });
  }

  lastCheckedLabel(checkedAt: string): string {
    return this.i18n.translateParams('admin.health.lastChecked', {
      at: this.checkedAtMedium(checkedAt),
    });
  }

  checkedAtMedium(checkedAt: string): string {
    return this.datePipe.transform(checkedAt, 'medium') || '';
  }

  latencyLabel(ms?: number | null): string {
    return this.i18n.translateParams('admin.health.latency', {
      ms: ms ?? 0,
    });
  }

  uptimeLabel(): string {
    const sec = this.health()?.uptimeSec ?? 0;
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    return this.i18n.translateParams('admin.health.uptimeValue', {
      hours,
      minutes,
    });
  }

  uptimeProgress(): number {
    const hours = Math.floor((this.health()?.uptimeSec ?? 0) / 3600);
    return Math.min(100, Math.max(4, hours));
  }
}
