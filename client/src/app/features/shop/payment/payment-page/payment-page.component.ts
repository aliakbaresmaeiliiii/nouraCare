import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  cardOutline,
  chevronBack,
  chevronDownOutline,
  chevronUpOutline,
  layersOutline,
  lockClosedOutline,
  personOutline,
  shieldCheckmarkOutline,
  walletOutline,
} from 'ionicons/icons';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { formatTomanPrice } from '@app/shared/utils/locale-date-format.util';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { DoctorMedicalCodeComponent } from '@app/shared/ui/doctor-medical-code/doctor-medical-code.component';
import { IRANIAN_PAYMENT_METHODS } from '@app/features/shop/payment/data/payment-methods.data';
import {
  IranianPaymentMethodId,
  PaymentLineItem,
  PaymentOrder,
} from '@app/features/shop/payment/models/payment.models';
import { PaymentCheckoutService } from '@app/features/shop/payment/services/payment-checkout.service';
import { PaymentGatewayService } from '@app/features/shop/payment/services/payment-gateway.service';

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, DoctorMedicalCodeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly checkout = inject(PaymentCheckoutService);
  private readonly gateway = inject(PaymentGatewayService);
  private readonly translation = inject(TranslationService);
  private readonly language = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly methods = IRANIAN_PAYMENT_METHODS;
  order: PaymentOrder | null = null;
  selectedMethod: IranianPaymentMethodId = 'online_shaparak';
  summaryExpanded = false;
  isProcessing = false;

  private readonly walletBalanceTomans = 1_250_000;

  ngOnInit(): void {
    addIcons({
      chevronBack,
      cardOutline,
      walletOutline,
      calendarOutline,
      layersOutline,
      lockClosedOutline,
      shieldCheckmarkOutline,
      chevronDownOutline,
      chevronUpOutline,
      personOutline,
    });

    this.order = this.checkout.getPendingOrder();

    this.language.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  get hasOrder(): boolean {
    return !!this.order;
  }

  get itemCountLabel(): string {
    if (!this.order) {
      return '';
    }
    const count = this.order.items.reduce((sum, item) => sum + item.quantity, 0);
    if (count === 1) {
      return this.t('payment.oneItem');
    }
    return this.tParams('payment.itemsCount', { count });
  }

  goBack(): void {
    if (this.order?.source === 'shop') {
      void this.router.navigate(['/shop/cart']);
      return;
    }
    void this.router.navigate(['/tabs/consultation']);
  }

  goToEmptyFallback(): void {
    void this.router.navigate(['/shop']);
  }

  toggleSummary(): void {
    this.summaryExpanded = !this.summaryExpanded;
    this.cdr.markForCheck();
  }

  selectMethod(methodId: IranianPaymentMethodId): void {
    this.selectedMethod = methodId;
    this.cdr.markForCheck();
  }

  methodSubtitle(methodId: IranianPaymentMethodId): string {
    if (methodId === 'wallet') {
      return this.tParams('payment.walletBalance', {
        amount: this.formatAmount(this.walletBalanceTomans),
      });
    }
    const method = this.methods.find((m) => m.id === methodId);
    return method ? this.t(method.subtitleKey) : '';
  }

  lineTitle(item: PaymentLineItem): string {
    return this.t(item.titleKey);
  }

  lineSubtitle(item: PaymentLineItem): string | null {
    if (!item.subtitleKey) {
      return null;
    }
    return this.t(item.subtitleKey);
  }

  lineTotal(item: PaymentLineItem): string {
    return this.formatAmount(item.unitAmountTomans * item.quantity);
  }

  formatAmount(tomans: number): string {
    return formatTomanPrice(tomans, this.language.getCurrentLanguage());
  }

  async pay(): Promise<void> {
    if (!this.order || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.cdr.markForCheck();

    try {
      const result = await this.gateway.processPayment(this.order, this.selectedMethod);
      await this.router.navigate(['/payment/result'], {
        queryParams: { status: result.success ? 'success' : 'failed' },
      });
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  t(key: string): string {
    return this.translation.translate(key);
  }

  tParams(key: string, params: Record<string, string | number>): string {
    return this.translation.translateParams(key, params);
  }
}
