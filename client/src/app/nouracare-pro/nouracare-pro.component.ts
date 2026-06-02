import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  bookOutline,
  calendarOutline,
  checkmarkCircle,
  diamondOutline,
  flashOutline,
  headsetOutline,
  lockOpenOutline,
  sparklesOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { ToastController } from '@ionic/angular/standalone';
import { ViewWillEnter } from '@ionic/angular';
import { catchError, finalize, of } from 'rxjs';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import {
  BillingInterval,
  DEFAULT_SUBSCRIPTION_SUMMARY,
  SubscriptionService,
  SubscriptionSummary,
} from '../shared/services/subscription.service';
import { LanguageService } from '../shared/services/language.service';
import { TranslationService } from '../shared/services/translation.service';
import { localizeDigitsInText } from '../shared/utils/locale-date-format.util';

interface ProFeature {
  icon: string;
  titleKey: string;
  textKey: string;
}

@Component({
  selector: 'app-nouracare-pro',
  templateUrl: './nouracare-pro.component.html',
  styleUrls: ['./nouracare-pro.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class NouracareProComponent implements OnInit, ViewWillEnter {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toastController = inject(ToastController);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isSubmitting = false;
  /** Non-blocking warning when API failed but page still shows with defaults. */
  loadWarning = '';
  summary: SubscriptionSummary | null = null;
  billingInterval: BillingInterval = 'YEAR';

  readonly features: ProFeature[] = [
    {
      icon: 'analytics-outline',
      titleKey: 'proPage.feature1Title',
      textKey: 'proPage.feature1Text',
    },
    {
      icon: 'book-outline',
      titleKey: 'proPage.feature2Title',
      textKey: 'proPage.feature2Text',
    },
    {
      icon: 'calendar-outline',
      titleKey: 'proPage.feature3Title',
      textKey: 'proPage.feature3Text',
    },
    {
      icon: 'sparkles-outline',
      titleKey: 'proPage.feature4Title',
      textKey: 'proPage.feature4Text',
    },
    {
      icon: 'headset-outline',
      titleKey: 'proPage.feature5Title',
      textKey: 'proPage.feature5Text',
    },
    {
      icon: 'shield-checkmark-outline',
      titleKey: 'proPage.feature6Title',
      textKey: 'proPage.feature6Text',
    },
  ];

  constructor() {
    addIcons({
      analyticsOutline,
      bookOutline,
      calendarOutline,
      checkmarkCircle,
      diamondOutline,
      flashOutline,
      headsetOutline,
      lockOpenOutline,
      sparklesOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    this.loadSummary();
    this.languageService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ionViewWillEnter(): void {
    if (!this.isLoading && this.summary) {
      return;
    }
    if (!this.isLoading && !this.summary) {
      this.loadSummary();
    }
  }

  saveBadgeLabel(): string {
    return this.tParams('proPage.saveBadge', {
      percent: localizeDigitsInText(
        String(this.yearlySavePercent),
        this.languageService.getCurrentLanguage(),
      ),
    });
  }

  get hasPremium(): boolean {
    return !!this.summary?.hasPremiumAccess;
  }

  get isTrial(): boolean {
    return this.summary?.tier === 'PREMIUM_TRIAL';
  }

  get isPaidPremium(): boolean {
    return this.summary?.tier === 'PREMIUM';
  }

  get selectedPrice(): number {
    if (!this.summary) {
      return this.billingInterval === 'YEAR' ? 39.99 : 4.99;
    }
    return this.billingInterval === 'YEAR'
      ? this.summary.pricing.yearlyUsd
      : this.summary.pricing.monthlyUsd;
  }

  get yearlySavePercent(): number {
    return this.summary?.pricing.yearlySavesPercent ?? 33;
  }

  formatMoney(amount: number): string {
    const lang = this.languageService.getCurrentLanguage();
    const text = `$${amount.toFixed(2)}`;
    return localizeDigitsInText(text, lang);
  }

  formatPriceLine(): string {
    if (this.billingInterval === 'YEAR') {
      const monthly =
        this.summary?.pricing.yearlyMonthlyEquivalentUsd ??
        Math.round((this.selectedPrice / 12) * 100) / 100;
      return this.tParams('proPage.priceYearlyDetail', {
        total: this.formatMoney(this.selectedPrice),
        monthly: this.formatMoney(monthly),
        save: localizeDigitsInText(
          String(this.yearlySavePercent),
          this.languageService.getCurrentLanguage(),
        ),
      });
    }
    return this.tParams('proPage.priceMonthlyDetail', {
      price: this.formatMoney(this.selectedPrice),
    });
  }

  statusLabel(): string {
    if (!this.summary) {
      return '';
    }
    if (this.isPaidPremium) {
      return this.t('proPage.statusPremium');
    }
    if (this.isTrial && this.summary.trialDaysRemaining != null) {
      return this.tParams('proPage.statusTrial', {
        days: localizeDigitsInText(
          String(this.summary.trialDaysRemaining),
          this.languageService.getCurrentLanguage(),
        ),
      });
    }
    return this.t('proPage.statusFree');
  }

  primaryCtaLabel(): string {
    if (this.hasPremium && !this.isTrial) {
      return this.t('proPage.ctaActive');
    }
    if (this.isTrial) {
      return this.t('proPage.ctaSubscribeNow');
    }
    if (this.summary?.trialEligible) {
      return this.t('proPage.ctaStartTrial');
    }
    return this.t('proPage.ctaSubscribeNow');
  }

  onBillingChange(ev: Event): void {
    const value = (ev as CustomEvent<{ value?: string }>).detail?.value;
    if (value === 'MONTH' || value === 'YEAR') {
      this.billingInterval = value;
    }
  }

  onPrimaryAction(): void {
    if (!this.summary || this.isSubmitting) {
      return;
    }
    if (this.hasPremium && !this.isTrial) {
      void this.showToast(this.t('proPage.toastAlreadyPremium'));
      return;
    }
    if (this.summary.trialEligible && !this.hasPremium) {
      this.startTrial();
      return;
    }
    this.subscribe();
  }

  loadSummary(): void {
    this.isLoading = true;
    this.loadWarning = '';
    this.subscriptionService
      .getSummary()
      .pipe(
        catchError(() => {
          this.loadWarning = this.t('proPage.loadError');
          return of(DEFAULT_SUBSCRIPTION_SUMMARY);
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((data) => {
        this.summary = data ?? DEFAULT_SUBSCRIPTION_SUMMARY;
        this.cdr.markForCheck();
      });
  }

  private startTrial(): void {
    this.isSubmitting = true;
    this.subscriptionService
      .startTrial()
      .pipe(
        catchError(() => {
          void this.showToast(this.t('proPage.toastTrialFailed'));
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe((data) => {
        if (!data) {
          return;
        }
        this.summary = data;
        void this.showToast(this.t('proPage.toastTrialStarted'));
      });
  }

  private subscribe(): void {
    this.isSubmitting = true;
    this.subscriptionService
      .subscribe(this.billingInterval)
      .pipe(
        catchError(() => {
          void this.showToast(this.t('proPage.toastSubscribeFailed'));
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe((data) => {
        if (!data) {
          return;
        }
        this.summary = data;
        void this.showToast(this.t('proPage.toastSubscribed'));
      });
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2800,
      position: 'bottom',
    });
    await toast.present();
  }

  t(key: string): string {
    return this.translation.translate(key);
  }

  tParams(key: string, params: Record<string, string | number>): string {
    return this.translation.translateParams(key, params);
  }
}
