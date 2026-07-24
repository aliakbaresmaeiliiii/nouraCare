import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { AdminApiUser } from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminToastService } from '../../data/services/admin-toast.service';
import {
  AdminDataTableComponent,
  AdminTableColumn,
} from '../../shared-ui/data-table/admin-data-table.component';
import { AdminDrawerComponent } from '../../shared-ui/drawer/admin-drawer.component';
import { AdminSkeletonComponent } from '../../shared-ui/skeleton/admin-skeleton.component';
import { downloadCsv } from '../../shared-ui/utils/csv.util';

/** Row shape for the shared table (string ids). */
export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  registeredAt: string;
  lastLoginAt: string;
  subscription: string;
  raw: AdminApiUser;
}

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [
    FormsModule,
    AdminDataTableComponent,
    AdminDrawerComponent,
    AdminSkeletonComponent,
    DatePipe,
    TranslatePipe,
  ],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss',
})
export class AdminUsersPage implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(AdminToastService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AdminUserRow[]>([]);
  readonly selected = signal<AdminUserRow | null>(null);
  readonly drawerOpen = signal(false);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly roleFilter = signal('');
  readonly updating = signal(false);

  readonly columns: AdminTableColumn<AdminUserRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'registeredAt', label: 'Registered' },
    { key: 'lastLoginAt', label: 'Last open' },
    { key: 'subscription', label: 'Subscription' },
  ];

  readonly pageLabel = computed(
    () => `Page ${this.page()} of ${this.totalPages()} · ${this.total()} users`,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listUsers({
        page: this.page(),
        limit: this.limit(),
        search: this.search().trim() || undefined,
        status: this.statusFilter() || undefined,
        role: this.roleFilter() || undefined,
      })
      .subscribe({
        next: (page) => {
          this.total.set(page.total);
          this.totalPages.set(page.totalPages);
          this.page.set(page.page);
          this.rows.set(page.items.map((u) => this.toRow(u)));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('admin.users.error');
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
    this.roleFilter.set('');
    this.page.set(1);
    this.load();
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.load();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  private toRow(u: AdminApiUser): AdminUserRow {
    return {
      id: String(u.id),
      name: u.fullName || '—',
      email: u.email || '—',
      phone: u.phoneNumber || '—',
      role: u.role,
      status: u.status.toLowerCase(),
      registeredAt: u.createdAt,
      lastLoginAt: u.user_engagement?.lastOpenAt || u.updatedAt,
      subscription: u.user_subscription?.tier || 'FREE',
      raw: u,
    };
  }

  openUser(user: AdminUserRow): void {
    this.selected.set(user);
    this.drawerOpen.set(true);
  }

  setStatus(ids: string[], status: 'ACTIVE' | 'SUSPENDED'): void {
    if (!ids.length || this.updating()) return;
    this.updating.set(true);
    let done = 0;
    let failed = 0;
    const finish = () => {
      if (done + failed < ids.length) return;
      this.updating.set(false);
      if (failed) {
        this.toast.show(`Updated ${done}, failed ${failed}`, 'warning');
      } else {
        this.toast.show(`Updated ${done} users`, 'success');
      }
      this.load();
    };
    for (const id of ids) {
      this.api.updateUser(Number(id), { status }).subscribe({
        next: () => {
          done += 1;
          finish();
        },
        error: () => {
          failed += 1;
          finish();
        },
      });
    }
  }

  onBulk(event: { action: string; ids: string[] }): void {
    if (!event.ids.length) return;
    if (event.action === 'activate') {
      this.setStatus(event.ids, 'ACTIVE');
      return;
    }
    if (event.action === 'suspend') {
      this.setStatus(event.ids, 'SUSPENDED');
      return;
    }
    this.toast.show('Delete via API is not enabled', 'warning');
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  statusClass(status: string): string {
    const s = status.toLowerCase();
    if (s === 'active') return 'admin-badge--success';
    if (s === 'suspended') return 'admin-badge--danger';
    return 'admin-badge--muted';
  }

  exportAll(): void {
    downloadCsv(
      'dore-users',
      ['Name', 'Email', 'Phone', 'Role', 'Status', 'Subscription', 'Registered'],
      this.rows().map((r) => [
        r.name,
        r.email,
        r.phone,
        r.role,
        r.status,
        r.subscription,
        r.registeredAt,
      ]),
    );
  }
}
