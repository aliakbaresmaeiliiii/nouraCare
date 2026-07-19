import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, Paginated } from '../../core/admin-api';

@Component({
  selector: 'app-forums',
  imports: [FormsModule, DatePipe],
  templateUrl: './forums.html',
  styleUrl: './forums.scss',
})
export class Forums implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  result = signal<Paginated<any> | null>(null);
  loading = signal(true);
  error = signal('');
  search = '';
  page = 1;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminApi
      .listThreads({
        page: this.page,
        limit: 20,
        search: this.search.trim() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load threads');
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

  toggleLock(thread: { id: string; isLocked: boolean }): void {
    this.adminApi.updateThread(thread.id, { isLocked: !thread.isLocked }).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'Update failed'),
    });
  }

  togglePin(thread: { id: string; isPinned: boolean }): void {
    this.adminApi.updateThread(thread.id, { isPinned: !thread.isPinned }).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'Update failed'),
    });
  }

  remove(thread: { id: string; title: string }): void {
    if (!confirm(`Delete thread “${thread.title}”? This cannot be undone.`)) return;
    this.adminApi.deleteThread(thread.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'Delete failed'),
    });
  }
}
