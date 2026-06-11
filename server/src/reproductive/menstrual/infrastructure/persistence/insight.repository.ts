import { Injectable } from '@nestjs/common';
import { daily_insight_source } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { toIsoDateOnly, utcMidnightFromDate } from '../../../utils/cycle-prediction.util';

export interface CachedInsight {
  insight: string;
  source: daily_insight_source;
}

@Injectable()
export class InsightRepository {
  constructor(private readonly prisma: PrismaService) {}

  private insightDateFrom(reference: Date = new Date()): Date {
    return utcMidnightFromDate(reference);
  }

  async findCached(userId: number, referenceDate: Date = new Date()): Promise<CachedInsight | null> {
    const insightDate = this.insightDateFrom(referenceDate);
    const row = await this.prisma.daily_cycle_insight.findUnique({
      where: {
        userId_insightDate: { userId, insightDate },
      },
    });
    if (!row) {
      return null;
    }
    return { insight: row.insight, source: row.source };
  }

  async save(
    userId: number,
    insight: string,
    source: daily_insight_source,
    referenceDate: Date = new Date(),
  ): Promise<void> {
    const insightDate = this.insightDateFrom(referenceDate);
    const now = new Date();
    await this.prisma.daily_cycle_insight.upsert({
      where: {
        userId_insightDate: { userId, insightDate },
      },
      create: {
        userId,
        insightDate,
        insight,
        source,
        updatedAt: now,
      },
      update: {
        insight,
        source,
        updatedAt: now,
      },
    });
  }

  /** Drop cached insights when cycle inputs change (e.g. new period logged). */
  async invalidateForUser(userId: number, fromDate?: Date): Promise<void> {
    const from = fromDate ? utcMidnightFromDate(fromDate) : undefined;
    await this.prisma.daily_cycle_insight.deleteMany({
      where: {
        userId,
        ...(from ? { insightDate: { gte: from } } : {}),
      },
    });
  }

  isoDateKey(referenceDate: Date = new Date()): string {
    return toIsoDateOnly(utcMidnightFromDate(referenceDate));
  }
}
