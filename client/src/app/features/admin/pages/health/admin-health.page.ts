import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
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
    DatePipe,
  ],
  templateUrl: './admin-health.page.html',
  styleUrl: './admin-health.page.scss',
})
export class AdminHealthPage implements OnInit {
  private readonly api = inject(AdminApiService);

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

  uptimeLabel(): string {
    const sec = this.health()?.uptimeSec ?? 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  }

  uptimeProgress(): number {
    const hours = Math.floor((this.health()?.uptimeSec ?? 0) / 3600);
    return Math.min(100, Math.max(4, hours));
  }
}
