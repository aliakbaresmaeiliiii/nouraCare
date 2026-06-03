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
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  homeOutline,
  medicalOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { LanguageService } from '../../shared/services/language.service';
import { TranslationService } from '../../shared/services/translation.service';
import { formatTomanPrice } from '../../shared/utils/locale-date-format.util';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';
import { IRANIAN_PAYMENT_METHODS } from '../data/payment-methods.data';
import { PaymentResult } from '../models/payment.models';
import { PaymentCheckoutService } from '../services/payment-checkout.service';

@Component({
  selector: 'app-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentResultComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly checkout = inject(PaymentCheckoutService);
  private readonly translation = inject(TranslationService);
  private readonly language = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  result: PaymentResult | null = null;
  isSuccess = false;

  ngOnInit(): void {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      homeOutline,
      storefrontOutline,
      medicalOutline,
    });

    this.result = this.checkout.getLastResult();
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.isSuccess = params.get('status') === 'success' && !!this.result?.success;
        this.cdr.markForCheck();
      });

    this.language.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  get methodLabel(): string {
    if (!this.result) {
      return '';
    }
    const method = IRANIAN_PAYMENT_METHODS.find((m) => m.id === this.result!.methodId);
    return method ? this.t(method.titleKey) : '';
  }

  get consultationMessage(): string | null {
    if (!this.isSuccess || !this.result?.consultation) {
      return null;
    }
    return this.tParams('payment.result.consultationBooked', {
      name: this.result.consultation.doctorName,
      time: this.result.consultation.timeLabel,
    });
  }

  goHome(): void {
    void this.router.navigate(['/tabs/home']);
  }

  goShop(): void {
    void this.router.navigate(['/shop']);
  }

  goConsultation(): void {
    void this.router.navigate(['/tabs/consultation']);
  }

  retry(): void {
    void this.router.navigate(['/payment']);
  }

  t(key: string): string {
    return this.translation.translate(key);
  }

  tParams(key: string, params: Record<string, string | number>): string {
    return this.translation.translateParams(key, params);
  }
}
