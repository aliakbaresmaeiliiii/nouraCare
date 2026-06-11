import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';

export interface CycleRawData {
  cycle: {
    lastPeriodDate: Date | null;
    cycleLength: number | null;
    adaptiveCycleLength: number | null;
    lastPredictedNextPeriodIso: string | null;
    predictionErrors: unknown;
  } | null;
  logs: {
    lastPeriodDate: Date;
    averagePeriodDuration: number | null;
  }[];
  onboardingPeriodDuration: number | null;
  trackDays: { date: Date; symptoms: string | null }[];
}

export interface UpsertCyclePayload {
  lastPeriodDate?: string;
  cycleLength?: number;
  adaptiveCycleLength?: number | null;
  predictionErrors?: number[];
  lastPredictedNextPeriodIso?: string | null;
}

@Injectable()
export class CycleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCycleRecord(
    tx: PrismaService | Prisma.TransactionClient,
    userId: number,
  ): Promise<CycleRawData['cycle']> {
    const cycle = await tx.cycle_data.findUnique({ where: { userId } });
    if (!cycle) {
      return null;
    }
    return {
      lastPeriodDate: cycle.lastPeriodDate,
      cycleLength: cycle.cycleLength,
      adaptiveCycleLength: cycle.adaptiveCycleLength,
      lastPredictedNextPeriodIso: cycle.lastPredictedNextPeriodIso,
      predictionErrors: cycle.predictionErrors,
    };
  }

  async loadRawData(userId: number): Promise<CycleRawData> {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 400);

    const [cycle, logs, onboarding, trackDays] = await Promise.all([
      this.prisma.cycle_data.findUnique({ where: { userId } }),
      this.prisma.period_logs.findMany({
        where: { userId },
        orderBy: { lastPeriodDate: 'desc' },
        take: 48,
      }),
      this.prisma.onboarding_data.findUnique({
        where: { userId },
        select: { periodDuration: true },
      }),
      this.prisma.trackday.findMany({
        where: { userId, date: { gte: since } },
        select: { date: true, symptoms: true },
        orderBy: { date: 'desc' },
        take: 200,
      }),
    ]);

    return {
      cycle: cycle
        ? {
            lastPeriodDate: cycle.lastPeriodDate,
            cycleLength: cycle.cycleLength,
            adaptiveCycleLength: cycle.adaptiveCycleLength,
            lastPredictedNextPeriodIso: cycle.lastPredictedNextPeriodIso,
            predictionErrors: cycle.predictionErrors,
          }
        : null,
      logs,
      onboardingPeriodDuration: onboarding?.periodDuration ?? null,
      trackDays,
    };
  }

  async upsertCycleData(
    tx: PrismaService | Prisma.TransactionClient,
    userId: number,
    payload: UpsertCyclePayload,
  ): Promise<void> {
    const now = new Date();
    const errorsJson =
      payload.predictionErrors && payload.predictionErrors.length > 0
        ? (payload.predictionErrors as Prisma.InputJsonValue)
        : Prisma.DbNull;

    await tx.cycle_data.upsert({
      where: { userId },
      create: {
        userId,
        lastPeriodDate: payload.lastPeriodDate ? new Date(payload.lastPeriodDate) : null,
        cycleLength: payload.cycleLength ?? 28,
        adaptiveCycleLength: payload.adaptiveCycleLength ?? undefined,
        predictionErrors: errorsJson === Prisma.DbNull ? undefined : errorsJson,
        lastPredictedNextPeriodIso: payload.lastPredictedNextPeriodIso ?? null,
        updatedAt: now,
      },
      update: {
        ...(payload.lastPeriodDate !== undefined && {
          lastPeriodDate: payload.lastPeriodDate ? new Date(payload.lastPeriodDate) : null,
        }),
        ...(payload.cycleLength !== undefined && { cycleLength: payload.cycleLength }),
        ...(payload.adaptiveCycleLength !== undefined && {
          adaptiveCycleLength: payload.adaptiveCycleLength,
        }),
        ...(payload.predictionErrors !== undefined && { predictionErrors: errorsJson }),
        ...(payload.lastPredictedNextPeriodIso !== undefined && {
          lastPredictedNextPeriodIso: payload.lastPredictedNextPeriodIso,
        }),
        updatedAt: now,
      },
    });
  }

  async savePredictionSnapshot(
    userId: number,
    data: {
      lastStart: Date;
      storedCycleLength: number | null;
      effectiveCycleLength: number;
      nextPeriodIso: string;
    },
  ): Promise<void> {
    const now = new Date();
    await this.prisma.cycle_data.upsert({
      where: { userId },
      create: {
        userId,
        lastPeriodDate: data.lastStart,
        cycleLength: data.storedCycleLength ?? Math.round(data.effectiveCycleLength),
        lastPredictedNextPeriodIso: data.nextPeriodIso,
        updatedAt: now,
      },
      update: {
        lastPredictedNextPeriodIso: data.nextPeriodIso,
        updatedAt: now,
      },
    });
  }
}
