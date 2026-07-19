import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminUserRow, Paginated } from '../../core/admin-api';

@Component({
  selector: 'app-users',
  imports: [FormsModule, DatePipe],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  result = signal<Paginated<AdminUserRow> | null>(null);
  loading = signal(true);
  error = signal('');
  search = '';
  status = '';
  role = '';
  page = 1;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.adminApi
      .listUsers({
        page: this.page,
        limit: 20,
        search: this.search.trim() || undefined,
        status: this.status || undefined,
        role: this.role || undefined,
      })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load users');
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

  setStatus(user: AdminUserRow, status: string): void {
    this.adminApi.updateUser(user.id, { status }).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'Update failed'),
    });
  }

  setRole(user: AdminUserRow, role: string): void {
    if (!confirm(`Change role of ${user.email} to ${role}?`)) return;
    this.adminApi.updateUser(user.id, { role }).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'Update failed'),
    });
  }
}
