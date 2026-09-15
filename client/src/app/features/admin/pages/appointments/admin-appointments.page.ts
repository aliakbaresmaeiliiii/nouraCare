import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import {
  AdminAppointmentItem,
  AdminAppointmentStatus,
} from '../../data/models/admin-api.models';
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

export interface AdminAppointmentRow {
  id: string;
  doctor: string;
  patient: string;
  when: string;
  type: string;
  status: string;
  fee: string;
  raw: AdminAppointmentItem;
}

@Component({
  selector: 'app-admin-appointments-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    AdminDataTableComponent,
    AdminDrawerComponent,
    AdminDialogComponent,
    AdminSkeletonComponent,
  ],
  templateUrl: './admin-appointments.page.html',
  styleUrl: './admin-appointments.page.scss',
})
export class AdminAppointmentsPage implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(AdminToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(TranslationService);
  private readonly language = inject(LanguageService);

  readonly loading = signal(true);
  readonly updating = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AdminAppointmentRow[]>([]);
  readonly selected = signal<AdminAppointmentRow | null>(null);
  readonly drawerOpen = signal(false);
  readonly actionOpen = signal(false);
  readonly pendingAction = signal<AdminAppointmentStatus | null>(null);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly typeFilter = signal('');
  readonly doctorId = signal('');
  readonly pendingCount = signal(0);
  readonly confirmedCount = signal(0);
  readonly cancelledCount = signal(0);

  private readonly lang = toSignal(this.language.currentLanguage$, {
    initialValue: this.language.getCurrentLanguage(),
  });

  readonly columns: AdminTableColumn<AdminAppointmentRow>[] = [
    { key: 'doctor', label: 'admin.appointments.col.doctor' },
    { key: 'patient', label: 'admin.appointments.col.patient' },
    { key: 'when', label: 'admin.appointments.col.when' },
    { key: 'type', label: 'admin.appointments.col.type' },
    { key: 'status', label: 'admin.appointments.col.status' },
    { key: 'fee', label: 'admin.appointments.col.fee' },
  ];

  readonly pageLabel = computed(() => {
    this.lang();
    return this.i18n.translateParams('admin.appointments.pageLabel', {
      page: this.page(),
      pages: this.totalPages(),
      total: this.total(),
    });
  });

  readonly allCount = computed(
    () => this.pendingCount() + this.confirmedCount() + this.cancelledCount(),
  );

  ngOnInit(): void {
    const doctorId = this.route.snapshot.queryParamMap.get('doctorId');
    if (doctorId) this.doctorId.set(doctorId);
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status) this.statusFilter.set(status);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listAppointments({
        page: this.page(),
        limit: this.limit(),
        search: this.search().trim() || undefined,
        status: this.statusFilter() || undefined,
        consultationType: this.typeFilter() || undefined,
        doctorId: this.doctorId().trim() || undefined,
      })
      .subscribe({
        next: (page) => {
          this.total.set(page.total);
          this.totalPages.set(page.totalPages);
          this.page.set(page.page);
          this.pendingCount.set(page.pendingCount);
          this.confirmedCount.set(page.confirmedCount);
          this.cancelledCount.set(page.cancelledCount);
          this.rows.set(page.items.map((a) => this.toRow(a)));
          this.loading.set(false);
          const sel = this.selected();
          if (sel) {
            const fresh = page.items.find((i) => i.id === sel.id);
            if (fresh) this.selected.set(this.toRow(fresh));
          }
        },
        error: () => {
          this.error.set('admin.appointments.error');
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
    this.typeFilter.set('');
    this.doctorId.set('');
    this.page.set(1);
    this.load();
  }

  filterStatus(status: string): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.load();
  }

  clearDoctorFilter(): void {
    this.doctorId.set('');
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

  openRow(row: AdminAppointmentRow): void {
    this.selected.set(row);
    this.drawerOpen.set(true);
  }

  askSetStatus(status: AdminAppointmentStatus): void {
    const row = this.selected();
    if (!row || row.raw.status === status) return;
    this.pendingAction.set(status);
    this.actionOpen.set(true);
  }

  closeActionDialog(): void {
    this.actionOpen.set(false);
    this.pendingAction.set(null);
  }

  actionDialogTitleKey(): string {
    return this.pendingAction() === 'CANCELLED'
      ? 'admin.appointments.cancelTitle'
      : 'admin.appointments.confirmTitle';
  }

  actionDialogConfirmKey(): string {
    return this.pendingAction() === 'CANCELLED'
      ? 'admin.appointments.cancel'
      : 'admin.appointments.confirm';
  }

  confirmAction(): void {
    const row = this.selected();
    const status = this.pendingAction();
    if (!row || !status || this.updating()) return;
    this.updating.set(true);
    this.api.updateAppointment(row.id, { status }).subscribe({
      next: (updated) => {
        this.updating.set(false);
        this.actionOpen.set(false);
        this.pendingAction.set(null);
        this.selected.set(this.toRow(updated));
        this.toast.show(this.i18n.translate('admin.appointments.updated'), 'success');
        this.load();
      },
      error: (err) => {
        this.updating.set(false);
        const msg =
          err?.error?.message ||
          this.i18n.translate('admin.appointments.updateError');
        this.toast.show(msg, 'danger');
      },
    });
  }

  exportAll(): void {
    const headers = [
      'id',
      'doctor',
      'patient',
      'email',
      'scheduledAt',
      'type',
      'status',
      'feeTomans',
    ];
    const data = this.rows().map((r) => [
      r.id,
      r.raw.doctor.fullName,
      r.raw.user.fullName || '',
      r.raw.user.email || '',
      r.raw.scheduledAt,
      r.raw.consultationType,
      r.raw.status,
      r.raw.feeTomans ?? '',
    ]);
    downloadCsv('dore-appointments', headers, data);
  }

  statusKey(status: string): string {
    return `admin.appointments.status.${status}`;
  }

  typeKey(type: string): string {
    return `admin.doctors.type.${type}`;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'admin-badge--success';
      case 'CANCELLED':
        return 'admin-badge--danger';
      default:
        return 'admin-badge--warning';
    }
  }

  formatFee(fee: number | null): string {
    if (fee == null) return '—';
    return fee.toLocaleString();
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0] || '')
      .join('')
      .toUpperCase();
  }

  private toRow(a: AdminAppointmentItem): AdminAppointmentRow {
    return {
      id: a.id,
      doctor: a.doctor.fullName,
      patient: a.user.fullName || a.user.email || '—',
      when: a.scheduledAt,
      type: a.consultationType,
      status: a.status,
      fee: a.feeTomans != null ? a.feeTomans.toLocaleString() : '—',
      raw: a,
    };
  }
}
