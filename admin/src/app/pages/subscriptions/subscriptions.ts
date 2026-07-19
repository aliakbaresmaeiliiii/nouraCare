import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api';

@Component({
  selector: 'app-subscriptions',
  imports: [KeyValuePipe],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
})
export class Subscriptions implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  data = signal<{
    byTier: Record<string, number>;
    premiumActive: number;
    trialActive: number;
  } | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.adminApi.subscriptionSummary().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load subscriptions');
        this.loading.set(false);
      },
    });
  }
}
