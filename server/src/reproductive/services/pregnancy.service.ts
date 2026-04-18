import { Injectable } from '@nestjs/common';
import { resolveLmpFromPregnancyInputs } from '../utils/pregnancy-lmp.util';
import {
  computePregnancyMetricsFromLmp,
  pregnancyDashboardInsight,
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
    const metrics = computePregnancyMetricsFromLmp(lmp, new Date());
    const persistedCurrentWeek =
      payload.currentWeek !== undefined && payload.currentWeek !== null
        ? payload.currentWeek
        : metrics.week;
    // Persist expected pregnancy end date (EDD) to keep DB record complete.
    const persistedEndDate = new Date(lmp.getTime() + 280 * 86400000);
    const now = new Date();
    await tx.pregnancy.upsert({
      where: { userId },
      create: {
        userId,
        startDate: lmp,
        endDate: persistedEndDate,
        currentWeek: persistedCurrentWeek,
        updatedAt: now,
      },
      update: {
        startDate: lmp,
        currentWeek: persistedCurrentWeek,
        endDate: persistedEndDate,
        updatedAt: now,
      },
    });
  }

  async closeActivePregnancy(tx: any, userId: number) {
    const today = new Date();
    await tx.pregnancy.updateMany({
      where: {
        userId,
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      data: { endDate: today, updatedAt: new Date() },
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
    const today = new Date();
    const isClosed = Boolean(pregnancy?.endDate && pregnancy.endDate < today);
    if (!pregnancy || isClosed) {
      return {
        week: null as number | null,
        day: null as number | null,
        progress: null as number | null,
        tips: [] as string[],
        insight: null as string | null,
        lastMenstrualPeriod: null as string | null,
      };
    }

    const metrics = computePregnancyMetricsFromLmp(pregnancy.startDate, new Date());
    const tips = tipsForPregnancyWeek(metrics.week);
    const insight = pregnancyDashboardInsight(metrics.week);
    const lastMenstrualPeriod = pregnancy.startDate.toISOString().split('T')[0];
    return {
      week: metrics.week,
      day: metrics.day,
      progress: metrics.progress,
      tips,
      insight,
      lastMenstrualPeriod,
    };
  }
}
