import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DoctorDto } from '../../shared/models/doctor.dto';
import { DoctorBookingResult } from '../../shared/models/doctor-booking.model';
import { doctorFeeToTomans, USD_TO_TOMAN } from '../../shared/utils/locale-date-format.util';
import { ShopCartService } from '../../shop/services/shop-cart.service';
import { DoctorDisplayService } from '../../shared/services/doctor-display.service';
import {
  ConsultationPaymentMeta,
  PaymentOrder,
  PaymentResult,
} from '../models/payment.models';

const ORDER_STORAGE_KEY = 'noura_payment_order';
const RESULT_STORAGE_KEY = 'noura_payment_result';

@Injectable({ providedIn: 'root' })
export class PaymentCheckoutService {
  private readonly router = inject(Router);
  private readonly cart = inject(ShopCartService);
  private readonly doctorDisplay = inject(DoctorDisplayService);

  getPendingOrder(): PaymentOrder | null {
    return this.readJson<PaymentOrder>(ORDER_STORAGE_KEY);
  }

  getLastResult(): PaymentResult | null {
    return this.readJson<PaymentResult>(RESULT_STORAGE_KEY);
  }

  clearPendingOrder(): void {
    sessionStorage.removeItem(ORDER_STORAGE_KEY);
  }

  clearLastResult(): void {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
  }

  async startShopCheckout(): Promise<boolean> {
    const lines = this.cart.getLineItems();
    if (!lines.length) {
      return false;
    }

    const items = lines.map(({ product, quantity }) => ({
      id: product.id,
      titleKey: product.titleKey,
      quantity,
      unitAmountTomans: Math.round(product.price * USD_TO_TOMAN),
      imageUrl: product.imageUrl,
    }));

    const subtotalTomans = items.reduce(
      (sum, item) => sum + item.unitAmountTomans * item.quantity,
      0,
    );

    const order = this.buildOrder('shop', items, subtotalTomans);
    this.saveOrder(order);
    await this.router.navigate(['/payment']);
    return true;
  }

  async startConsultationCheckout(
    doctor: DoctorDto,
    booking: DoctorBookingResult,
  ): Promise<boolean> {
    const feeTomans = doctor.fee != null ? doctorFeeToTomans(doctor.fee) : 350_000;
    const typeKey =
      booking.type === 'online'
        ? 'consultation.type.onlineOnly'
        : 'consultation.type.inPersonOnly';

    const consultation: ConsultationPaymentMeta = {
      doctorId: doctor.id ?? doctor.fullName,
      doctorName: doctor.fullName,
      specialtyLabel: this.doctorDisplay.getSpecialtyLabel(doctor.specialty),
      bookingType: booking.type,
      timeLabel: booking.timeLabel,
      avatarUrl: this.doctorDisplay.getAvatar(doctor),
      licenseNumber: doctor.licenseNumber?.trim() || undefined,
      appointmentId: booking.appointmentId,
    };

    const order = this.buildOrder(
      'consultation',
      [
        {
          id: `consultation-${consultation.doctorId}`,
          titleKey: 'payment.consultation.itemTitle',
          subtitleKey: typeKey,
          quantity: 1,
          unitAmountTomans: feeTomans,
          imageUrl: this.doctorDisplay.getAvatar(doctor),
        },
      ],
      feeTomans,
      consultation,
    );

    this.saveOrder(order);
    await this.router.navigate(['/payment']);
    return true;
  }

  saveResult(result: PaymentResult): void {
    sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
  }

  completeShopOrder(): void {
    this.cart.clear();
    this.clearPendingOrder();
  }

  private buildOrder(
    source: PaymentOrder['source'],
    items: PaymentOrder['items'],
    subtotalTomans: number,
    consultation?: ConsultationPaymentMeta,
  ): PaymentOrder {
    const discountTomans =
      source === 'shop' && subtotalTomans >= 2_000_000
        ? Math.round(subtotalTomans * 0.05)
        : 0;

    return {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      source,
      items,
      subtotalTomans,
      discountTomans,
      payableTomans: Math.max(0, subtotalTomans - discountTomans),
      createdAt: new Date().toISOString(),
      consultation,
    };
  }

  private saveOrder(order: PaymentOrder): void {
    sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  }

  private readJson<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}
