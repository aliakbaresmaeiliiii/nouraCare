import { Injectable } from '@nestjs/common';
import { buildRuleBasedDailyInsight } from '../../utils/cycle-daily-insight.util';
import { utcMidnightFromDate } from '../../utils/cycle-prediction.util';
import { CycleCalculatorService } from '../domain/cycle-calculator.service';
import { CyclePhaseService } from '../domain/cycle-phase.service';
import { CycleRepository } from '../infrastructure/persistence/cycle.repository';
import { CycleDashboardPayload, DailyInsightContext } from '../types/cycle-dashboard.types';
import { GetDailyInsightUseCase } from './get-daily-insight.usecase';

const NO_PERIOD_INSIGHT =
  'Log your last period start to unlock predictions and adaptive tuning.';

@Injectable()
export class GetCycleDashboardUseCase {
  constructor(
    private readonly cycleRepository: CycleRepository,
    private readonly cycleCalculator: CycleCalculatorService,
    private readonly cyclePhaseService: CyclePhaseService,
    private readonly getDailyInsight: GetDailyInsightUseCase,
  ) {}

  async execute(userId: number, now: Date = new Date()): Promise<CycleDashboardPayload> {
    const raw = await this.cycleRepository.loadRawData(userId);
    const computed = this.cycleCalculator.computeFromRawData(raw, now);

    if (!computed.lastStart || !computed.personalized) {
      const phaseGuide = this.cyclePhaseService.buildPhaseGuide({
        cycleDay: null,
        avgBleed: computed.avgBleed,
        cycleLength: computed.simpleAvgCycle,
        nextPeriodIso: null,
        ovulationIso: null,
        fertileWindow: null,
        prePeriodPattern: false,
        ovulationPattern: false,
        gradualChangeDetected: false,
        confidence: 0.18,
        today: now,
      });

      return {
        nextPeriod: null,
        cycleLength: computed.simpleAvgCycle,
        cycleDay: null,
        ovulationDate: null,
        fertileWindow: null,
        confidence: 0.18,
        avgCycleLength: computed.simpleAvgCycle,
        avgPeriodLength: computed.avgBleed,
        insight: NO_PERIOD_INSIGHT,
        phaseGuide,
        tips: phaseGuide.cards.map((c) => c.body),
      };
    }

    const { personalized, confidence, configuredCycleLength, lastStart, storedCycleLength } =
      computed;

    await this.cycleRepository.savePredictionSnapshot(userId, {
      lastStart,
      storedCycleLength,
      effectiveCycleLength: personalized.effectiveCycleLength,
      nextPeriodIso: personalized.nextPeriodIso,
    });

    const phaseGuide = this.cyclePhaseService.buildPhaseGuide({
      cycleDay: computed.cycleDay,
      avgBleed: computed.avgBleed,
      cycleLength: configuredCycleLength,
      nextPeriodIso: personalized.nextPeriodIso,
      ovulationIso: personalized.ovulationIso,
      fertileWindow: personalized.fertileWindow,
      prePeriodPattern: personalized.offsets.prePeriodPattern,
      ovulationPattern: personalized.offsets.ovulationPattern,
      gradualChangeDetected: personalized.offsets.gradualChangeDetected,
      confidence,
      today: now,
    });

    const ruleBasedInsight = buildRuleBasedDailyInsight({
      phase: phaseGuide.phase,
      cycleDay: computed.cycleDay ?? 0,
      periodDay: phaseGuide.context.periodDay,
      avgBleed: computed.avgBleed,
      cycleLength: configuredCycleLength,
      daysToNextPeriod: phaseGuide.context.daysToNextPeriod,
      daysToOvulation: phaseGuide.context.daysToOvulation,
      prePeriodPattern: personalized.offsets.prePeriodPattern,
      ovulationPattern: personalized.offsets.ovulationPattern,
    });

    const insightContext: DailyInsightContext = {
      cycleDay: computed.cycleDay,
      periodDay: phaseGuide.context.periodDay,
      phase: phaseGuide.phase,
      avgCycleLength: Math.round(personalized.effectiveCycleLength),
      avgPeriodLength: computed.avgBleed,
      confidence,
      daysToNextPeriod: phaseGuide.context.daysToNextPeriod,
      daysToOvulation: phaseGuide.context.daysToOvulation,
      prePeriodPattern: personalized.offsets.prePeriodPattern,
      ovulationPattern: personalized.offsets.ovulationPattern,
      ruleBasedInsight,
    };

    const { insight } = await this.getDailyInsight.execute({
      userId,
      context: insightContext,
      referenceDate: now,
    });

    const nextPeriodDate = utcMidnightFromDate(
      new Date(`${personalized.nextPeriodIso}T00:00:00.000Z`),
    );

    return {
      nextPeriod: nextPeriodDate,
      cycleLength: configuredCycleLength,
      cycleDay: computed.cycleDay,
      ovulationDate: personalized.ovulationIso,
      fertileWindow: personalized.fertileWindow,
      confidence,
      avgCycleLength: Math.round(personalized.effectiveCycleLength),
      avgPeriodLength: computed.avgBleed,
      insight,
      phaseGuide,
      tips: phaseGuide.cards.map((c) => c.body),
    };
  }
}
