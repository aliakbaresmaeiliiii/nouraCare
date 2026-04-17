import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/services/prisma.service';
import { ReproductiveStateService } from '../reproductive/reproductive-state.service';
import { utcDateIso } from '../health-engagement/health-engagement.util';
import { generateReferralCodeSegment, normalizeInviteCode } from './utils/referral-code.util';
import { buildShareableSummary, utcTodayIso } from './utils/shareable-summary.util';

const REFERRAL_POINTS_EACH = 50;
const CHECKIN_GROWTH_POINTS = 5;

function addUtcDaysIso(baseIso: string, deltaDays: number): string {
  const y = Number(baseIso.slice(0, 4));
  const m = Number(baseIso.slice(5, 7)) - 1;
  const d = Number(baseIso.slice(8, 10));
  const dt = new Date(Date.UTC(y, m, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return utcDateIso(dt);
}

@Injectable()
export class GrowthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reproductiveState: ReproductiveStateService,
  ) {}

  async previewReferralCode(code: string): Promise<{ valid: boolean; code: string }> {
    const normalized = normalizeInviteCode(code);
    if (!normalized) {
      return { valid: false, code: '' };
    }
    const row = await this.prisma.referral_code.findUnique({
      where: { code: normalized },
      select: { userId: true },
    });
    return { valid: !!row, code: normalized };
  }

  /** Idempotent: every account gets exactly one referral code row. */
  async ensureReferralCode(userId: number): Promise<string> {
    const existing = await this.prisma.referral_code.findUnique({
      where: { userId },
      select: { code: true },
    });
    if (existing) {
      return existing.code;
    }
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = generateReferralCodeSegment();
      try {
        await this.prisma.referral_code.create({
          data: { userId, code: candidate },
        });
        return candidate;
      } catch {
        /* unique collision — retry */
      }
    }
    throw new Error('Unable to allocate referral code');
  }

  /**
   * Call once per brand-new account (email register or first-time social user).
   * Awards both sides when `inviteCode` matches another user's code.
   */
  async onNewAccount(userId: number, inviteCode?: string | null): Promise<void> {
    await this.ensureReferralCode(userId);
    const normalized = normalizeInviteCode(inviteCode ?? undefined);
    if (!normalized) {
      return;
    }
    await this.tryAttachReferral(userId, normalized);
  }

  private async tryAttachReferral(referredUserId: number, code: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const refRow = await tx.referral_code.findUnique({
        where: { code },
        select: { userId: true },
      });
      if (!refRow || refRow.userId === referredUserId) {
        return;
      }
      const referrerUserId = refRow.userId;
      const dup = await tx.referral.findUnique({
        where: { referredUserId },
        select: { id: true },
      });
      if (dup) {
        return;
      }
      await tx.referral.create({
        data: {
          referrerUserId,
          referredUserId,
          code,
        },
      });
      await this.addGrowthPointsTx(tx, referrerUserId, REFERRAL_POINTS_EACH);
      await this.addGrowthPointsTx(tx, referredUserId, REFERRAL_POINTS_EACH);
    });
  }

  private async addGrowthPointsTx(tx: Prisma.TransactionClient, userId: number, delta: number) {
    await tx.user_engagement.upsert({
      where: { userId },
      create: {
        userId,
        growthPoints: delta,
        engagementScore: 0,
        engagementTier: 'LOW',
        consecutiveIgnoredNotifications: 0,
      },
      update: {
        growthPoints: { increment: delta },
      },
    });
  }

  async getSummary(userId: number) {
    const code = await this.ensureReferralCode(userId);
    const [engagement, referralCount] = await Promise.all([
      this.prisma.user_engagement.findUnique({ where: { userId } }),
      this.prisma.referral.count({ where: { referrerUserId: userId } }),
    ]);
    const todayIso = utcTodayIso();
    const last = engagement?.lastCheckInDayIso ?? null;
    const checkedInToday = last === todayIso;
    return {
      referralCode: code,
      growthPoints: engagement?.growthPoints ?? 0,
      checkInStreak: engagement?.checkInStreak ?? 0,
      lastCheckInDayIso: last,
      checkedInToday,
      successfulReferrals: referralCount,
    };
  }

  async recordCheckIn(userId: number): Promise<{
    checkedInToday: boolean;
    checkInStreak: number;
    growthPoints: number;
    alreadyCheckedIn: boolean;
  }> {
    const todayIso = utcTodayIso();
    const yesterdayIso = addUtcDaysIso(todayIso, -1);

    return this.prisma.$transaction(async (tx) => {
      const engagement = await tx.user_engagement.findUnique({ where: { userId } });
      const last = engagement?.lastCheckInDayIso ?? null;
      if (last === todayIso) {
        return {
          checkedInToday: true,
          checkInStreak: engagement?.checkInStreak ?? 0,
          growthPoints: engagement?.growthPoints ?? 0,
          alreadyCheckedIn: true,
        };
      }

      let nextStreak = 1;
      if (last === yesterdayIso) {
        nextStreak = (engagement?.checkInStreak ?? 0) + 1;
      }

      const updated = await tx.user_engagement.upsert({
        where: { userId },
        create: {
          userId,
          lastCheckInDayIso: todayIso,
          checkInStreak: nextStreak,
          growthPoints: CHECKIN_GROWTH_POINTS,
          engagementScore: 0,
          engagementTier: 'LOW',
          consecutiveIgnoredNotifications: 0,
        },
        update: {
          lastCheckInDayIso: todayIso,
          checkInStreak: nextStreak,
          growthPoints: { increment: CHECKIN_GROWTH_POINTS },
        },
        select: {
          growthPoints: true,
          checkInStreak: true,
        },
      });

      return {
        checkedInToday: true,
        checkInStreak: updated.checkInStreak,
        growthPoints: updated.growthPoints,
        alreadyCheckedIn: false,
      };
    });
  }

  async getSharePayload(userId: number): Promise<{
    title: string;
    summaryBody: string;
    hashtags: string[];
    /** Relative path; client prefixes with `window.location.origin` for a full invite URL. */
    invitePath: string;
  }> {
    const dashboard = (await this.reproductiveState.getDashboard(userId)) as Record<
      string,
      unknown
    >;
    const { title, body, hashtags } = buildShareableSummary(dashboard);
    const code = await this.ensureReferralCode(userId);
    const invitePath = `/welcome?ref=${encodeURIComponent(code)}`;
    return { title, summaryBody: body, hashtags, invitePath };
  }
}
