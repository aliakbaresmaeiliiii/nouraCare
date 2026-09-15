import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import {
  AdminApiDoctor,
  AdminDoctorConsultationType,
  AdminDoctorCreateBody,
} from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminToastService } from '../../data/services/admin-toast.service';
import {
  AdminDataTableComponent,
  AdminTableColumn,
} from '../../shared-ui/data-table/admin-data-table.component';
import { AdminDialogComponent } from '../../shared-ui/dialog/admin-dialog.component';
import { AdminSkeletonComponent } from '../../shared-ui/skeleton/admin-skeleton.component';
import { downloadCsv } from '../../shared-ui/utils/csv.util';

export interface AdminDoctorRow {
  id: string;
  name: string;
  specialty: string;
  type: string;
  fee: string;
  rating: string;
  appointments: string;
  verified: string;
  location: string;
  createdAt: string;
  raw: AdminApiDoctor;
}

const SPECIALTIES = [
  'Obstetrics & Gynecology',
  'Psychology',
  'Pediatrics',
  'Dermatology',
  'Fertility',
  'Internal Medicine',
  'Nutrition',
  'Other',
];

@Component({
  selector: 'app-admin-doctors-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    AdminDataTableComponent,
    AdminDialogComponent,
    AdminSkeletonComponent,
  ],
  templateUrl: './admin-doctors.page.html',
  styleUrl: './admin-doctors.page.scss',
})
export class AdminDoctorsPage implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(AdminToastService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);
  private readonly language = inject(LanguageService);

  readonly specialties = SPECIALTIES;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AdminDoctorRow[]>([]);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly search = signal('');
  readonly verifiedFilter = signal('');
  readonly verifiedCount = signal(0);
  readonly unverifiedCount = signal(0);
  readonly createOpen = signal(false);
  readonly verifyOpen = signal(false);
  readonly verifyTarget = signal<AdminDoctorRow | null>(null);

  createFullName = '';
  createSpecialty = SPECIALTIES[0];
  createExperience = 5;
  createAbout = '';
  createClinic = '';
  createLocation = '';
  createEmail = '';
  createPhone = '';
  createType: AdminDoctorConsultationType = 'BOTH';
  createFee: number | null = null;
  createLicense = '';
  createVerified = false;

  private readonly lang = toSignal(this.language.currentLanguage$, {
    initialValue: this.language.getCurrentLanguage(),
  });

  readonly columns: AdminTableColumn<AdminDoctorRow>[] = [
    { key: 'name', label: 'admin.doctors.col.name' },
    { key: 'specialty', label: 'admin.doctors.col.specialty' },
    { key: 'type', label: 'admin.doctors.col.type' },
    { key: 'fee', label: 'admin.doctors.col.fee' },
    { key: 'rating', label: 'admin.doctors.col.rating' },
    { key: 'appointments', label: 'admin.doctors.col.appointments' },
    { key: 'verified', label: 'admin.doctors.col.verified' },
    { key: 'location', label: 'admin.doctors.col.location' },
  ];

  readonly pageLabel = computed(() => {
    this.lang();
    return this.i18n.translateParams('admin.doctors.pageLabel', {
      page: this.page(),
      pages: this.totalPages(),
      total: this.total(),
    });
  });

  readonly catalogTotal = computed(
    () => this.verifiedCount() + this.unverifiedCount(),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const verified =
      this.verifiedFilter() === ''
        ? undefined
        : this.verifiedFilter() === 'true';
    this.api
      .listDoctors({
        page: this.page(),
        limit: this.limit(),
        search: this.search().trim() || undefined,
        verified,
      })
      .subscribe({
        next: (page) => {
          this.total.set(page.total);
          this.totalPages.set(page.totalPages);
          this.page.set(page.page);
          this.verifiedCount.set(page.verifiedCount);
          this.unverifiedCount.set(page.unverifiedCount);
          this.rows.set(page.items.map((d) => this.toRow(d)));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('admin.doctors.error');
          this.loading.set(false);
        },
      });
  }

  setVerifiedFilter(value: string): void {
    this.verifiedFilter.set(value);
    this.page.set(1);
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.search.set('');
    this.verifiedFilter.set('');
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

  openDoctor(row: AdminDoctorRow): void {
    void this.router.navigate(['/admin/doctors', row.id]);
  }

  openCreate(): void {
    this.createFullName = '';
    this.createSpecialty = SPECIALTIES[0];
    this.createExperience = 5;
    this.createAbout = '';
    this.createClinic = '';
    this.createLocation = '';
    this.createEmail = '';
    this.createPhone = '';
    this.createType = 'BOTH';
    this.createFee = null;
    this.createLicense = '';
    this.createVerified = false;
    this.createOpen.set(true);
  }

  createDoctor(): void {
    if (this.saving()) return;
    const fullName = this.createFullName.trim();
    const about = this.createAbout.trim();
    if (fullName.length < 2 || about.length < 10) {
      this.toast.show(this.i18n.translate('admin.doctors.createInvalid'), 'warning');
      return;
    }

    const body: AdminDoctorCreateBody = {
      fullName,
      specialty: this.createSpecialty.trim() || 'Other',
      experienceYears: Number(this.createExperience) || 0,
      about,
      consultationType: this.createType,
      isVerified: this.createVerified,
    };
    if (this.createClinic.trim()) body.clinicName = this.createClinic.trim();
    if (this.createLocation.trim()) body.location = this.createLocation.trim();
    if (this.createEmail.trim()) body.contactEmail = this.createEmail.trim();
    if (this.createPhone.trim()) body.contactPhone = this.createPhone.trim();
    if (this.createLicense.trim()) body.licenseNumber = this.createLicense.trim();
    if (this.createFee != null && this.createFee >= 0) body.fee = this.createFee;

    this.saving.set(true);
    this.api.createDoctor(body).subscribe({
      next: (doctor) => {
        this.saving.set(false);
        this.createOpen.set(false);
        this.toast.show(this.i18n.translate('admin.doctors.created'), 'success');
        void this.router.navigate(['/admin/doctors', doctor.id]);
      },
      error: () => {
        this.saving.set(false);
        this.toast.show(this.i18n.translate('admin.doctors.createError'), 'danger');
      },
    });
  }

  askToggleVerify(row: AdminDoctorRow, event: Event): void {
    event.stopPropagation();
    this.verifyTarget.set(row);
    this.verifyOpen.set(true);
  }

  closeVerifyDialog(): void {
    this.verifyOpen.set(false);
    this.verifyTarget.set(null);
  }

  verifyDialogTitleKey(): string {
    return this.verifyTarget()?.raw.isVerified
      ? 'admin.doctors.unverifyTitle'
      : 'admin.doctors.verifyTitle';
  }

  confirmToggleVerify(): void {
    const row = this.verifyTarget();
    if (!row || this.saving()) return;
    this.saving.set(true);
    this.api
      .updateDoctor(row.id, { isVerified: !row.raw.isVerified })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.verifyOpen.set(false);
          this.verifyTarget.set(null);
          this.toast.show(
            this.i18n.translate(
              row.raw.isVerified
                ? 'admin.doctors.unverifiedToast'
                : 'admin.doctors.verifiedToast',
            ),
            'success',
          );
          this.load();
        },
        error: () => {
          this.saving.set(false);
          this.toast.show(this.i18n.translate('admin.doctors.updateError'), 'danger');
        },
      });
  }

  exportAll(): void {
    const headers = [
      'id',
      'fullName',
      'specialty',
      'consultationType',
      'fee',
      'rating',
      'isVerified',
      'location',
      'contactEmail',
      'appointments',
    ];
    const data = this.rows().map((r) => [
      r.id,
      r.raw.fullName,
      r.raw.specialty,
      r.raw.consultationType,
      r.raw.fee ?? '',
      r.raw.rating,
      r.raw.isVerified ? 'yes' : 'no',
      r.raw.location ?? '',
      r.raw.contactEmail ?? '',
      r.raw._count?.doctor_appointments ?? 0,
    ]);
    downloadCsv('dore-doctors', headers, data);
  }

  typeKey(type: string): string {
    return `admin.doctors.type.${type}`;
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

  private toRow(d: AdminApiDoctor): AdminDoctorRow {
    return {
      id: d.id,
      name: d.fullName,
      specialty: d.specialty,
      type: d.consultationType,
      fee: d.fee != null ? String(d.fee) : '—',
      rating: d.rating.toFixed(1),
      appointments: String(d._count?.doctor_appointments ?? 0),
      verified: d.isVerified ? 'yes' : 'no',
      location: d.location || d.clinicName || '—',
      createdAt: d.createdAt,
      raw: d,
    };
  }
}
