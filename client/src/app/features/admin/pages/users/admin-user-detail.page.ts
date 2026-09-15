import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TranslationService } from '@app/shared/services/translation.service';
import { AdminApiUser } from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminToastService } from '../../data/services/admin-toast.service';
import { AdminDialogComponent } from '../../shared-ui/dialog/admin-dialog.component';
import { AdminSkeletonComponent } from '../../shared-ui/skeleton/admin-skeleton.component';

@Component({
  selector: 'app-admin-user-detail-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    AdminDialogComponent,
    AdminSkeletonComponent,
  ],
  templateUrl: './admin-user-detail.page.html',
  styleUrl: './admin-user-detail.page.scss',
})
export class AdminUserDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(AdminToastService);
  private readonly i18n = inject(TranslationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly user = signal<AdminApiUser | null>(null);
  readonly editOpen = signal(false);
  readonly deleteOpen = signal(false);

  editFullName = '';
  editEmail = '';
  editPhone = '';
  editRole = 'USER';
  editStatus = 'ACTIVE';
  editVerified = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('admin.users.notFound');
      this.loading.set(false);
      return;
    }
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getUser(id).subscribe({
      next: (u) => {
        this.user.set(u);
        this.syncEditForm(u);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('admin.users.notFound');
        this.loading.set(false);
      },
    });
  }

  syncEditForm(u: AdminApiUser): void {
    this.editFullName = u.fullName || '';
    this.editEmail = u.email || '';
    this.editPhone = u.phoneNumber || '';
    this.editRole = u.role || 'USER';
    this.editStatus = u.status || 'ACTIVE';
    this.editVerified = !!u.isVerified;
  }

  modeLabel(state?: string | null): string {
    if (!state) return '—';
    const key = `admin.dashboard.mode.${state.toLowerCase()}`;
    const translated = this.i18n.translate(key);
    return translated === key ? state : translated;
  }

  openEdit(): void {
    const u = this.user();
    if (!u) return;
    this.syncEditForm(u);
    this.editOpen.set(true);
  }

  saveEdit(): void {
    const u = this.user();
    if (!u || this.saving()) return;
    this.saving.set(true);
    this.api
      .updateUser(u.id, {
        fullName: this.editFullName.trim(),
        email: this.editEmail.trim(),
        phoneNumber: this.editPhone.trim(),
        role: this.editRole,
        status: this.editStatus,
        isVerified: this.editVerified,
      })
      .subscribe({
        next: (updated) => {
          this.user.set({ ...u, ...updated });
          this.saving.set(false);
          this.editOpen.set(false);
          this.toast.show(this.i18n.translate('admin.users.toast.updated'), 'success');
          this.load(u.id);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.show(
            err?.error?.message ||
              err?.message ||
              this.i18n.translate('admin.users.toast.updateFailed'),
            'danger',
          );
        },
      });
  }

  setStatus(status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'): void {
    const u = this.user();
    if (!u || this.saving()) return;
    this.saving.set(true);
    this.api.updateUser(u.id, { status }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show(this.i18n.translate('admin.users.toast.statusChanged'), 'success');
        this.load(u.id);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(
          err?.error?.message || this.i18n.translate('admin.users.toast.updateFailed'),
          'danger',
        );
      },
    });
  }

  confirmDelete(): void {
    this.deleteOpen.set(true);
  }

  deleteUser(): void {
    const u = this.user();
    if (!u || this.saving()) return;
    this.saving.set(true);
    this.api.deleteUser(u.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.deleteOpen.set(false);
        this.toast.show(this.i18n.translate('admin.users.toast.deleted'), 'success');
        void this.router.navigateByUrl('/admin/users');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(
          err?.error?.message || this.i18n.translate('admin.users.toast.deleteFailed'),
          'danger',
        );
      },
    });
  }

  initials(name: string | null | undefined): string {
    return (name || '?')
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
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

  statusClass(status: string): string {
    const s = status.toLowerCase();
    if (s === 'active') return 'admin-badge--success';
    if (s === 'suspended') return 'admin-badge--danger';
    return 'admin-badge--muted';
  }
}
