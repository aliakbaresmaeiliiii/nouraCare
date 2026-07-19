import { DecimalPipe, KeyValuePipe, SlicePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService, DashboardOverview } from '../../core/admin-api';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, KeyValuePipe, SlicePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  data = signal<DashboardOverview | null>(null);
  error = signal('');
  loading = signal(true);

  ngOnInit(): void {
    this.adminApi.overview().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load overview');
        this.loading.set(false);
      },
    });
  }

  barHeight(count: number, max: number): number {
    if (max <= 0) return 4;
    return Math.max(4, Math.round((count / max) * 120));
  }

  maxSignup(data: DashboardOverview): number {
    return Math.max(1, ...data.charts.signupsLast7Days.map((d) => d.count));
  }
}
