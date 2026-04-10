import { Injectable } from '@nestjs/common';

@Injectable()
export class PlanningService {
  async upsertPlanningData(
    tx: any,
    userId: number,
    payload: { tryingSince?: string; notes?: string },
  ) {
    const now = new Date();
    await tx.pregnancy_planning.upsert({
      where: { userId },
      create: {
        userId,
        lastPeriodDate: payload.tryingSince ? new Date(payload.tryingSince) : now,
        cycleLength: 28,
        averagePeriodDuration: 5,
        lifestyleGoals: payload.notes ?? null,
        notes: payload.notes ?? null,
        updatedAt: now,
      },
      update: {
        ...(payload.tryingSince !== undefined && {
          lastPeriodDate: payload.tryingSince ? new Date(payload.tryingSince) : null,
        }),
        ...(payload.notes !== undefined && {
          notes: payload.notes,
          lifestyleGoals: payload.notes,
        }),
        updatedAt: now,
      },
    });
  }

  async getDashboardData(tx: any, userId: number) {
    const planning = await tx.pregnancy_planning.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      tryingSince: planning?.lastPeriodDate ?? null,
      notes: planning?.notes ?? null,
    };
  }
}
