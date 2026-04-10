import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';

@Injectable()
export class CycleService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertCycleData(
    tx: PrismaService | any,
    userId: number,
    payload: { lastPeriodDate?: string; cycleLength?: number },
  ) {
    const now = new Date();
    await tx.cycle_data.upsert({
      where: { userId },
      create: {
        userId,
        lastPeriodDate: payload.lastPeriodDate ? new Date(payload.lastPeriodDate) : null,
        cycleLength: payload.cycleLength ?? 28,
        updatedAt: now,
      },
      update: {
        ...(payload.lastPeriodDate !== undefined && {
          lastPeriodDate: payload.lastPeriodDate ? new Date(payload.lastPeriodDate) : null,
        }),
        ...(payload.cycleLength !== undefined && { cycleLength: payload.cycleLength }),
        updatedAt: now,
      },
    });
  }

  async getDashboardData(userId: number) {
    const cycle = await this.prisma.cycle_data.findUnique({ where: { userId } });
    if (!cycle || !cycle.lastPeriodDate || !cycle.cycleLength) {
      return { nextPeriod: null, cycleLength: cycle?.cycleLength ?? null };
    }
    const nextPeriod = new Date(cycle.lastPeriodDate);
    nextPeriod.setDate(nextPeriod.getDate() + cycle.cycleLength);
    return { nextPeriod, cycleLength: cycle.cycleLength };
  }
}
