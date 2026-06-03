import { inject, Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { DoctorDto } from '../models/doctor.dto';
import { DoctorBookingResult } from '../models/doctor-booking.model';
import { DoctorBookingModalComponent } from '../components/doctor-booking-modal/doctor-booking-modal.component';
import { PaymentCheckoutService } from '../../payment/services/payment-checkout.service';

@Injectable({
  providedIn: 'root',
})
export class DoctorBookingService {
  private readonly modalController = inject(ModalController);
  private readonly paymentCheckout = inject(PaymentCheckoutService);

  async openBooking(
    doctor: DoctorDto,
    options: { preselectedTimeSlotId?: string } = {},
  ): Promise<void> {
    if (!doctor) {
      return;
    }

    const modal = await this.modalController.create({
      component: DoctorBookingModalComponent,
      componentProps: {
        doctor,
        preselectedTimeSlotId: options.preselectedTimeSlotId ?? null,
      },
      cssClass: 'doctor-booking-sheet',
      breakpoints: [0, 0.55, 0.92],
      initialBreakpoint: 0.92,
      handle: true,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss<DoctorBookingResult>();
    if (role !== 'confirm' || !data) {
      return;
    }

    await this.paymentCheckout.startConsultationCheckout(doctor, data);
  }
}
