import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DoctorService } from '../shared/services/doctor.service';
import { DoctorDisplayService } from '../shared/services/doctor-display.service';
import { DoctorBookingService } from '../shared/services/doctor-booking.service';
import { DoctorDto, ConsultationType } from '../shared/models/doctor.dto';
import { LogoLoadingComponent } from '../shared/components/logo-loading/logo-loading.component';
import { DoctorAvatarComponent } from '../shared/components/doctor-avatar/doctor-avatar.component';
import { DoctorMedicalCodeComponent } from '../shared/components/doctor-medical-code/doctor-medical-code.component';
import { LocalizedNumberPipe } from '../shared/pipes/localized-number.pipe';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { TranslationService } from '../shared/services/translation.service';
import { LanguageService } from '../shared/services/language.service';

@Component({
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.component.html',
  styleUrls: ['./doctor-profile.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, LogoLoadingComponent, LocalizedNumberPipe, TranslatePipe, DoctorAvatarComponent, DoctorMedicalCodeComponent],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorProfileComponent implements OnInit, OnDestroy {
  readonly doctorDisplay = inject(DoctorDisplayService);

  doctor: DoctorDto | null = null;
  isLoading = true;
  loadError = false;
  selectedTab: 'about' | 'reviews' | 'schedule' = 'about';
  private currentDoctorId = '';

  availableSlots = [
    { time: '09:00 AM', available: true },
    { time: '10:30 AM', available: true },
    { time: '02:00 PM', available: false },
    { time: '03:30 PM', available: true },
    { time: '04:00 PM', available: true },
  ];

  reviews = [
    {
      id: '1',
      patientName: 'Sarah M.',
      rating: 5,
      comment:
        'Dr. Johnson was incredibly thorough and made me feel comfortable throughout my entire pregnancy journey.',
      date: '2024-01-15',
      verified: true,
    },
    {
      id: '2',
      patientName: 'Maria L.',
      rating: 5,
      comment: 'Excellent care and very knowledgeable. Highly recommend for high-risk pregnancies.',
      date: '2024-01-10',
      verified: true,
    },
  ];

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly doctorService = inject(DoctorService);
  private readonly toastController = inject(ToastController);
  private readonly translation = inject(TranslationService);
  private readonly doctorBooking = inject(DoctorBookingService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private routeParamsSub?: Subscription;
  private langChangeSub?: Subscription;

  get loadingMessage(): string {
    return this.translation.translate('doctorProfile.loading');
  }

  ngOnInit() {
    this.langChangeSub = this.languageService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });

    this.routeParamsSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id')?.trim();
      if (!id) {
        this.isLoading = false;
        this.loadError = true;
        this.doctor = null;
        this.cdr.markForCheck();
        return;
      }
      this.currentDoctorId = id;
      this.loadDoctorProfile(id);
    });
  }

  ngOnDestroy(): void {
    this.routeParamsSub?.unsubscribe();
    this.langChangeSub?.unsubscribe();
  }

  loadDoctorProfile(id: string) {
    this.isLoading = true;
    this.loadError = false;
    this.doctor = null;
    this.cdr.markForCheck();

    this.doctorService.getDoctorById(id).subscribe({
      next: (d) => {
        this.doctor = d;
        this.isLoading = false;
        this.loadError = false;
        this.cdr.markForCheck();
      },
      error: async () => {
        this.isLoading = false;
        this.loadError = true;
        this.doctor = null;
        this.cdr.markForCheck();
        const toast = await this.toastController.create({
          message: this.translation.translate('doctorProfile.toast.notFound'),
          duration: 2500,
          color: 'warning',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  retryLoad() {
    if (this.currentDoctorId) {
      this.loadDoctorProfile(this.currentDoctorId);
    }
  }

  selectTab(tab: 'about' | 'reviews' | 'schedule') {
    this.selectedTab = tab;
    this.cdr.markForCheck();
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getConsultationTypeLabel(type: ConsultationType): string {
    return this.doctorDisplay.getConsultationTypeLabel(type);
  }

  getConsultationIcon(type: ConsultationType): string {
    switch (type) {
      case ConsultationType.ONLINE:
        return 'videocam';
      case ConsultationType.IN_PERSON:
        return 'business';
      case ConsultationType.BOTH:
        return 'globe';
      default:
        return 'medical';
    }
  }

  getReviewsSummaryLabel(): string {
    return this.translation.translateParams('doctorProfile.reviewsBasedOn', {
      count: String(this.reviews?.length || 0),
    });
  }

  getExperienceLabel(years: number): string {
    return this.doctorDisplay.getExperienceLabel(years);
  }

  async bookAppointment(slot?: { time: string; available: boolean }) {
    if (!this.doctor) {
      return;
    }
    if (slot && !slot.available) {
      return;
    }
    await this.doctorBooking.openBooking(this.doctor);
  }

  shareDoctorProfile() {
    if (!this.doctor) {
      return;
    }
    const shareText = `${this.doctor.fullName}\n\n${this.doctorDisplay.getAboutText(this.doctor)}\n\n${window.location.href}`;
    if (navigator.share) {
      navigator
        .share({
          title: this.doctor.fullName,
          text: this.doctorDisplay.getAboutText(this.doctor),
          url: window.location.href,
        })
        .catch(() => this.copyToClipboard(shareText));
    } else {
      this.copyToClipboard(shareText);
    }
  }

  private copyToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
    }
  }

  contactDoctor(method: 'phone' | 'email') {
    if (!this.doctor) {
      return;
    }
    if (method === 'phone' && this.doctor.contactPhone) {
      window.open(`tel:${this.doctor.contactPhone}`, '_self');
    } else if (method === 'email' && this.doctor.contactEmail) {
      window.open(`mailto:${this.doctor.contactEmail}`, '_self');
    }
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/tabs/consultation']);
  }
}
