import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  IranianPaymentMethodId,
  PaymentOrder,
  PaymentResult,
} from '../models/payment.models';
import { PaymentCheckoutService } from './payment-checkout.service';
import { DoctorAppointmentService } from '../../shared/services/doctor-appointment.service';

@Injectable({ providedIn: 'root' })
export class PaymentGatewayService {
  private readonly checkout = inject(PaymentCheckoutService);
  private readonly appointments = inject(DoctorAppointmentService);

  async processPayment(
    order: PaymentOrder,
    methodId: IranianPaymentMethodId,
  ): Promise<PaymentResult> {
    await this.simulateGatewayRedirect(methodId);

    const success = true;
    const referenceCode = success
      ? `${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 90 + 10)}`
      : undefined;

    const result: PaymentResult = {
      orderId: order.id,
      source: order.source,
      methodId,
      success,
      referenceCode,
      paidAt: new Date().toISOString(),
      consultation: order.consultation,
    };

    this.checkout.saveResult(result);

    if (success && order.source === 'shop') {
      this.checkout.completeShopOrder();
    } else if (success) {
      await this.confirmConsultationAppointment(order);
      this.checkout.clearPendingOrder();
    }

    return result;
  }

  private async confirmConsultationAppointment(order: PaymentOrder): Promise<void> {
    const appointmentId = order.consultation?.appointmentId;
    if (!appointmentId) {
      return;
    }

    try {
      await firstValueFrom(this.appointments.confirmAppointment(appointmentId));
    } catch {
      // Payment succeeded; confirmation can be retried server-side later.
    }
  }

  private simulateGatewayRedirect(methodId: IranianPaymentMethodId): Promise<void> {
    const delayMs = methodId === 'online_shaparak' ? 2200 : 1400;
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
