import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, Paginated } from '../../core/admin-api';

@Component({
  selector: 'app-appointments',
  imports: [FormsModule, DatePipe],
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
})
export class Appointments implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  result = signal<Paginated<any> | null>(null);
  loading = signal(true);
  error = signal('');
  status = '';
  page = 1;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminApi
      .listAppointments({
        page: this.page,
        limit: 20,
        status: this.status || undefined,
      })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load appointments');
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  prev(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.load();
    }
  }

  next(): void {
    const totalPages = this.result()?.totalPages ?? 1;
    if (this.page < totalPages) {
      this.page += 1;
      this.load();
    }
  }
}
