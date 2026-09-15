import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { AdminApiUser } from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminToastService } from '../../data/services/admin-toast.service';
import {
  AdminDataTableComponent,
  AdminTableColumn,
} from '../../shared-ui/data-table/admin-data-table.component';
import { AdminDialogComponent } from '../../shared-ui/dialog/admin-dialog.component';
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
  actions: string;
  raw: AdminApiUser;
}

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    AdminDataTableComponent,
    AdminDrawerComponent,
    AdminDialogComponent,
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
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);
  private readonly language = inject(LanguageService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AdminUserRow[]>([]);
  readonly selected = signal<AdminUserRow | null>(null);
  readonly drawerOpen = signal(false);
  readonly createOpen = signal(false);
  readonly editOpen = signal(false);
  readonly deleteOpen = signal(false);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly roleFilter = signal('');
  readonly updating = signal(false);

  private readonly lang = toSignal(this.language.currentLanguage$, {
    initialValue: this.language.getCurrentLanguage(),
  });

  createFullName = '';
  createEmail = '';
  createPhone = '';
  createRole = 'USER';

  editFullName = '';
  editEmail = '';
  editPhone = '';
  editRole = 'USER';
  editStatus = 'ACTIVE';
  editVerified = true;

  readonly columns: AdminTableColumn<AdminUserRow>[] = [
    { key: 'name', label: 'admin.users.col.name' },
    { key: 'email', label: 'admin.users.col.email' },
    { key: 'phone', label: 'admin.users.col.phone' },
    { key: 'role', label: 'admin.users.col.role' },
    { key: 'status', label: 'admin.users.col.status' },
    { key: 'registeredAt', label: 'admin.users.col.registered' },
    { key: 'lastLoginAt', label: 'admin.users.col.lastOpen' },
    { key: 'subscription', label: 'admin.users.col.subscription' },
    { key: 'actions', label: 'admin.users.col.actions', sortable: false, width: '120px' },
  ];

  readonly pageLabel = computed(() => {
    this.lang();
    return this.i18n.translateParams('admin.users.pageLabel', {
      page: this.page(),
      pages: this.totalPages(),
      total: this.total(),
    });
  });

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
      actions: '',
      raw: u,
    };
  }

  statusKey(status: string): string {
    return `admin.status.${status.toLowerCase()}`;
  }

  roleKey(role: string): string {
    return `admin.role.${role}`;
  }

  tierKey(tier: string): string {
    return `admin.tier.${tier}`;
  }

  openUser(user: AdminUserRow): void {
    this.selected.set(user);
    this.drawerOpen.set(true);
  }

  goDetail(user: AdminUserRow, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate(['/admin/users', user.id]);
  }

  openCreate(): void {
    this.createFullName = '';
    this.createEmail = '';
    this.createPhone = '';
    this.createRole = 'USER';
    this.createOpen.set(true);
  }

  saveCreate(): void {
    if (this.updating()) return;
    this.updating.set(true);
    this.api
      .createUser({
        fullName: this.createFullName.trim(),
        email: this.createEmail.trim(),
        phoneNumber: this.createPhone.trim(),
        role: this.createRole,
      })
      .subscribe({
        next: () => {
          this.updating.set(false);
          this.createOpen.set(false);
          this.toast.show(this.i18n.translate('admin.users.toast.created'), 'success');
          this.load();
        },
        error: (err) => {
          this.updating.set(false);
          this.toast.show(
            err?.error?.message || this.i18n.translate('admin.users.toast.createFailed'),
            'danger',
          );
        },
      });
  }

  openEdit(user: AdminUserRow, event?: Event): void {
    event?.stopPropagation();
    this.selected.set(user);
    const u = user.raw;
    this.editFullName = u.fullName || '';
    this.editEmail = u.email || '';
    this.editPhone = u.phoneNumber || '';
    this.editRole = u.role || 'USER';
    this.editStatus = u.status || 'ACTIVE';
    this.editVerified = !!u.isVerified;
    this.editOpen.set(true);
  }

  saveEdit(): void {
    const row = this.selected();
    if (!row || this.updating()) return;
    this.updating.set(true);
    this.api
      .updateUser(Number(row.id), {
        fullName: this.editFullName.trim(),
        email: this.editEmail.trim(),
        phoneNumber: this.editPhone.trim(),
        role: this.editRole,
        status: this.editStatus,
        isVerified: this.editVerified,
      })
      .subscribe({
        next: () => {
          this.updating.set(false);
          this.editOpen.set(false);
          this.toast.show(this.i18n.translate('admin.users.toast.updated'), 'success');
          this.load();
        },
        error: (err) => {
          this.updating.set(false);
          this.toast.show(
            err?.error?.message || this.i18n.translate('admin.users.toast.updateFailed'),
            'danger',
          );
        },
      });
  }

  openDelete(user: AdminUserRow, event?: Event): void {
    event?.stopPropagation();
    this.selected.set(user);
    this.deleteOpen.set(true);
  }

  confirmDelete(): void {
    const row = this.selected();
    if (!row || this.updating()) return;
    this.updating.set(true);
    this.api.deleteUser(Number(row.id)).subscribe({
      next: () => {
        this.updating.set(false);
        this.deleteOpen.set(false);
        this.drawerOpen.set(false);
        this.toast.show(this.i18n.translate('admin.users.toast.deleted'), 'success');
        this.load();
      },
      error: (err) => {
        this.updating.set(false);
        this.toast.show(
          err?.error?.message || this.i18n.translate('admin.users.toast.deleteFailed'),
          'danger',
        );
      },
    });
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
        this.toast.show(
          this.i18n.translateParams('admin.users.toast.bulkPartial', { done, failed }),
          'warning',
        );
      } else {
        this.toast.show(
          this.i18n.translateParams('admin.users.toast.bulkUpdated', { done }),
          'success',
        );
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
    if (event.action === 'delete') {
      if (
        !confirm(
          this.i18n.translateParams('admin.users.confirmBulkDelete', {
            count: event.ids.length,
          }),
        )
      ) {
        return;
      }
      this.updating.set(true);
      let done = 0;
      let failed = 0;
      const finish = () => {
        if (done + failed < event.ids.length) return;
        this.updating.set(false);
        this.toast.show(
          failed
            ? this.i18n.translateParams('admin.users.toast.bulkDeletePartial', { done, failed })
            : this.i18n.translateParams('admin.users.toast.bulkDeleted', { done }),
          failed ? 'warning' : 'success',
        );
        this.load();
      };
      for (const id of event.ids) {
        this.api.deleteUser(Number(id)).subscribe({
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
      [
        this.i18n.translate('admin.users.col.name'),
        this.i18n.translate('admin.users.col.email'),
        this.i18n.translate('admin.users.col.phone'),
        this.i18n.translate('admin.users.col.role'),
        this.i18n.translate('admin.users.col.status'),
        this.i18n.translate('admin.users.col.subscription'),
        this.i18n.translate('admin.users.col.registered'),
      ],
      this.rows().map((r) => [
        r.name,
        r.email,
        r.phone,
        this.i18n.translate(this.roleKey(r.role)),
        this.i18n.translate(this.statusKey(r.status)),
        this.i18n.translate(this.tierKey(r.subscription)),
        r.registeredAt,
      ]),
    );
  }
}
