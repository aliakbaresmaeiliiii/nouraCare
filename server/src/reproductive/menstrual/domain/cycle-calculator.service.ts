import { Injectable } from '@nestjs/common';
import { calendarDaysBetweenUtc } from '../../utils/pregnancy-metrics.util';
import {
  buildFloStylePrediction,
  clamp,
  dedupeSortedPeriodStarts,
  inferCycleLengthsFromSortedStarts,
  mean,
  pickLatestPeriodStartOnOrBefore,
  utcMidnightFromDate,
} from '../../utils/cycle-prediction.util';
import {
  buildPersonalizedSchedule,
  parsePredictionErrors,
  pushPredictionErrorFifo,
  PersonalizedDates,
} from '../../utils/cycle-personalization.util';
import { CycleRawData } from '../infrastructure/persistence/cycle.repository';

export interface CycleComputationResult {
  cycleDay: number | null;
  avgBleed: number;
  simpleAvgCycle: number;
  storedCycleLength: number | null;
  lengths: number[];
  lastStart: Date | null;
  mergedStarts: Date[];
  predictionErrors: number[];
  adaptiveCycleLength: number | null;
  basePrediction: ReturnType<typeof buildFloStylePrediction>;
  personalized: PersonalizedDates | null;
  confidence: number;
  configuredCycleLength: number;
}

/**
 * Pure: cycle day 1 = first day of bleeding (LMP), inclusive.
 */
export function calculateCycleDay(
  lastPeriodStart: Date | null,
  referenceDate: Date = new Date(),
): number | null {
  if (!lastPeriodStart) {
    return null;
  }
  const lp = utcMidnightFromDate(lastPeriodStart);
  const today = utcMidnightFromDate(referenceDate);
  return Math.max(1, calendarDaysBetweenUtc(lp, today) + 1);
}

@Injectable()
export class CycleCalculatorService {
  /**
   * Derive adaptive cycle length when a new period start is logged after a prediction.
   */
  computeAdaptiveOnNewPeriod(
    prev: {
      lastPeriodDate: Date | null;
      lastPredictedNextPeriodIso: string | null;
      cycleLength: number | null;
      adaptiveCycleLength: number | null;
      predictionErrors: unknown;
    } | null,
    newLastPeriodDate: string,
  ): { predictionErrors: number[]; adaptiveCycleLength: number | null } {
    let predictionErrors = parsePredictionErrors(prev?.predictionErrors);
    let adaptiveCycleLength =
      prev?.adaptiveCycleLength != null && Number.isFinite(prev.adaptiveCycleLength)
        ? prev.adaptiveCycleLength
        : null;

    if (newLastPeriodDate && prev?.lastPeriodDate && prev?.lastPredictedNextPeriodIso) {
      const newD = utcMidnightFromDate(new Date(newLastPeriodDate));
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

    return { predictionErrors, adaptiveCycleLength };
  }

  /**
   * Full cycle prediction pipeline from raw repository data.
   */
  computeFromRawData(raw: CycleRawData, now: Date = new Date()): CycleComputationResult {
    const defaultBleed = raw.onboardingPeriodDuration ?? 5;
    const predictionErrors = parsePredictionErrors(raw.cycle?.predictionErrors);
    const adaptiveCycleLength =
      raw.cycle?.adaptiveCycleLength != null && Number.isFinite(raw.cycle.adaptiveCycleLength)
        ? raw.cycle.adaptiveCycleLength
        : null;

    const logStarts = raw.logs.map((l) => l.lastPeriodDate);
    const fromCycle = raw.cycle?.lastPeriodDate ? [raw.cycle.lastPeriodDate] : [];
    const mergedStarts = dedupeSortedPeriodStarts([...logStarts, ...fromCycle]);
    const lengths = inferCycleLengthsFromSortedStarts(mergedStarts);

    let simpleAvgCycle = 28;
    const storedCycleLength =
      raw.cycle?.cycleLength != null && Number.isFinite(raw.cycle.cycleLength)
        ? Math.round(raw.cycle.cycleLength)
        : null;

    if (storedCycleLength != null && storedCycleLength >= 21 && storedCycleLength <= 60) {
      simpleAvgCycle = storedCycleLength;
    } else {
      let fromLogs = Math.round(mean(lengths));
      if (!lengths.length || !Number.isFinite(fromLogs) || fromLogs < 21 || fromLogs > 45) {
        fromLogs = Math.round(raw.cycle?.cycleLength ?? 28);
        fromLogs = Math.max(21, Math.min(45, fromLogs));
      }
      simpleAvgCycle = fromLogs;
    }

    const bleedSamples: number[] = [];
    for (const l of raw.logs) {
      if (
        l.averagePeriodDuration != null &&
        l.averagePeriodDuration >= 2 &&
        l.averagePeriodDuration <= 10
      ) {
        bleedSamples.push(l.averagePeriodDuration);
      }
    }
    let avgBleed = Math.round(mean(bleedSamples));
    if (!bleedSamples.length || !Number.isFinite(avgBleed)) {
      avgBleed = defaultBleed;
    }
    avgBleed = Math.max(2, Math.min(10, avgBleed));

    const lastStart = pickLatestPeriodStartOnOrBefore(mergedStarts, now);
    if (!lastStart) {
      return {
        cycleDay: null,
        avgBleed,
        simpleAvgCycle,
        storedCycleLength,
        lengths,
        lastStart: null,
        mergedStarts,
        predictionErrors,
        adaptiveCycleLength,
        basePrediction: buildFloStylePrediction(null, simpleAvgCycle, avgBleed, lengths, raw.trackDays, now),
        personalized: null,
        confidence: 0.18,
        configuredCycleLength: simpleAvgCycle,
      };
    }

    const basePred = buildFloStylePrediction(
      lastStart,
      simpleAvgCycle,
      avgBleed,
      lengths,
      raw.trackDays,
      now,
    );

    const personalized = buildPersonalizedSchedule(
      {
        lastPeriodStart: lastStart,
        cycleLengths: lengths,
        sortedPeriodStartsAsc: mergedStarts,
        trackRows: raw.trackDays,
        predictionErrors,
        adaptiveCycleLength,
        fallbackCycleLength: simpleAvgCycle,
        avgBleed,
      },
      basePred.confidence,
    );

    const confidence =
      Math.round((0.4 * basePred.confidence + 0.6 * personalized.confidence) * 100) / 100;
    const configuredCycleLength =
      storedCycleLength ?? Math.round(personalized.effectiveCycleLength);

    return {
      cycleDay: basePred.cycleDay,
      avgBleed,
      simpleAvgCycle,
      storedCycleLength,
      lengths,
      lastStart,
      mergedStarts,
      predictionErrors,
      adaptiveCycleLength,
      basePrediction: basePred,
      personalized,
      confidence,
      configuredCycleLength,
    };
  }
}
