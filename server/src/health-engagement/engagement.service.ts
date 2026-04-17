import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { calendarDaysBetweenUtc } from '../reproductive/utils/pregnancy-metrics.util';
import {
  computeEngagementScore,
  startOfUtcDay,
  tierFromScore,
} from './health-engagement.util';
import type { EngagementTier } from './health-engagement.types';

const WINDOW_DAYS = 30;
const OPEN_DEBOUNCE_MS = 60 * 60 * 1000;

@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  private windowStart(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - WINDOW_DAYS);
    return d;
  }

  private async pruneOldOpens(userId: number) {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 40);
    await this.prisma.user_app_open.deleteMany({
      where: { userId, createdAt: { lt: cutoff } },
    });
  }

  /**
   * Records an app open (debounced), updates lastOpenAt / optional preferred hour, refreshes score.
   */
  async recordAppOpen(userId: number, localHour0to23?: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const lastEvt = await tx.user_app_open.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      const shouldCountOpen =
        !lastEvt || now.getTime() - lastEvt.createdAt.getTime() >= OPEN_DEBOUNCE_MS;
      if (shouldCountOpen) {
        await tx.user_app_open.create({ data: { userId } });
      }
      await tx.user_engagement.upsert({
        where: { userId },
        create: {
          userId,
          lastOpenAt: now,
          lastActiveHour:
            localHour0to23 != null && localHour0to23 >= 0 && localHour0to23 <= 23
              ? localHour0to23
              : null,
          engagementScore: 0,
          engagementTier: 'LOW',
          consecutiveIgnoredNotifications: 0,
        },
        update: {
          lastOpenAt: now,
          ...(localHour0to23 != null && localHour0to23 >= 0 && localHour0to23 <= 23
            ? { lastActiveHour: localHour0to23 }
            : {}),
          consecutiveIgnoredNotifications: 0,
        },
      });
    });
    await this.pruneOldOpens(userId);
    await this.refreshEngagementMetrics(userId);
  }

  async refreshEngagementMetrics(userId: number): Promise<{
    score: number;
    tier: EngagementTier;
    opens30d: number;
    logs30d: number;
    inactivityDays: number;
  }> {
    const since = this.windowStart();
    const [opens30d, plogs, tlogs, engagement] = await Promise.all([
      this.prisma.user_app_open.count({ where: { userId, createdAt: { gte: since } } }),
      this.prisma.period_logs.count({ where: { userId, createdAt: { gte: since } } }),
      this.prisma.trackday.count({ where: { userId, createdAt: { gte: since } } }),
      this.prisma.user_engagement.findUnique({ where: { userId } }),
    ]);
    const logs30d = plogs + tlogs;
    const lastOpen = engagement?.lastOpenAt ?? null;
    const today = startOfUtcDay(new Date());
    const inactivityDays = lastOpen
      ? Math.max(0, calendarDaysBetweenUtc(startOfUtcDay(lastOpen), today))
      : WINDOW_DAYS;
    const score = computeEngagementScore(opens30d, logs30d, inactivityDays);
    const tier = tierFromScore(score);
    await this.prisma.user_engagement.upsert({
      where: { userId },
      create: {
        userId,
        lastOpenAt: lastOpen,
        engagementScore: score,
        engagementTier: tier,
        consecutiveIgnoredNotifications: 0,
      },
      update: {
        engagementScore: score,
        engagementTier: tier,
      },
    });
    return { score, tier, opens30d, logs30d, inactivityDays };
  }

  async incrementIgnored(userId: number): Promise<void> {
    await this.prisma.user_engagement.upsert({
      where: { userId },
      create: {
        userId,
        engagementScore: 0,
        engagementTier: 'LOW',
        consecutiveIgnoredNotifications: 1,
      },
      update: {
        consecutiveIgnoredNotifications: { increment: 1 },
      },
    });
  }
}
