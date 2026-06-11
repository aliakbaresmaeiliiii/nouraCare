import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MenstrualController } from './api/menstrual.controller';
import { GetCycleDashboardUseCase } from './application/get-cycle-dashboard.usecase';
import { GetDailyInsightUseCase } from './application/get-daily-insight.usecase';
import { CycleCalculatorService } from './domain/cycle-calculator.service';
import { CyclePhaseService } from './domain/cycle-phase.service';
import { PeriodAiService } from './infrastructure/ai/period-ai.service';
import { CycleRepository } from './infrastructure/persistence/cycle.repository';
import { InsightRepository } from './infrastructure/persistence/insight.repository';

@Module({
  imports: [PrismaModule],
  controllers: [MenstrualController],
  providers: [
    CycleCalculatorService,
    CyclePhaseService,
    CycleRepository,
    InsightRepository,
    PeriodAiService,
    GetDailyInsightUseCase,
    GetCycleDashboardUseCase,
  ],
  exports: [GetCycleDashboardUseCase, GetDailyInsightUseCase, CycleCalculatorService, CycleRepository],
})
export class MenstrualModule {}
