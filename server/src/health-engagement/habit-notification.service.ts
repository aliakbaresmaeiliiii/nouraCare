import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { ReproductiveStateService } from '../reproductive/reproductive-state.service';
import { EngagementService } from './engagement.service';
import {
  calendarDaysBetweenUtc,
  tipsForPregnancyWeek,
} from '../reproductive/utils/pregnancy-metrics.util';
import type { EngagementTier, HealthNotificationType } from './health-engagement.types';
import {
  DEFAULT_EVENING_HOUR_UTC,
  isSoftNotification,
  minDaysBetweenSoftNotifications,
  periodReminderLeadDays,
  startOfUtcDay,
  utcDateIso,
} from './health-engagement.util';

export type SendNotificationResult = { sent: boolean; reason?: string };

@Injectable()
export class HabitNotificationService {
  private readonly logger = new Logger(HabitNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reproductiveState: ReproductiveStateService,
    private readonly engagement: EngagementService,
  ) {}

  /**
   * Outbound notification pipeline: caps, ignored-state, optional hour gate, persistence + hook for push.
   */
  async sendNotification(
    userId: number,
    type: HealthNotificationType,
    message: string,
    options?: { bypassDailyCap?: boolean; bypassHourGate?: boolean },
  ): Promise<SendNotificationResult> {
    const onboarding = await this.prisma.onboarding_data.findUnique({
      where: { userId },
      select: { notificationsEnabled: true },
    });
    if (onboarding?.notificationsEnabled === false) {
      return { sent: false, reason: 'notifications_disabled' };
    }

    const now = new Date();
    const todayIso = utcDateIso(now);
    const eng = await this.prisma.user_engagement.findUnique({ where: { userId } });
    const ignored = eng?.consecutiveIgnoredNotifications ?? 0;

    if (!options?.bypassDailyCap && eng?.lastNotificationDayIso === todayIso) {
      return { sent: false, reason: 'daily_cap' };
    }

    if (isSoftNotification(type) && ignored >= 4) {
      return { sent: false, reason: 'ignored_soft_blocked' };
    }

    if (isSoftNotification(type) && ignored >= 1) {
      const minGap = minDaysBetweenSoftNotifications(ignored);
      if (eng?.lastNotificationSentAt) {
        const daysSince = calendarDaysBetweenUtc(
          startOfUtcDay(eng.lastNotificationSentAt),
          startOfUtcDay(now),
        );
        if (daysSince < minGap) {
          return { sent: false, reason: 'soft_cooldown' };
        }
      }
    }

    if (!options?.bypassHourGate) {
      const hour = now.getUTCHours();
      const preferred = eng?.lastActiveHour ?? DEFAULT_EVENING_HOUR_UTC;
      if (hour !== preferred) {
        return { sent: false, reason: 'outside_preferred_hour' };
      }
    }

    await this.prisma.$transaction([
      this.prisma.health_notification_log.create({
        data: { userId, type, message },
      }),
      this.prisma.user_engagement.upsert({
        where: { userId },
        create: {
          userId,
          lastNotificationSentAt: now,
          lastNotificationDayIso: todayIso,
          engagementScore: 0,
          engagementTier: 'LOW',
        },
        update: {
          lastNotificationSentAt: now,
          lastNotificationDayIso: todayIso,
        },
      }),
    ]);

    this.dispatchToPushChannel(userId, type, message);
    return { sent: true };
  }

  /** Placeholder for FCM / APNS — logs now so behavior is observable in dev. */
  private dispatchToPushChannel(userId: number, type: HealthNotificationType, message: string) {
    this.logger.log(`sendNotification userId=${userId} type=${type} message=${message.slice(0, 120)}`);
  }

  async markNotificationIgnored(userId: number): Promise<void> {
    await this.engagement.incrementIgnored(userId);
  }

