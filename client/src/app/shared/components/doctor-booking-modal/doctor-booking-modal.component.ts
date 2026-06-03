import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../auth/services/auth';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';
import { DoctorDto, ConsultationType } from '../../models/doctor.dto';
import {
  DoctorBookingResult,
  DoctorBookingTimeSlot,
  DoctorBookingType,
} from '../../models/doctor-booking.model';
import { DoctorBookingCalendarComponent } from '../doctor-booking-calendar/doctor-booking-calendar.component';
import { DoctorAvatarComponent } from '../doctor-avatar/doctor-avatar.component';
import { DoctorMedicalCodeComponent } from '../doctor-medical-code/doctor-medical-code.component';
import { DoctorAppointmentService } from '../../services/doctor-appointment.service';
import { DoctorDisplayService } from '../../services/doctor-display.service';
import { TranslationService } from '../../services/translation.service';
import { LanguageService } from '../../services/language.service';
import { formatBookingDateTimeLabel, bookingIsoDateKey, slotBookingDateKey } from '../../utils/doctor-booking-format.util';
import { firstBookableDateIso } from '../../utils/doctor-booking-schedule.util';

@Component({
  selector: 'app-doctor-booking-modal',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, DoctorBookingCalendarComponent, DoctorAvatarComponent, DoctorMedicalCodeComponent],
  templateUrl: './doctor-booking-modal.component.html',
  styleUrls: ['./doctor-booking-modal.component.scss'],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorBookingModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) doctor!: DoctorDto;
  @Input() preselectedTimeSlotId: string | null = null;

  readonly doctorDisplay = inject(DoctorDisplayService);

  selectedType: DoctorBookingType | null = null;
  selectedTimeSlotId: string | null = null;
  selectedDateIso: string | null = null;
  timeSlots: DoctorBookingTimeSlot[] = [];
  slotsLoading = true;
  slotsError = false;
  saving = false;

  private readonly modalController = inject(ModalController);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly appointments = inject(DoctorAppointmentService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());
    this.initializeDefaults();
    void this.loadSchedule();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canSave(): boolean {
    return !!this.selectedType && !!this.selectedTimeSlotId;
  }

  get saveHint(): string {
    if (!this.selectedType && this.showOnlineOption && this.showInPersonOption) {
      return this.t('consultation.bookingModal.typeRequired');
    }
    if (!this.selectedTimeSlotId) {
      return this.t('consultation.bookingModal.pickTimeFirst');
    }
    return '';
  }

  get selectedSlot(): DoctorBookingTimeSlot | undefined {
    return this.timeSlots.find((slot) => slot.id === this.selectedTimeSlotId);
  }

  get showOnlineOption(): boolean {
    const t = this.doctor?.consultationType;
    return t === ConsultationType.ONLINE || t === ConsultationType.BOTH;
  }

  get showInPersonOption(): boolean {
    const t = this.doctor?.consultationType;
    return t === ConsultationType.IN_PERSON || t === ConsultationType.BOTH;
  }

  get feeLabel(): string {
    if (this.doctor?.fee != null) {
      return this.doctorDisplay.formatFee(this.doctor.fee);
    }
    return this.t('consultation.fee.contactForPricing');
  }

  get selectedTypeLabel(): string {
    if (this.selectedType === 'online') {
      return this.t('consultation.type.onlineOnly');
    }
    if (this.selectedType === 'in-person') {
      return this.t('consultation.type.inPersonOnly');
    }
    return '';
  }

  get selectedTimeLabel(): string {
    const slot = this.selectedSlot;
    if (!slot?.scheduledAt) {
      return '';
    }
    return formatBookingDateTimeLabel(
      slot.scheduledAt,
      this.languageService.getCurrentLanguage(),
    );
  }

  t(key: string): string {
    return this.translation.translate(key);
  }

  selectType(type: DoctorBookingType): void {
    this.selectedType = type;
    this.cdr.markForCheck();
  }

  onDateSelected(isoDate: string): void {
    this.selectedDateIso = isoDate;
    this.selectedTimeSlotId = null;
    this.cdr.markForCheck();
  }

  selectTimeSlot(slot: DoctorBookingTimeSlot): void {
    if (!slot.available || this.slotsLoading) {
      return;
    }
    this.selectedTimeSlotId = slot.id;
    const dateKey = slotBookingDateKey(slot);
    this.selectedDateIso = dateKey ?? bookingIsoDateKey(slot.scheduledAt);
    this.cdr.markForCheck();
  }

  dismiss(): void {
    void this.modalController.dismiss(undefined, 'cancel');
  }

  async saveBooking(): Promise<void> {
    if (this.saving || this.slotsLoading) {
      return;
    }

    if (!this.selectedType && this.showOnlineOption && this.showInPersonOption) {
      await this.showToast(this.t('consultation.bookingModal.typeRequired'));
      return;
    }

    if (!this.selectedTimeSlotId) {
      await this.showToast(this.t('consultation.bookingModal.pickTimeFirst'));
      return;
    }

    if (!this.canSave || !this.selectedType || !this.selectedTimeSlotId) {
      return;
    }

    if (!this.auth.isAuthenticated()) {
      await this.showToast(this.t('consultation.bookingModal.loginRequired'));
      void this.modalController.dismiss(undefined, 'cancel');
      await this.router.navigate(['/login']);
      return;
    }

    const slot = this.selectedSlot;
    if (!slot?.available) {
      await this.showToast(this.t('consultation.bookingModal.slotUnavailable'));
      void this.loadSchedule();
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    try {
      const appointment = await firstValueFrom(
        this.appointments.createAppointment({
          doctorId: this.doctor.id!,
          slotKey: this.selectedTimeSlotId,
          consultationType: this.selectedType,
        }),
      );

      const result: DoctorBookingResult = {
        type: this.selectedType,
        timeSlotId: this.selectedTimeSlotId,
        timeLabel: this.selectedTimeLabel,
        appointmentId: appointment.id,
        scheduledAt: appointment.scheduledAt,
      };

      void this.modalController.dismiss(result, 'confirm');
    } catch {
      await this.showToast(this.t('consultation.bookingModal.saveError'));
      void this.loadSchedule();
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  private async loadSchedule(): Promise<void> {
    if (!this.doctor?.id) {
      this.slotsLoading = false;
      this.slotsError = true;
      this.cdr.markForCheck();
      return;
    }

    this.slotsLoading = true;
    this.slotsError = false;
    this.cdr.markForCheck();

    try {
      const schedule = await firstValueFrom(
        this.appointments.getDoctorSchedule(this.doctor.id),
      );
      this.timeSlots = schedule.slots.map((slot) => ({
        id: slot.id,
        available: slot.available,
        scheduledAt: slot.scheduledAt,
      }));
      this.applySlotSelection();
    } catch {
      this.slotsError = true;
      this.timeSlots = [];
      this.applySlotSelection();
    } finally {
      this.slotsLoading = false;
      this.cdr.markForCheck();
    }
  }

  private applySlotSelection(): void {
    const preferred = this.preselectedTimeSlotId
      ? this.timeSlots.find(
          (slot) => slot.id === this.preselectedTimeSlotId && slot.available,
        )
      : undefined;

    if (
      this.selectedTimeSlotId &&
      !this.timeSlots.some(
        (slot) => slot.id === this.selectedTimeSlotId && slot.available,
      )
    ) {
      this.selectedTimeSlotId = null;
    }

    if (preferred) {
      this.selectedTimeSlotId = preferred.id;
      const dateKey = slotBookingDateKey(preferred);
      this.selectedDateIso = dateKey ?? bookingIsoDateKey(preferred.scheduledAt);
      return;
    }

    if (this.selectedTimeSlotId) {
      const current = this.timeSlots.find((slot) => slot.id === this.selectedTimeSlotId);
      if (current) {
        const dateKey = slotBookingDateKey(current);
        if (dateKey) {
          this.selectedDateIso = dateKey;
          return;
        }
      }
    }

    this.selectedDateIso = firstBookableDateIso(this.timeSlots);
  }

  private initializeDefaults(): void {
    if (this.showOnlineOption && !this.showInPersonOption) {
      this.selectedType = 'online';
    } else if (this.showInPersonOption && !this.showOnlineOption) {
      this.selectedType = 'in-person';
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2800,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }
}
