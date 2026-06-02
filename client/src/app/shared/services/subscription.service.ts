import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, timeout, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const REQUEST_TIMEOUT_MS = 12_000;

export type SubscriptionTier = 'FREE' | 'PREMIUM_TRIAL' | 'PREMIUM';
export type BillingInterval = 'MONTH' | 'YEAR';

export interface SubscriptionPricing {
  monthlyUsd: number;
  yearlyUsd: number;
  yearlyMonthlyEquivalentUsd: number;
  yearlySavesPercent: number;
}

export interface SubscriptionSummary {
  tier: SubscriptionTier;
  hasPremiumAccess: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  premiumUntil: string | null;
  billingInterval: BillingInterval | null;
  usageDays: number;
  usageDayPaywallThreshold: number;
  shouldSuggestUsagePaywall: boolean;
  trialEligible: boolean;
  trialAutoConvertsToSubscription: boolean;
  pricing: SubscriptionPricing;
}

/** Shown when the subscription API is unreachable so Pro UI can still render. */
export const DEFAULT_SUBSCRIPTION_SUMMARY: SubscriptionSummary = {
  tier: 'FREE',
  hasPremiumAccess: false,
  trialStartedAt: null,
  trialEndsAt: null,
  trialDaysRemaining: null,
  premiumUntil: null,
  billingInterval: null,
  usageDays: 1,
  usageDayPaywallThreshold: 4,
  shouldSuggestUsagePaywall: false,
  trialEligible: true,
  trialAutoConvertsToSubscription: true,
  pricing: {
    monthlyUsd: 4.99,
    yearlyUsd: 39.99,
    yearlyMonthlyEquivalentUsd: 3.33,
    yearlySavesPercent: 33,
  },
};

function unwrap<T>(body: unknown): T {
  const b = body as { data?: T };
  return (b?.data ?? body) as T;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiEndPoint}me/subscription`;

  private withTimeout<T>() {
    return timeout<T>(REQUEST_TIMEOUT_MS);
  }

  private mapSummary<T extends SubscriptionSummary>() {
    return map((r: unknown) => {
      const summary = unwrap<T>(r);
      if (!summary || typeof summary !== 'object' || !('tier' in summary)) {
        throw new Error('Invalid subscription summary response');
      }
      return summary;
    });
  }

  getSummary(): Observable<SubscriptionSummary> {
    return this.http
      .get(this.base)
      .pipe(this.withTimeout(), this.mapSummary());
  }

  startTrial(): Observable<SubscriptionSummary> {
    return this.http.post(`${this.base}/trial`, {}).pipe(
      this.withTimeout(),
      this.mapSummary(),
    );
  }

  subscribe(interval: BillingInterval): Observable<SubscriptionSummary> {
    return this.http.post(`${this.base}/subscribe`, { interval }).pipe(
      this.withTimeout(),
      this.mapSummary(),
    );
  }
}