  /**
   * Picks at most one smart notification from cycle / pregnancy / inactivity signals.
   */
  async evaluateSmartNotification(userId: number): Promise<{
    type: HealthNotificationType;
    message: string;
  } | null> {
    const metrics = await this.engagement.refreshEngagementMetrics(userId);
    const tier = metrics.tier;
    const dashboard = await this.reproductiveState.getDashboard(userId);
    const state = (dashboard as { state: string }).state;
    const todayIso = utcDateIso(new Date());
    const inactivityDays = metrics.inactivityDays;

    if (state === 'pregnant') {
      const d = dashboard as {
        needsPregnancyInput?: boolean;
        week?: number | null;
      };
      if (!d.needsPregnancyInput && d.week != null) {
        const recent = await this.prisma.health_notification_log.findFirst({
          where: { userId, type: 'PREGNANCY_INSIGHT' },
          orderBy: { sentAt: 'desc' },
        });
        const minGapDays = tier === 'HIGH' ? 4 : tier === 'MEDIUM' ? 6 : 8;
        const gapOk =
          !recent?.sentAt ||
          calendarDaysBetweenUtc(startOfUtcDay(recent.sentAt), startOfUtcDay(new Date())) >=
            minGapDays;
        if (gapOk) {
          const tips = tipsForPregnancyWeek(d.week);
          const pick = tips[d.week % Math.max(1, tips.length)] ?? tips[0];
          return { type: 'PREGNANCY_INSIGHT', message: pick };
        }
      }
    } else if (
      state === 'cycle' ||
      state === 'planning' ||
      state === 'postpartum' ||
      state === 'menopause'
    ) {
      const d = dashboard as {
        nextPeriod?: Date | string | null;
        fertileWindow?: { start: string; end: string } | null;
      };
      const next =
        d.nextPeriod == null
          ? null
          : typeof d.nextPeriod === 'string'
            ? new Date(d.nextPeriod)
            : d.nextPeriod;
      const daysTo =
        next != null && !Number.isNaN(next.getTime())
          ? calendarDaysBetweenUtc(startOfUtcDay(new Date()), startOfUtcDay(next))
          : null;
      const lead = periodReminderLeadDays(tier as EngagementTier);
      if (daysTo != null && daysTo >= 0 && daysTo <= lead) {
        const msg =
          daysTo === 0
            ? 'Your period may start today — check in with how you feel.'
            : daysTo === 1
              ? 'Your period is likely tomorrow. Want to log any symptoms?'
              : `About ${daysTo} days until your next period — gentle reminder.`;
        return { type: 'PERIOD_REMINDER', message: msg };
      }
      if (d.fertileWindow?.start === todayIso) {
        const ign = await this.prisma.user_engagement.findUnique({
          where: { userId },
          select: { consecutiveIgnoredNotifications: true },
        });
        if ((ign?.consecutiveIgnoredNotifications ?? 0) >= 3 && tier === 'LOW') {
          return null;
        }
        return {
          type: 'FERTILE_WINDOW',
          message: 'Fertile window starts today — helpful time to track signs if you are trying.',
        };
      }
    }

    if (inactivityDays > 5 && tier !== 'HIGH') {
      return {
        type: 'RE_ENGAGEMENT',
        message: 'We miss you — a quick log today keeps predictions accurate for you.',
      };
    }

    return null;
  }

  /** Hourly: users whose preferred UTC hour matches now get one evaluated send. */
  async runScheduledDigests(): Promise<void> {
    const hour = new Date().getUTCHours();
    const rows = await this.prisma.user_engagement.findMany({
      where: {
        OR: [{ lastActiveHour: hour }, { lastActiveHour: null }],
      },
      take: 400,
      select: { userId: true, lastActiveHour: true },
    });
    for (const row of rows) {
      const preferred = row.lastActiveHour ?? DEFAULT_EVENING_HOUR_UTC;
      if (preferred !== hour) continue;
      const candidate = await this.evaluateSmartNotification(row.userId);
      if (!candidate) continue;
      const res = await this.sendNotification(row.userId, candidate.type, candidate.message);
      if (res.sent) {
        this.logger.debug(`digest user=${row.userId} type=${candidate.type}`);
      }
    }
  }

  /** Client can call on cold start to attempt a send (respects caps; skips preferred-hour gate). */
  async trySendForUserNow(userId: number): Promise<SendNotificationResult> {
    const candidate = await this.evaluateSmartNotification(userId);
    if (!candidate) return { sent: false, reason: 'no_candidate' };
    return this.sendNotification(userId, candidate.type, candidate.message, {
      bypassHourGate: true,
    });
  }
}
