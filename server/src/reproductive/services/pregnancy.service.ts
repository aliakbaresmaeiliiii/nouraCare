import { Injectable } from '@nestjs/common';

@Injectable()
export class PregnancyService {
  async upsertPregnancyData(
    tx: any,
    userId: number,
    payload: { pregnancyStartDate?: string; currentWeek?: number },
  ) {
    const now = new Date();
    await tx.pregnancy.upsert({
      where: { userId },
      create: {
        userId,
        startDate: payload.pregnancyStartDate ? new Date(payload.pregnancyStartDate) : now,
        currentWeek: payload.currentWeek ?? null,
        updatedAt: now,
      },
      update: {
        ...(payload.pregnancyStartDate !== undefined && {
          startDate: payload.pregnancyStartDate ? new Date(payload.pregnancyStartDate) : undefined,
        }),
        ...(payload.currentWeek !== undefined && { currentWeek: payload.currentWeek }),
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

  async getDashboardData(tx: any, userId: number) {
    const pregnancy = await tx.pregnancy.findUnique({ where: { userId } });
    if (!pregnancy || pregnancy.endDate) {
      return { week: null };
    }

    const computedWeek = this.computeWeek(pregnancy.startDate);
    return { week: pregnancy.currentWeek ?? computedWeek };
  }

  private computeWeek(startDate: Date) {
    const days = Math.max(
      0,
      Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
    return Math.floor(days / 7) + 1;
  }
}
