import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { calendarDaysBetweenUtc } from '../reproductive/utils/pregnancy-metrics.util';
import { startOfUtcDay } from '../health-engagement/health-engagement.util';
import type {
  user_subscription_billing_interval,
  user_subscription_tier,
} from '@prisma/client';

const TRIAL_DAYS = 7;

export interface SubscriptionSummaryDto {
  tier: user_subscription_tier;
  hasPremiumAccess: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  premiumUntil: string | null;
  billingInterval: user_subscription_billing_interval | null;
  usageDays: number;
  usageDayPaywallThreshold: number;
  shouldSuggestUsagePaywall: boolean;
  trialEligible: boolean;
  /** Shown in client copy: trial rolls into paid plan after billing is connected. */
  trialAutoConvertsToSubscription: boolean;
  pricing: {
    monthlyUsd: number;
    yearlyUsd: number;
    yearlyMonthlyEquivalentUsd: number;
    yearlySavesPercent: number;
  };
}

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  private pricing(): SubscriptionSummaryDto['pricing'] {
    const monthlyUsd = 4.99;
    const yearlyUsd = 39.99;
    const yearlyMonthlyEquivalentUsd =
      Math.round((yearlyUsd / 12) * 100) / 100;
    const rawSave = 1 - yearlyMonthlyEquivalentUsd / monthlyUsd;
    const yearlySavesPercent = Math.max(
      0,
      Math.min(99, Math.round(rawSave * 100)),
    );
    return {
      monthlyUsd,
      yearlyUsd,
      yearlyMonthlyEquivalentUsd,
      yearlySavesPercent,
    };
  }

  private async expireStaleRows(userId: number): Promise<void> {
    const now = new Date();
    const row = await this.prisma.user_subscription.findUnique({
      where: { userId },
    });
    if (!row) return;

    if (row.tier === 'PREMIUM_TRIAL' && row.trialEndsAt && row.trialEndsAt <= now) {
      await this.prisma.user_subscription.update({
        where: { userId },
        data: { tier: 'FREE' },
      });
      return;
    }

    if (row.tier === 'PREMIUM' && row.premiumUntil && row.premiumUntil <= now) {
      await this.prisma.user_subscription.update({
        where: { userId },
        data: { tier: 'FREE', premiumUntil: null, billingInterval: null },
      });
    }
  }

  private computeHasPremiumAccess(row: {
    tier: user_subscription_tier;
    trialEndsAt: Date | null;
    premiumUntil: Date | null;
  }): boolean {
    const now = new Date();
    if (row.tier === 'PREMIUM_TRIAL' && row.trialEndsAt && row.trialEndsAt > now) {
      return true;
    }
    if (row.tier === 'PREMIUM') {
      if (!row.premiumUntil || row.premiumUntil > now) {
        return true;
      }
    }
    return false;
  }

  private randomUsageThreshold(): number {
    return 3 + Math.floor(Math.random() * 3);
  }

  async ensureRow(userId: number) {
    let row = await this.prisma.user_subscription.findUnique({
      where: { userId },
    });
    if (!row) {
      row = await this.prisma.user_subscription.create({
        data: {
          userId,
          tier: 'FREE',
          usageDayPaywallThreshold: this.randomUsageThreshold(),
        },
      });
    }
    return row;
  }

  async getSummary(userId: number): Promise<SubscriptionSummaryDto> {
    await this.expireStaleRows(userId);
    let row = await this.ensureRow(userId);
    const now = new Date();

    if (!row.firstOpenedAt) {
      row = await this.prisma.user_subscription.update({
        where: { userId },
        data: { firstOpenedAt: now },
      });
    }

    const usageDays =
      calendarDaysBetweenUtc(
        startOfUtcDay(row.firstOpenedAt!),
        startOfUtcDay(now),
      ) + 1;

    const hasPremiumAccess = this.computeHasPremiumAccess(row);
    const shouldSuggestUsagePaywall =
      !hasPremiumAccess &&
      usageDays >= row.usageDayPaywallThreshold;

    let trialDaysRemaining: number | null = null;
    if (row.tier === 'PREMIUM_TRIAL' && row.trialEndsAt && row.trialEndsAt > now) {
      trialDaysRemaining = Math.max(
        1,
        Math.ceil((row.trialEndsAt.getTime() - now.getTime()) / 86_400_000),
      );
    }

    return {
      tier: row.tier,
      hasPremiumAccess,
      trialStartedAt: row.trialStartedAt?.toISOString() ?? null,
      trialEndsAt: row.trialEndsAt?.toISOString() ?? null,
      trialDaysRemaining,
      premiumUntil: row.premiumUntil?.toISOString() ?? null,
      billingInterval: row.billingInterval,
      usageDays,
      usageDayPaywallThreshold: row.usageDayPaywallThreshold,
      shouldSuggestUsagePaywall,
      trialEligible: !row.trialStartedAt,
      trialAutoConvertsToSubscription: true,
      pricing: this.pricing(),
    };
  }

  async startTrial(userId: number): Promise<SubscriptionSummaryDto> {
    await this.expireStaleRows(userId);
    const row = await this.ensureRow(userId);
    if (row.trialStartedAt) {
      throw new BadRequestException('Trial already used on this account');
    }
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + TRIAL_DAYS);

    await this.prisma.user_subscription.update({
      where: { userId },
      data: {
        tier: 'PREMIUM_TRIAL',
        trialStartedAt: now,
        trialEndsAt,
      },
    });
    return this.getSummary(userId);
  }

  async subscribeMock(
    userId: number,
    interval: user_subscription_billing_interval,
  ): Promise<SubscriptionSummaryDto> {
    const now = new Date();
    const premiumUntil = new Date(now);
    if (interval === 'MONTH') {
      premiumUntil.setUTCMonth(premiumUntil.getUTCMonth() + 1);
    } else {
      premiumUntil.setUTCFullYear(premiumUntil.getUTCFullYear() + 1);
    }

    await this.prisma.user_subscription.update({
      where: { userId },
      data: {
        tier: 'PREMIUM',
        premiumUntil,
        billingInterval: interval,
      },
    });
    return this.getSummary(userId);
  }
}
