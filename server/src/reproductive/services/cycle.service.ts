import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';
import { GetCycleDashboardUseCase } from '../menstrual/application/get-cycle-dashboard.usecase';
import { GetDailyInsightUseCase } from '../menstrual/application/get-daily-insight.usecase';
import { CycleCalculatorService } from '../menstrual/domain/cycle-calculator.service';
import { CycleRepository } from '../menstrual/infrastructure/persistence/cycle.repository';
import { CycleDashboardPayload } from '../menstrual/types/cycle-dashboard.types';

export type { CycleDashboardPayload };

/**
 * Facade for menstrual cycle operations.
 * Delegates reads to application use cases and writes to repositories + domain calculator.
 */
@Injectable()
export class CycleService {
  constructor(
    private readonly cycleRepository: CycleRepository,
    private readonly cycleCalculator: CycleCalculatorService,
    private readonly getCycleDashboard: GetCycleDashboardUseCase,
    private readonly getDailyInsight: GetDailyInsightUseCase,
  ) {}

  async upsertCycleData(
    tx: PrismaService | Prisma.TransactionClient,
    userId: number,
    payload: { lastPeriodDate?: string; cycleLength?: number },
  ): Promise<void> {
    const prev = await this.cycleRepository.findCycleRecord(tx, userId);
    const { predictionErrors, adaptiveCycleLength } = this.cycleCalculator.computeAdaptiveOnNewPeriod(
      prev,
      payload.lastPeriodDate ?? '',
    );

    await this.cycleRepository.upsertCycleData(tx, userId, {
      lastPeriodDate: payload.lastPeriodDate,
      cycleLength: payload.cycleLength,
      adaptiveCycleLength,
      predictionErrors,
    });

    if (payload.lastPeriodDate !== undefined) {
      await this.getDailyInsight.invalidateForUser(userId);
    }
  }

  async getDashboardData(userId: number): Promise<CycleDashboardPayload> {
    return this.getCycleDashboard.execute(userId);
  }
}
