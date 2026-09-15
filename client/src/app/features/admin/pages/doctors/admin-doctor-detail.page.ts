import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TranslationService } from '@app/shared/services/translation.service';
import {
  AdminDoctorConsultationType,
  AdminDoctorDetail,
} from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminToastService } from '../../data/services/admin-toast.service';
import { AdminDialogComponent } from '../../shared-ui/dialog/admin-dialog.component';
import { AdminSkeletonComponent } from '../../shared-ui/skeleton/admin-skeleton.component';

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
  selector: 'app-admin-doctor-detail-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    AdminDialogComponent,
    AdminSkeletonComponent,
  ],
  templateUrl: './admin-doctor-detail.page.html',
  styleUrl: './admin-doctor-detail.page.scss',
})
export class AdminDoctorDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(AdminToastService);
  private readonly i18n = inject(TranslationService);

  readonly specialties = SPECIALTIES;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly doctor = signal<AdminDoctorDetail | null>(null);
  readonly editOpen = signal(false);
  readonly deleteOpen = signal(false);
  readonly verifyOpen = signal(false);

  editFullName = '';
  editSpecialty = SPECIALTIES[0];
  editExperience = 0;
  editAbout = '';
  editClinic = '';
  editLocation = '';
  editEmail = '';
  editPhone = '';
  editType: AdminDoctorConsultationType = 'BOTH';
  editFee: number | null = null;
  editLicense = '';
  editRating = 0;
  editVerified = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('admin.doctors.notFound');
      this.loading.set(false);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getDoctor(id).subscribe({
      next: (d) => {
        this.doctor.set(d);
        this.syncEditForm(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('admin.doctors.notFound');
        this.loading.set(false);
      },
    });
  }

  syncEditForm(d: AdminDoctorDetail): void {
    this.editFullName = d.fullName;
    this.editSpecialty = d.specialty || 'Other';
    this.editExperience = d.experienceYears;
    this.editAbout = d.about;
    this.editClinic = d.clinicName || '';
    this.editLocation = d.location || '';
    this.editEmail = d.contactEmail || '';
    this.editPhone = d.contactPhone || '';
    this.editType = d.consultationType;
    this.editFee = d.fee;
    this.editLicense = d.licenseNumber || '';
    this.editRating = d.rating;
    this.editVerified = d.isVerified;
  }

  openEdit(): void {
    const d = this.doctor();
    if (!d) return;
    this.syncEditForm(d);
    this.editOpen.set(true);
  }

  saveEdit(): void {
    const d = this.doctor();
    if (!d || this.saving()) return;
    const fullName = this.editFullName.trim();
    const about = this.editAbout.trim();
    if (fullName.length < 2 || about.length < 10) {
      this.toast.show(this.i18n.translate('admin.doctors.createInvalid'), 'warning');
      return;
    }

    this.saving.set(true);
    this.api
      .updateDoctor(d.id, {
        fullName,
        specialty: this.editSpecialty.trim(),
        experienceYears: Number(this.editExperience) || 0,
        about,
        clinicName: this.editClinic.trim() || null,
        location: this.editLocation.trim() || null,
        contactEmail: this.editEmail.trim() || null,
        contactPhone: this.editPhone.trim() || null,
        consultationType: this.editType,
        fee: this.editFee,
        licenseNumber: this.editLicense.trim() || null,
        rating: Number(this.editRating) || 0,
        isVerified: this.editVerified,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editOpen.set(false);
          this.toast.show(this.i18n.translate('admin.doctors.updatedToast'), 'success');
          this.load(d.id);
        },
        error: () => {
          this.saving.set(false);
          this.toast.show(this.i18n.translate('admin.doctors.updateError'), 'danger');
        },
      });
  }

  askToggleVerify(): void {
    if (!this.doctor()) return;
    this.verifyOpen.set(true);
  }

  verifyDialogTitleKey(): string {
    return this.doctor()?.isVerified
      ? 'admin.doctors.unverifyTitle'
      : 'admin.doctors.verifyTitle';
  }

  confirmToggleVerify(): void {
    const d = this.doctor();
    if (!d || this.saving()) return;
    this.saving.set(true);
    this.api.updateDoctor(d.id, { isVerified: !d.isVerified }).subscribe({
      next: () => {
        this.saving.set(false);
        this.verifyOpen.set(false);
        this.toast.show(
          this.i18n.translate(
            d.isVerified
              ? 'admin.doctors.unverifiedToast'
              : 'admin.doctors.verifiedToast',
          ),
          'success',
        );
        this.load(d.id);
      },
      error: () => {
        this.saving.set(false);
        this.toast.show(this.i18n.translate('admin.doctors.updateError'), 'danger');
      },
    });
  }

  confirmDelete(): void {
    this.deleteOpen.set(true);
  }

  deleteDoctor(): void {
    const d = this.doctor();
    if (!d || this.saving()) return;
    this.saving.set(true);
    this.api.deleteDoctor(d.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.deleteOpen.set(false);
        this.toast.show(this.i18n.translate('admin.doctors.deleted'), 'success');
        void this.router.navigate(['/admin/doctors']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg =
          err?.error?.message ||
          this.i18n.translate('admin.doctors.deleteError');
        this.toast.show(msg, 'danger');
      },
    });
  }

  typeKey(type: string): string {
    return `admin.doctors.type.${type}`;
  }

  statusKey(status: string): string {
    return `admin.appointments.status.${status}`;
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

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0] || '')
      .join('')
      .toUpperCase();
  }
}
