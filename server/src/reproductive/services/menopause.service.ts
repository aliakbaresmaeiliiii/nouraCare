import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { calendarDaysBetweenUtc } from '../utils/pregnancy-metrics.util';
import { utcMidnightFromDate } from '../utils/cycle-prediction.util';

export type MenopauseStage = 'perimenopause' | 'menopause';

export interface MenopauseDashboardPayload {
  menopauseStage: MenopauseStage;
  daysSinceLastPeriod: number | null;
  lastPeriodDate: string | null;
  insight: string;
  tips: string[];
}

const PERIMENOPAUSE_TIPS = [
  'Track irregular cycles — gaps longer than 60 days can be normal in perimenopause.',
  'Note hot flashes and sleep changes; patterns help you and your care team.',
  'Light strength training and walking support bone and heart health.',
  'Stay hydrated and limit caffeine if night sweats disrupt sleep.',
];

const MENOPAUSE_TIPS = [
  'Prioritize calcium, vitamin D, and weight-bearing exercise for bone health.',
  'Layer clothing and keep your bedroom cool to ease hot flashes.',
  'Regular check-ups help monitor blood pressure, cholesterol, and bone density.',
  'Mindfulness and gentle movement can ease mood shifts during this transition.',
];

@Injectable()
export class MenopauseService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertMenopauseData(
    tx: PrismaService | any,
    userId: number,
    payload: { menopauseStage?: MenopauseStage; notes?: string },
  ) {
    const now = new Date();
    const stagePrisma =
      payload.menopauseStage === 'menopause' ? 'MENOPAUSE' : 'PERIMENOPAUSE';

    await tx.menopause_data.upsert({
      where: { userId },
      create: {
        userId,
        stage: stagePrisma,
        notes: payload.notes ?? null,
        updatedAt: now,
      },
      update: {
        ...(payload.menopauseStage !== undefined ? { stage: stagePrisma } : {}),
        ...(payload.notes !== undefined ? { notes: payload.notes ?? null } : {}),
        updatedAt: now,
      },
    });
  }

  async getDashboardData(
    tx: PrismaService | any,
    userId: number,
  ): Promise<MenopauseDashboardPayload> {
    const row = await tx.menopause_data.findUnique({ where: { userId } });
    const stage: MenopauseStage =
      row?.stage === 'MENOPAUSE' ? 'menopause' : 'perimenopause';

    const cycle = await tx.cycle_data.findUnique({ where: { userId } });
    let daysSinceLastPeriod: number | null = null;
    let lastPeriodDate: string | null = null;

    if (cycle?.lastPeriodDate) {
      const lmp = utcMidnightFromDate(cycle.lastPeriodDate);
      const today = utcMidnightFromDate(new Date());
      daysSinceLastPeriod = Math.max(0, calendarDaysBetweenUtc(lmp, today));
      lastPeriodDate = lmp.toISOString().split('T')[0];
    }

    return {
      menopauseStage: stage,
      daysSinceLastPeriod,
      lastPeriodDate,
      insight: this.buildInsight(stage, daysSinceLastPeriod),
      tips: this.buildTips(stage, daysSinceLastPeriod),
    };
  }

  private buildTips(
    stage: MenopauseStage,
    daysSinceLastPeriod: number | null,
  ): string[] {
    if (stage === 'menopause') {
      return MENOPAUSE_TIPS;
    }
    if (daysSinceLastPeriod != null && daysSinceLastPeriod >= 60) {
      return [
        'Long gaps between periods are common in late perimenopause — still report sudden pain or bleeding.',
        ...PERIMENOPAUSE_TIPS.slice(1),
      ];
    }
    return PERIMENOPAUSE_TIPS;
  }

  private buildInsight(
    stage: MenopauseStage,
    daysSinceLastPeriod: number | null,
  ): string {
    if (stage === 'menopause') {
      return 'You are in menopause — focus on bone health, heart health, sleep, and symptom support with your care team.';
    }
    if (daysSinceLastPeriod == null) {
      return 'Perimenopause brings changing cycles — add your last period when you can for personalized insights.';
    }
    if (daysSinceLastPeriod >= 60) {
      return `${daysSinceLastPeriod} days since your last period — longer gaps are a common late-perimenopause milestone.`;
    }
    if (daysSinceLastPeriod >= 35) {
      return `${daysSinceLastPeriod} days since your last period — irregular windows are expected; track symptoms to spot patterns.`;
    }
    return `${daysSinceLastPeriod} days since your last period — hormone shifts may affect sleep, mood, and hot flashes.`;
  }
}
