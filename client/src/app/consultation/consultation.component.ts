import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { DoctorService } from '../shared/services/doctor.service';
import { DoctorDto, ConsultationType } from '../shared/models/doctor.dto';
import { TranslationService } from '../shared/services/translation.service';
import { LanguageService } from '../shared/services/language.service';
import { addIcons } from 'ionicons';
import { star } from 'ionicons/icons';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss'],
  standalone: true,
  imports:[...SHARED_STANDALONE_IMPORTS],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class ConsultationComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly doctorService = inject(DoctorService);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private langChangeSub?: Subscription;

  doctors: DoctorDto[] = [];
  isLoading = false;
  searchTerm = '';

  constructor() {
    addIcons({ star });
  }

  ngOnInit() {
    this.langChangeSub = this.languageService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
    this.loadDoctors();
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }

  experienceLabel(years: number): string {
    return this.tParams('consultation.yearsExperience', { years });
  }

  /** Pull-to-refresh on Consultation tab (layout). */
  async runPullToRefresh(): Promise<void> {
    await this.loadDoctors();
  }

  async onTabPullRefresh(event: Event): Promise<void> {
    const target = event.target as HTMLIonRefresherElement;
    try {
      await this.runPullToRefresh();
    } catch {
      /* non-fatal */
    } finally {
      target.complete();
    }
  }

  /** First page of doctors from API for the consultation tab preview. */
  async loadDoctors() {
    this.isLoading = true;
    this.doctorService.getDoctorsPage({ page: 1, limit: 8 }).subscribe({
      next: (res) => {
        this.doctors = res.items;
        this.isLoading = false;
      },
      error: async () => {
        this.doctors = [];
        this.isLoading = false;
        const toast = await this.toastController.create({
          message: this.t('consultation.toast.loadDoctorsFailed'),
          duration: 3000,
          color: 'warning',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  // Navigate to doctors page
  showAllDoctors() {
    this.router.navigate(['/doctors']);
  }


  // Search doctors
  searchDoctors(event: any) {
    const query = event.target.value;
    this.searchTerm = query;
    
    if (query && query.length > 2) {
      this.doctorService.searchDoctors(query).subscribe({
        next: (doctors) => {
          this.doctors = doctors;
        }
      });
    } else {
      this.loadDoctors();
    }
  }

  // Book appointment with specific doctor
  async bookWithDoctor(doctor: DoctorDto) {
    const alert = await this.alertController.create({
      header: this.tParams('consultation.alert.bookWith.header', {
        name: doctor.fullName,
      }),
      message: this.tParams('consultation.alert.bookWith.message', {
        specialty: doctor.specialty,
        about: `${doctor.about.substring(0, 100)}...`,
        fee: doctor.fee
          ? String(doctor.fee)
          : this.t('consultation.fee.contactForPricing'),
      }),
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.bookAppointment'),
          handler: () => {
            this.showBookingOptions(doctor);
          },
        },
        {
          text: this.t('consultation.alert.viewProfile'),
          handler: () => {
            this.viewDoctorProfile(doctor);
          },
        },
      ],
    });

    await alert.present();
  }

  // Show booking options for doctor
  async showBookingOptions(doctor: DoctorDto) {
    const buttons: any[] = [];
    
    if (doctor.consultationType === ConsultationType.ONLINE || doctor.consultationType === ConsultationType.BOTH) {
      buttons.push({
        text: this.t('consultation.alert.onlineConsultation'),
        handler: () => {
          this.bookAppointment(doctor, 'online');
        },
      });
    }
    
    if (doctor.consultationType === ConsultationType.IN_PERSON || doctor.consultationType === ConsultationType.BOTH) {
      buttons.push({
        text: this.t('consultation.alert.inPersonVisit'),
        handler: () => {
          this.bookAppointment(doctor, 'in-person');
        },
      });
    }
    
    buttons.push({
      text: this.t('common.cancel'),
      role: 'cancel',
    });

    const alert = await this.alertController.create({
      header: this.t('consultation.alert.chooseType.header'),
      message: this.tParams('consultation.alert.chooseType.message', {
        name: doctor.fullName,
      }),
      buttons: buttons,
    });

    await alert.present();
  }

  // Book appointment
  async bookAppointment(doctor: DoctorDto, type: string) {
    const typeLabel =
      type === 'online'
        ? this.t('consultation.alert.type.online')
        : this.t('consultation.alert.type.inPerson');
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.selectTime.header'),
      message: this.tParams('consultation.alert.selectTime.message', {
        type: typeLabel,
        name: doctor.fullName,
      }),
      inputs: this.timeSlotInputs(),
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.confirmBooking'),
          handler: (data) => {
            this.confirmBooking(doctor, type, data.timeSlot);
          },
        },
      ],
    });

    await alert.present();
  }

  // Confirm booking
  async confirmBooking(doctor: DoctorDto, type: string, timeSlot: string) {
    const typeText =
      type === 'online'
        ? this.t('consultation.alert.bookingConfirmed.typeOnline')
        : this.t('consultation.alert.bookingConfirmed.typeInPerson');
    const fee = doctor.fee
      ? `$${doctor.fee}`
      : this.t('consultation.fee.contactForPricing');
    const locationBlock = doctor.location
      ? `<p><strong>${this.t('consultation.alert.bookingConfirmed.location')}</strong> ${doctor.location}</p>`
      : '';

    const alert = await this.alertController.create({
      header: this.t('consultation.alert.bookingConfirmed.header'),
      message: `
        <div style="text-align: left;">
          <p><strong>${this.t('consultation.alert.bookingConfirmed.doctor')}</strong> ${doctor.fullName}</p>
          <p><strong>${this.t('consultation.alert.bookingConfirmed.specialty')}</strong> ${doctor.specialty}</p>
          <p><strong>${this.t('consultation.alert.bookingConfirmed.type')}</strong> ${typeText}</p>
          <p><strong>${this.t('consultation.alert.bookingConfirmed.time')}</strong> ${this.timeSlotLabel(timeSlot)}</p>
          <p><strong>${this.t('consultation.alert.bookingConfirmed.fee')}</strong> ${fee}</p>
          ${locationBlock}
        </div>
      `,
      buttons: [
        {
          text: this.t('consultation.alert.addToCalendar'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.addedToCalendar'), 'success');
          },
        },
        {
          text: this.t('consultation.alert.done'),
          role: 'cancel',
        },
      ],
    });

    await alert.present();
    await this.showToast(
      this.tParams('consultation.toast.appointmentBooked', { name: doctor.fullName }),
      'success',
    );
  }

  // View doctor profile
  async viewDoctorProfile(doctor: DoctorDto) {
    this.router.navigate(['/doctor', doctor.id]);
    // const alert = await this.alertController.create({
    //   header: doctor.fullName,
    //   message: `
    //     <div style="text-align: left;">
    //       <p><strong>Specialty:</strong> ${doctor.specialty}</p>
    //       <p><strong>Experience:</strong> ${doctor.experienceYears} years</p>
    //       ${doctor.rating ? `<p><strong>Rating:</strong> ${doctor.rating}/5 ⭐</p>` : ''}
    //       ${doctor.clinicName ? `<p><strong>Clinic:</strong> ${doctor.clinicName}</p>` : ''}
    //       ${doctor.location ? `<p><strong>Location:</strong> ${doctor.location}</p>` : ''}
    //       <p><strong>About:</strong></p>
    //       <p style="font-style: italic;">${doctor.about}</p>
    //       <p><strong>Consultation Fee:</strong> $${doctor.fee || 'Contact for pricing'}</p>
    //       <p><strong>Available:</strong> ${this.getConsultationTypeLabel(doctor.consultationType)}</p>
    //     </div>
    //   `,
    //   buttons: [
    //     {
    //       text: 'Book Appointment',
    //       handler: () => {
    //         this.bookWithDoctor(doctor);
    //       }
    //     },
    //     {
    //       text: 'Contact',
    //       handler: () => {
    //         this.contactDoctor(doctor);
    //       }
    //     },
    //     {
    //       text: 'Close',
    //       role: 'cancel'
    //     }
    //   ]
    // });

    // await alert.present();
  }

  // Contact doctor
  async contactDoctor(doctor: DoctorDto) {
    const buttons: any[] = [];
    
    if (doctor.contactEmail) {
      buttons.push({
        text: this.t('consultation.alert.email'),
        handler: () => {
          window.open(`mailto:${doctor.contactEmail}`, '_blank');
        },
      });
    }
    
    if (doctor.contactPhone) {
      buttons.push({
        text: this.t('consultation.alert.phone'),
        handler: () => {
          window.open(`tel:${doctor.contactPhone}`, '_blank');
        },
      });
    }
    
    buttons.push({
      text: this.t('common.cancel'),
      role: 'cancel',
    });

    const alert = await this.alertController.create({
      header: this.tParams('consultation.alert.contact.header', {
        name: doctor.fullName,
      }),
      message: this.t('consultation.alert.contact.message'),
      buttons: buttons,
    });

    await alert.present();
  }

  // Get consultation type label
  getConsultationTypeLabel(type: ConsultationType): string {
    switch (type) {
      case ConsultationType.ONLINE:
        return this.t('consultation.type.onlineOnly');
      case ConsultationType.IN_PERSON:
        return this.t('consultation.type.inPersonOnly');
      case ConsultationType.BOTH:
        return this.t('consultation.type.both');
      default:
        return this.t('consultation.type.contactForDetails');
    }
  }

  // Quick Booking Methods
  async bookDoctorAppointment() {
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.bookDoctor.header'),
      message: this.t('consultation.alert.bookDoctor.message'),
      inputs: [
        {
          name: 'appointmentType',
          type: 'radio',
          label: this.t('consultation.appointmentType.prenatal'),
          value: 'prenatal',
          checked: true,
        },
        {
          name: 'appointmentType',
          type: 'radio',
          label: this.t('consultation.appointmentType.ultrasound'),
          value: 'ultrasound',
        },
        {
          name: 'appointmentType',
          type: 'radio',
          label: this.t('consultation.appointmentType.emergency'),
          value: 'emergency',
        },
      ],
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.continue'),
          handler: (data) => {
            this.showBookingConfirmation(
              this.t('consultation.booking.doctorAppointment'),
              data.appointmentType,
            );
          },
        },
      ],
    });

    await alert.present();
  }

  async bookNutritionConsultation() {
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.nutrition.header'),
      message: this.t('consultation.alert.nutrition.message'),
      inputs: [
        {
          name: 'nutritionFocus',
          type: 'radio',
          label: this.t('consultation.nutrition.pregnancyDiet'),
          value: 'pregnancy_diet',
          checked: true,
        },
        {
          name: 'nutritionFocus',
          type: 'radio',
          label: this.t('consultation.nutrition.supplements'),
          value: 'supplements',
        },
        {
          name: 'nutritionFocus',
          type: 'radio',
          label: this.t('consultation.nutrition.weightManagement'),
          value: 'weight_management',
        },
      ],
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.bookNow'),
          handler: (data) => {
            this.showBookingConfirmation(
              this.t('consultation.booking.nutritionConsultation'),
              data.nutritionFocus,
            );
          },
        },
      ],
    });

    await alert.present();
  }

  async bookFitnessConsultation() {
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.fitness.header'),
      message: this.t('consultation.alert.fitness.message'),
      inputs: [
        {
          name: 'fitnessFocus',
          type: 'radio',
          label: this.t('consultation.fitness.prenatalYoga'),
          value: 'prenatal_yoga',
          checked: true,
        },
        {
          name: 'fitnessFocus',
          type: 'radio',
          label: this.t('consultation.fitness.safeExercises'),
          value: 'safe_exercises',
        },
        {
          name: 'fitnessFocus',
          type: 'radio',
          label: this.t('consultation.fitness.postpartum'),
          value: 'postpartum',
        },
      ],
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.bookNow'),
          handler: (data) => {
            this.showBookingConfirmation(
              this.t('consultation.booking.fitnessConsultation'),
              data.fitnessFocus,
            );
          },
        },
      ],
    });

    await alert.present();
  }

  async bookMentalHealthSupport() {
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.mentalHealth.header'),
      message: this.t('consultation.alert.mentalHealth.message'),
      inputs: [
        {
          name: 'mentalHealthType',
          type: 'radio',
          label: this.t('consultation.mentalHealth.anxiety'),
          value: 'anxiety',
          checked: true,
        },
        {
          name: 'mentalHealthType',
          type: 'radio',
          label: this.t('consultation.mentalHealth.depression'),
          value: 'depression',
        },
        {
          name: 'mentalHealthType',
          type: 'radio',
          label: this.t('consultation.mentalHealth.stress'),
          value: 'stress',
        },
      ],
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.bookNow'),
          handler: (data) => {
            this.showBookingConfirmation(
              this.t('consultation.booking.mentalHealthSupport'),
              data.mentalHealthType,
            );
          },
        },
      ],
    });

    await alert.present();
  }

  // Specialist Booking
  async bookSpecialist(specialistId: string) {
    const specialists = {
      'sarah': { name: 'Dr. Sarah Johnson', specialty: 'Obstetrician & Gynecologist' },
      'michael': { name: 'Dr. Michael Chen', specialty: 'Pregnancy Nutritionist' },
      'emily': { name: 'Dr. Emily Rodriguez', specialty: 'Prenatal Fitness Expert' },
      'david': { name: 'Dr. David Wilson', specialty: 'Mental Health Specialist' }
    };

    const specialist = specialists[specialistId as keyof typeof specialists];
    
    const alert = await this.alertController.create({
      header: this.tParams('consultation.alert.bookSpecialist.header', {
        name: specialist.name,
      }),
      message: this.tParams('consultation.alert.bookSpecialist.message', {
        specialty: specialist.specialty,
      }),
      inputs: this.timeSlotInputs().slice(0, 3).map((input) => ({
        ...input,
        name: 'appointmentTime',
      })),
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.confirmBooking'),
          handler: (data) => {
            this.showBookingConfirmation(specialist.name, data.appointmentTime);
          },
        },
      ],
    });

    await alert.present();
  }

  // Consultation Type Selection
  async selectConsultationType(type: string) {
    const types = {
      prenatal: {
        nameKey: 'consultation.typeSelection.prenatal',
        price: '$150',
        duration: '30-45 min',
      },
      nutrition: {
        nameKey: 'consultation.typeSelection.nutrition',
        price: '$120',
        duration: '45-60 min',
      },
      fitness: {
        nameKey: 'consultation.typeSelection.fitness',
        price: '$100',
        duration: '30-40 min',
      },
      mental: {
        nameKey: 'consultation.typeSelection.mental',
        price: '$180',
        duration: '50-60 min',
      },
    };

    const consultationType = types[type as keyof typeof types];
    
    const alert = await this.alertController.create({
      header: this.t(consultationType.nameKey),
      message: this.tParams('consultation.alert.typeSelection.message', {
        duration: consultationType.duration,
        price: consultationType.price,
      }),
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.bookNow'),
          handler: () => {
            this.showBookingConfirmation(this.t(consultationType.nameKey), 'standard');
          },
        },
      ],
    });

    await alert.present();
  }

  // Appointment Management
  async viewAppointment(appointmentId: string) {
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.appointmentDetails.header'),
      message: this.t('consultation.alert.appointmentDetails.message'),
      buttons: [
        {
          text: this.t('consultation.alert.viewDetails'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.openingAppointment'), 'success');
          },
        },
        {
          text: this.t('consultation.alert.cancelAppointment'),
          handler: () => {
            this.cancelAppointment(appointmentId);
          },
        },
        {
          text: this.t('consultation.alert.close'),
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  async rescheduleAppointment(appointmentId: string) {
    void appointmentId;
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.reschedule.header'),
      message: this.t('consultation.alert.reschedule.message'),
      inputs: [
        {
          name: 'newTime',
          type: 'radio',
          label: this.t('consultation.time.tomorrow9am'),
          value: 'tomorrow_9am',
          checked: true,
        },
        {
          name: 'newTime',
          type: 'radio',
          label: this.t('consultation.time.tomorrow2pm'),
          value: 'tomorrow_2pm',
        },
        {
          name: 'newTime',
          type: 'radio',
          label: this.t('consultation.time.friday10am'),
          value: 'friday_10am',
        },
      ],
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.reschedule'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.rescheduled'), 'success');
          },
        },
      ],
    });

    await alert.present();
  }

  async cancelAppointment(appointmentId: string) {
    void appointmentId;
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.cancel.header'),
      message: this.t('consultation.alert.cancel.message'),
      buttons: [
        {
          text: this.t('consultation.alert.keepAppointment'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.yesCancel'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.cancelled'), 'success');
          },
        },
      ],
    });

    await alert.present();
  }

  // Emergency Contact
  async callEmergency() {
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.emergency.header'),
      message: this.t('consultation.alert.emergency.message'),
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.t('consultation.alert.callEmergency'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.callingEmergency'), 'warning');
          },
        },
      ],
    });

    await alert.present();
  }

  // Quick Menu
  async openQuickMenu() {
    const actionSheet = await this.alertController.create({
      header: this.t('consultation.alert.quickActions.header'),
      buttons: [
        {
          text: this.t('consultation.alert.quickActions.bookNew'),
          handler: () => {
            this.bookDoctorAppointment();
          },
        },
        {
          text: this.t('consultation.alert.quickActions.calendar'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.openingCalendar'), 'success');
          },
        },
        {
          text: this.t('consultation.alert.quickActions.support'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.openingSupport'), 'success');
          },
        },
        {
          text: this.t('common.cancel'),
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }

  // Notifications
  async openNotifications() {
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.notifications.header'),
      message: this.t('consultation.alert.notifications.message'),
      buttons: [
        {
          text: this.t('consultation.alert.viewAll'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.openingNotifications'), 'success');
          },
        },
        {
          text: this.t('consultation.alert.close'),
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  // Utility Methods
  async showBookingConfirmation(type: string, details: string) {
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.bookingConfirmedSimple.header'),
      message: this.tParams('consultation.alert.bookingConfirmedSimple.message', {
        type,
        details,
      }),
      buttons: [
        {
          text: this.t('consultation.alert.viewAppointment'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.openingAppointment'), 'success');
          },
        },
        {
          text: this.t('consultation.alert.done'),
          role: 'cancel',
        },
      ],
    });

    await alert.present();
    await this.showToast(this.t('consultation.toast.bookedSuccessfully'), 'success');
  }

  private timeSlotInputs(): {
    name: string;
    type: 'radio';
    label: string;
    value: string;
    checked?: boolean;
  }[] {
    return [
      {
        name: 'timeSlot',
        type: 'radio',
        label: this.t('consultation.time.today2pm'),
        value: 'today_2pm',
        checked: true,
      },
      {
        name: 'timeSlot',
        type: 'radio',
        label: this.t('consultation.time.today430pm'),
        value: 'today_430pm',
      },
      {
        name: 'timeSlot',
        type: 'radio',
        label: this.t('consultation.time.tomorrow10am'),
        value: 'tomorrow_10am',
      },
      {
        name: 'timeSlot',
        type: 'radio',
        label: this.t('consultation.time.tomorrow2pm'),
        value: 'tomorrow_2pm',
      },
    ];
  }

  private timeSlotLabel(slot: string): string {
    const keys: Record<string, string> = {
      today_2pm: 'consultation.time.todayAt2pm',
      today_430pm: 'consultation.time.todayAt430pm',
      tomorrow_10am: 'consultation.time.tomorrowAt10am',
      tomorrow_2pm: 'consultation.time.tomorrowAt2pm',
    };
    return this.t(keys[slot] ?? 'consultation.time.todayAt2pm');
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private tParams(
    key: string,
    params: Record<string, string | number>,
  ): string {
    return this.translation.translateParams(key, params);
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
