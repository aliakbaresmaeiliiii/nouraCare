import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, Paginated } from '../../core/admin-api';

@Component({
  selector: 'app-doctors',
  imports: [FormsModule],
  templateUrl: './doctors.html',
  styleUrl: './doctors.scss',
})
export class Doctors implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  result = signal<Paginated<any> | null>(null);
  loading = signal(true);
  error = signal('');
  search = '';
  verified: '' | 'true' | 'false' = '';
  page = 1;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminApi
      .listDoctors({
        page: this.page,
        limit: 20,
        search: this.search.trim() || undefined,
        verified:
          this.verified === '' ? undefined : this.verified === 'true',
      })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load doctors');
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

  toggleVerify(doctor: { id: string; isVerified: boolean; fullName: string }): void {
    this.adminApi
      .updateDoctor(doctor.id, { isVerified: !doctor.isVerified })
      .subscribe({
        next: () => this.load(),
        error: (err) => alert(err?.error?.message || 'Update failed'),
      });
  }
}
