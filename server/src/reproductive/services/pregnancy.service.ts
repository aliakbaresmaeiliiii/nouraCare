import { Injectable } from '@nestjs/common';
import { resolveLmpFromPregnancyInputs } from '../utils/pregnancy-lmp.util';
import {
  computePregnancyMetricsFromLmp,
  tipsForPregnancyWeek,
} from '../utils/pregnancy-metrics.util';

@Injectable()
export class PregnancyService {
  /**
   * Persists LMP as `pregnancy.startDate` (single source of truth). Clears `currentWeek`.
   */
  async upsertPregnancyData(
    tx: any,
    userId: number,
    payload: { pregnancyStartDate?: string; currentWeek?: number; pregnancyDueDate?: string },
  ) {
    const { lmp } = resolveLmpFromPregnancyInputs(payload);
    const now = new Date();
    await tx.pregnancy.upsert({
      where: { userId },
      create: {
        userId,
        startDate: lmp,
        currentWeek: null,
        updatedAt: now,
      },
      update: {
        startDate: lmp,
        currentWeek: null,
        endDate: null,
        updatedAt: now,
      },
    });
  }

  async closeActivePregnancy(tx: any, userId: number) {
    await tx.pregnancy.updateMany({
      where: { userId, endDate: null },
      data: { endDate: new Date(), updatedAt: new Date() },
    });
  }

  /**
   * Active pregnancy: `endDate` null. Metrics always derived from stored LMP (`startDate`).
   */
  async getDashboardData(tx: any, userId: number) {
    return this.computeDashboardFromRow(tx, userId);
  }

  private async computeDashboardFromRow(tx: any, userId: number) {
    const pregnancy = await tx.pregnancy.findUnique({ where: { userId } });
    if (!pregnancy || pregnancy.endDate) {
      return {
        week: null as number | null,
        day: null as number | null,
        progress: null as number | null,
        tips: [] as string[],
        lastMenstrualPeriod: null as string | null,
      };
    }

    const metrics = computePregnancyMetricsFromLmp(pregnancy.startDate, new Date());
    const tips = tipsForPregnancyWeek(metrics.week);
    const lastMenstrualPeriod = pregnancy.startDate.toISOString().split('T')[0];
    return {
      week: metrics.week,
      day: metrics.day,
      progress: metrics.progress,
      tips,
      lastMenstrualPeriod,
    };
  }
}
