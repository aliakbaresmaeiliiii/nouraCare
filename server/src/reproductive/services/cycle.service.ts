import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';
import { calendarDaysBetweenUtc } from '../utils/pregnancy-metrics.util';
import {
  buildFloStylePrediction,
  clamp,
  dedupeSortedPeriodStarts,
  inferCycleLengthsFromSortedStarts,
  mean,
  pickLatestPeriodStartOnOrBefore,
  utcMidnightFromDate,
} from '../utils/cycle-prediction.util';
import {
  buildPersonalizedSchedule,
  parsePredictionErrors,
  pushPredictionErrorFifo,
} from '../utils/cycle-personalization.util';
import {
  buildCyclePhaseGuide,
  CyclePhaseGuidePayload,
} from '../utils/cycle-phase-guide.util';

export interface CycleDashboardPayload {
  nextPeriod: Date | null;
  cycleLength: number | null;
  cycleDay: number | null;
  ovulationDate: string | null;
  fertileWindow: { start: string; end: string } | null;
  confidence: number;
  avgCycleLength: number;
  avgPeriodLength: number;
  insight: string;
  phaseGuide: CyclePhaseGuidePayload;
  tips: string[];
}

@Injectable()
export class CycleService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertCycleData(
    tx: PrismaService | any,
    userId: number,
    payload: { lastPeriodDate?: string; cycleLength?: number },
  ) {
    const now = new Date();
    const prev = await tx.cycle_data.findUnique({ where: { userId } });

    let predictionErrors = parsePredictionErrors(prev?.predictionErrors);
    let adaptiveCycleLength =
      prev?.adaptiveCycleLength != null && Number.isFinite(prev.adaptiveCycleLength)
        ? prev.adaptiveCycleLength
        : null;

    if (payload.lastPeriodDate && prev?.lastPeriodDate && prev.lastPredictedNextPeriodIso) {
      const newD = utcMidnightFromDate(new Date(payload.lastPeriodDate));
      const oldD = utcMidnightFromDate(prev.lastPeriodDate);
      if (newD.getTime() > oldD.getTime()) {
        const pred = utcMidnightFromDate(
          new Date(`${prev.lastPredictedNextPeriodIso}T00:00:00.000Z`),
        );
        const err = calendarDaysBetweenUtc(pred, newD);
        if (Number.isFinite(err) && Math.abs(err) <= 18) {
          predictionErrors = pushPredictionErrorFifo(predictionErrors, err);
          const base = prev.cycleLength ?? 28;
          adaptiveCycleLength = clamp((adaptiveCycleLength ?? base) + err * 0.2, 21, 45);
        }
      }
    }

    const errorsJson =
      predictionErrors.length > 0 ? (predictionErrors as Prisma.InputJsonValue) : Prisma.DbNull;

    await tx.cycle_data.upsert({
      where: { userId },
      create: {
        userId,
        lastPeriodDate: payload.lastPeriodDate ? new Date(payload.lastPeriodDate) : null,
        cycleLength: payload.cycleLength ?? 28,
        adaptiveCycleLength,
        predictionErrors: errorsJson === Prisma.DbNull ? undefined : errorsJson,
        lastPredictedNextPeriodIso: null,
        updatedAt: now,
      },
      update: {
        ...(payload.lastPeriodDate !== undefined && {
          lastPeriodDate: payload.lastPeriodDate ? new Date(payload.lastPeriodDate) : null,
        }),
        ...(payload.cycleLength !== undefined && { cycleLength: payload.cycleLength }),
        adaptiveCycleLength,
        predictionErrors: errorsJson,
        updatedAt: now,
      },
    });
  }

  /**
   * Cycle prediction + adaptive personalization (errors, weighted cycles, symptoms, trend).
   * Persists `lastPredictedNextPeriodIso` for future error tracking when a new period is logged.
   */
  async getDashboardData(userId: number): Promise<CycleDashboardPayload> {
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
        where: {
          userId,
          date: { gte: since },
        },
        select: { date: true, symptoms: true },
        orderBy: { date: 'desc' },
        take: 200,
      }),
    ]);

    const defaultBleed = onboarding?.periodDuration ?? 5;
    const predictionErrors = parsePredictionErrors(cycle?.predictionErrors);
    const adaptiveCycleLength =
      cycle?.adaptiveCycleLength != null && Number.isFinite(cycle.adaptiveCycleLength)
        ? cycle.adaptiveCycleLength
        : null;

    const logStarts = logs.map((l) => l.lastPeriodDate);
    const fromCycle = cycle?.lastPeriodDate ? [cycle.lastPeriodDate] : [];
    const mergedStarts = dedupeSortedPeriodStarts([...logStarts, ...fromCycle]);

    const lengths = inferCycleLengthsFromSortedStarts(mergedStarts);
    let simpleAvgCycle = 28;
    const storedCycleLength =
      cycle?.cycleLength != null && Number.isFinite(cycle.cycleLength)
        ? Math.round(cycle.cycleLength)
        : null;
    if (
      storedCycleLength != null &&
      storedCycleLength >= 21 &&
      storedCycleLength <= 60
    ) {
      // Explicit user cycle length in cycle_data wins over sparse log inference.
      simpleAvgCycle = storedCycleLength;
    } else {
      let fromLogs = Math.round(mean(lengths));
      if (!lengths.length || !Number.isFinite(fromLogs) || fromLogs < 21 || fromLogs > 45) {
        fromLogs = Math.round(cycle?.cycleLength ?? 28);
        fromLogs = Math.max(21, Math.min(45, fromLogs));
      }
      simpleAvgCycle = fromLogs;
    }

    const bleedSamples: number[] = [];
    for (const l of logs) {
      if (l.averagePeriodDuration != null && l.averagePeriodDuration >= 2 && l.averagePeriodDuration <= 10) {
        bleedSamples.push(l.averagePeriodDuration);
      }
    }
    let avgBleed = Math.round(mean(bleedSamples));
    if (!bleedSamples.length || !Number.isFinite(avgBleed)) {
      avgBleed = defaultBleed;
    }
    avgBleed = Math.max(2, Math.min(10, avgBleed));

    const lastStart = pickLatestPeriodStartOnOrBefore(mergedStarts, new Date());
    if (!lastStart) {
      const phaseGuide = buildCyclePhaseGuide({
        cycleDay: null,
        avgBleed,
        cycleLength: simpleAvgCycle,
        nextPeriodIso: null,
        ovulationIso: null,
        fertileWindow: null,
        prePeriodPattern: false,
        ovulationPattern: false,
        gradualChangeDetected: false,
        confidence: 0.18,
      });
      return {
        nextPeriod: null,
        cycleLength: simpleAvgCycle,
        cycleDay: null,
        ovulationDate: null,
        fertileWindow: null,
        confidence: 0.18,
        avgCycleLength: simpleAvgCycle,
        avgPeriodLength: avgBleed,
        insight: 'Log your last period start to unlock predictions and adaptive tuning.',
        phaseGuide,
        tips: phaseGuide.cards.map((c) => c.body),
      };
    }

    const basePred = buildFloStylePrediction(
      lastStart,
      simpleAvgCycle,
      avgBleed,
      lengths,
      trackDays,
      new Date(),
    );

    const personalized = buildPersonalizedSchedule(
      {
        lastPeriodStart: lastStart,
        cycleLengths: lengths,
        sortedPeriodStartsAsc: mergedStarts,
        trackRows: trackDays,
        predictionErrors,
        adaptiveCycleLength,
        fallbackCycleLength: simpleAvgCycle,
        avgBleed,
      },
      basePred.confidence,
    );

    const confidence =
      Math.round((0.4 * basePred.confidence + 0.6 * personalized.confidence) * 100) / 100;

    const nextPeriodDate = utcMidnightFromDate(
      new Date(`${personalized.nextPeriodIso}T00:00:00.000Z`),
    );

    await this.prisma.cycle_data.upsert({
      where: { userId },
      create: {
        userId,
        lastPeriodDate: lastStart,
        cycleLength:
          storedCycleLength ?? Math.round(personalized.effectiveCycleLength),
        lastPredictedNextPeriodIso: personalized.nextPeriodIso,
        updatedAt: new Date(),
      },
      update: {
        lastPredictedNextPeriodIso: personalized.nextPeriodIso,
        updatedAt: new Date(),
      },
    });

    const configuredCycleLength =
      storedCycleLength ?? Math.round(personalized.effectiveCycleLength);

    const phaseGuide = buildCyclePhaseGuide({
      cycleDay: basePred.cycleDay,
      avgBleed,
      cycleLength: configuredCycleLength,
      nextPeriodIso: personalized.nextPeriodIso,
      ovulationIso: personalized.ovulationIso,
      fertileWindow: personalized.fertileWindow,
      prePeriodPattern: personalized.offsets.prePeriodPattern,
      ovulationPattern: personalized.offsets.ovulationPattern,
      gradualChangeDetected: personalized.offsets.gradualChangeDetected,
      confidence,
    });

    return {
      nextPeriod: nextPeriodDate,
      /** User-configured cycle length (ring UI); not the adaptive prediction blend. */
      cycleLength: configuredCycleLength,
      cycleDay: basePred.cycleDay,
      ovulationDate: personalized.ovulationIso,
      fertileWindow: personalized.fertileWindow,
      confidence,
      avgCycleLength: Math.round(personalized.effectiveCycleLength),
      avgPeriodLength: avgBleed,
      insight: personalized.insight,
      phaseGuide,
      tips: phaseGuide.cards.map((c) => c.body),
    };
  }
}
