import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { DoctorService } from '../shared/services/doctor.service';
import { DoctorDto } from '../shared/models/doctor.dto';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-doctors',
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss'],
  standalone: true,
  imports: [
    ...SHARED_STANDALONE_IMPORTS,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    CdkFixedSizeVirtualScroll,
  ],
})
export class DoctorsComponent implements OnInit, OnDestroy {
  private readonly avatarWomenPath = 'assets/images/avatarWomen.png';
  private readonly avatarMenPath = 'assets/images/avatarMan.png';
  /** Matches approximate card height for CDK virtual scroll. */
  readonly virtualItemSizePx = 520;
  /** Page size for API + infinite scroll batches. */
  readonly pageSize = 12;

  doctors: DoctorDto[] = [];
  filteredDoctors: DoctorDto[] = [];
  totalDoctors = 0;
  isLoading = false;
  loadingMore = false;
  searchTerm = '';
  selectedSpecialty = 'all';
  selectedConsultationType = 'all';

  private currentPage = 0;
  private totalPages = 1;
  hasMore = true;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  specialties = [
    'Obstetrics & Gynecology',
    'Maternal-Fetal Medicine',
    'Reproductive Endocrinology',
    'Fertility Specialist',
    'Prenatal Care',
    'High-Risk Pregnancy',
  ];

  consultationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'ONLINE', label: 'Online Only' },
    { value: 'IN_PERSON', label: 'In-Person Only' },
    { value: 'BOTH', label: 'Both Available' },
  ];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private doctorService: DoctorService,
  ) {}

  ngOnInit() {
    this.reloadFromApi();
  }

  ngOnDestroy() {
    clearTimeout(this.searchDebounce);
  }

  trackByDoctorId(_index: number, doctor: DoctorDto): string {
    return doctor.id ?? String(_index);
  }

  reloadFromApi() {
    clearTimeout(this.searchDebounce);
    this.currentPage = 0;
    this.totalPages = 1;
    this.hasMore = true;
    this.doctors = [];
    this.filteredDoctors = [];
    void this.fetchPage(true);
  }

  private fetchPage(isInitial: boolean) {
    if (this.loadingMore) {
      return;
    }
    if (!isInitial && !this.hasMore) {
      return;
    }

    const nextPage = isInitial ? 1 : this.currentPage + 1;
    if (!isInitial && nextPage > this.totalPages) {
      return;
    }

    this.loadingMore = true;
    if (isInitial) {
      this.isLoading = true;
    }

    this.doctorService
      .getDoctorsPage({
        page: nextPage,
        limit: this.pageSize,
        search: this.searchTerm?.trim() || undefined,
        specialty: this.selectedSpecialty === 'all' ? undefined : this.selectedSpecialty,
        consultationType:
          this.selectedConsultationType === 'all' ? undefined : this.selectedConsultationType,
      })
      .pipe(
        finalize(() => {
          this.loadingMore = false;
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {
          this.totalDoctors = res.total;
          this.totalPages = res.totalPages;
          this.currentPage = res.page;
          this.hasMore = res.hasMore;
          if (isInitial) {
            this.doctors = res.items;
          } else {
            const existing = new Set(this.doctors.map((d) => d.id).filter(Boolean));
            const appended = res.items.filter((d) => d.id && !existing.has(d.id));
            this.doctors = [...this.doctors, ...appended];
          }
          this.filteredDoctors = this.doctors;
        },
        error: async () => {
          await this.showToast('Could not load doctors. Check your connection and API.', 'danger');
        },
      });
  }

  onVirtualScroll(viewport: CdkVirtualScrollViewport) {
    if (this.loadingMore || !this.hasMore) {
      return;
    }
    const { end } = viewport.getRenderedRange();
    if (end >= this.filteredDoctors.length - 2) {
      this.fetchPage(false);
    }
  }

  searchDoctors(event: Event) {
    const value = (event.target as HTMLIonSearchbarElement)?.value ?? '';
    this.searchTerm = typeof value === 'string' ? value : '';
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.reloadFromApi(), 350);
  }

  async toggleSpecialtyFilter() {
    const sheet = await this.actionSheetController.create({
      header: 'Specialty',
      buttons: [
        {
          text: 'All specialties',
          handler: () => {
            this.selectedSpecialty = 'all';
            this.reloadFromApi();
          },
        },
        ...this.specialties.map((s) => ({
          text: s,
          handler: () => {
            this.selectedSpecialty = s;
            this.reloadFromApi();
          },
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async toggleConsultationFilter() {
    const sheet = await this.actionSheetController.create({
      header: 'Consultation type',
      buttons: [
        ...this.consultationTypes.map((c) => ({
          text: c.label,
          handler: () => {
            this.selectedConsultationType = c.value;
            this.reloadFromApi();
          },
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedSpecialty = 'all';
    this.selectedConsultationType = 'all';
    this.reloadFromApi();
  }

  async bookWithDoctor(doctor: DoctorDto) {
    const alert = await this.alertController.create({
      header: `Book with ${doctor.fullName}`,
      message: `${doctor.specialty}\n\nFee: $${doctor.fee}\n\n${doctor.about.substring(0, 100)}...`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Book Appointment',
          handler: () => {
            this.showBookingOptions(doctor);
          },
        },
        {
          text: 'View Profile',
          handler: () => {
            this.viewDoctorProfile(doctor);
          },
        },
      ],
    });
    await alert.present();
  }

  async showBookingOptions(doctor: DoctorDto) {
    const buttons: {
      text: string;
      role?: string;
      handler?: () => void;
    }[] = [];

    if (doctor.consultationType === 'ONLINE' || doctor.consultationType === 'BOTH') {
      buttons.push({
        text: '💻 Online Consultation',
        handler: () => this.bookAppointment(doctor, 'online'),
      });
    }
    if (doctor.consultationType === 'IN_PERSON' || doctor.consultationType === 'BOTH') {
      buttons.push({
        text: '🏥 In-Person Visit',
        handler: () => this.bookAppointment(doctor, 'in-person'),
      });
    }
    buttons.push({ text: 'Cancel', role: 'cancel' });

    const alert = await this.alertController.create({
      header: 'Choose Consultation Type',
      message: `How would you like to consult with ${doctor.fullName}?`,
      buttons,
    });
    await alert.present();
  }

  async bookAppointment(doctor: DoctorDto, type: string) {
    const alert = await this.alertController.create({
      header: '✅ Booking Confirmed!',
      message: `Your ${type} consultation with ${doctor.fullName} has been scheduled.\n\nYou will receive a confirmation email shortly.`,
      buttons: ['OK'],
    });
    await alert.present();
    await this.showToast(`Appointment booked with ${doctor.fullName}!`, 'success');
  }

  viewDoctorProfile(doctor: DoctorDto) {
    if (!doctor.id) {
      return;
    }
    this.router.navigate(['/doctor', doctor.id]);
  }

  getConsultationTypeLabel(type: string): string {
    switch (type) {
      case 'ONLINE':
        return 'Online';
      case 'IN_PERSON':
        return 'In-Person';
      case 'BOTH':
        return 'Hybrid';
      default:
        return 'Available';
    }
  }

  getConsultationIcon(type: string): string {
    switch (type) {
      case 'ONLINE':
        return 'videocam';
      case 'IN_PERSON':
        return 'business';
      case 'BOTH':
        return 'globe';
      default:
        return 'medical';
    }
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getDoctorAvatar(doctor: DoctorDto): string {
    if (doctor.profileImageUrl?.trim()) {
      return doctor.profileImageUrl;
    }
    const seed = `${doctor.id ?? ''}${doctor.fullName ?? ''}`.toLowerCase().trim();
    if (!seed) {
      return this.avatarWomenPath;
    }
    const codeSum = Array.from(seed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return codeSum % 2 === 0 ? this.avatarWomenPath : this.avatarMenPath;
  }

  hasActiveFilters(): boolean {
    return (
      this.searchTerm.length > 0 ||
      this.selectedSpecialty !== 'all' ||
      this.selectedConsultationType !== 'all'
    );
  }

  goBack() {
    this.router.navigate(['/tabs/consultation']);
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
