import { calendarDaysBetweenUtc } from './pregnancy-metrics.util';
import {
  addCalendarDays,
  classifySymptomsText,
  clamp,
  mean,
  standardDeviation,
  toIsoDateOnly,
  utcMidnightFromDate,
  widenFertileForIrregular,
} from './cycle-prediction.util';

export interface TrackRow {
  date: Date;
  symptoms: string | null;
}

export interface PersonalizationInput {
  lastPeriodStart: Date;
  /** Oldest → newest gaps between period starts (21–45d). */
  cycleLengths: number[];
  /** Ascending unique period start dates (includes current LMP). */
  sortedPeriodStartsAsc: Date[];
  trackRows: TrackRow[];
  /** FIFO newest at end, max 5; actualStart − predictedStart (days). */
  predictionErrors: number[];
  adaptiveCycleLength: number | null;
  fallbackCycleLength: number;
  avgBleed: number;
}

export interface PersonalizationOffsets {
  trendDays: number;
  symptomDays: number;
  errorCorrectionDays: number;
  prePeriodPattern: boolean;
  ovulationPattern: boolean;
  gradualChangeDetected: boolean;
}

/** Weighted mean: recent cycles (end of array) weigh more. */
export function weightedMeanCycleLengths(lengths: number[]): number {
  if (!lengths.length) {
    return 28;
  }
  const n = lengths.length;
  let sw = 0;
  let sv = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.pow(1.42, i);
    sw += w;
    sv += w * lengths[i];
  }
  return sv / sw;
}

/** Project mild drift from gradual cycle length change (heuristic slope). */
export function trendDaysFromCycleLengths(lengths: number[]): number {
  if (lengths.length < 3) {
    return 0;
  }
  const m = lengths.length;
  const avg = mean(lengths);
  let num = 0;
  let den = 0;
  const xMean = (m - 1) / 2;
  for (let i = 0; i < m; i++) {
    const xd = i - xMean;
    num += xd * (lengths[i] - avg);
    den += xd * xd;
  }
  const slope = den > 1e-6 ? num / den : 0;
  const gradual = Math.abs(slope) > 0.35;
  if (!gradual) {
    return 0;
  }
  return clamp(slope * 0.55, -3.25, 3.25);
}

const PRE_PERIOD_KEYS = ['bloat', 'pms', 'cramp', 'breast tender', 'mood swing', 'irritable', 'spotting'];

function symptomsTextPrePeriod(symptoms: string | null | undefined): boolean {
  if (!symptoms) {
    return false;
  }
  const s = symptoms.toLowerCase();
  return PRE_PERIOD_KEYS.some((k) => s.includes(k));
}

/**
 * Recurring symptoms 1–7 days before prior period starts (up to 3 cycles before current).
 */
export function detectRecurringPrePeriodSymptoms(
  sortedStartsAsc: Date[],
  trackRows: TrackRow[],
): boolean {
  if (sortedStartsAsc.length < 3) {
    return false;
  }
  const starts = sortedStartsAsc.map(utcMidnightFromDate);
  const candidates = starts.slice(0, -1).slice(-3);
  let hits = 0;
  for (const start of candidates) {
    const hit = trackRows.some((row) => {
      const t = utcMidnightFromDate(row.date);
      const daysBefore = calendarDaysBetweenUtc(t, start);
      if (daysBefore < 1 || daysBefore > 7) {
        return false;
      }
      return symptomsTextPrePeriod(row.symptoms);
    });
    if (hit) {
      hits++;
    }
  }
  return hits >= 2;
}

/** Multiple ovulation-like logs → discharge / LH style pattern. */
export function detectOvulationIndicatorPattern(trackRows: TrackRow[]): boolean {
  const hits = trackRows.filter((r) => classifySymptomsText(r.symptoms) === 'ovulation_like');
  return hits.length >= 2;
}

export function symptomDayAdjustments(
  prePeriodPattern: boolean,
  ovulationPattern: boolean,
): number {
  let d = 0;
  if (prePeriodPattern) {
    d += 0.35;
  }
  if (ovulationPattern) {
    d -= 0.45;
  }
  return clamp(d, -1.4, 1.4);
}

/** Higher weight on more recent errors (end of array). */
export function weightedErrorCorrectionDays(errors: number[]): number {
  if (!errors.length) {
    return 0;
  }
  const n = errors.length;
  let sw = 0;
  let sv = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.pow(1.5, i);
    sw += w;
    sv += w * errors[i];
  }
  const avgErr = sv / sw;
  return clamp(avgErr * 0.35, -4.25, 4.25);
}

export function combinedEffectiveCycleLength(
  weightedCycle: number,
  adaptive: number | null,
): number {
  const base = weightedCycle;
  const adapt = adaptive ?? base;
  return clamp(0.62 * base + 0.38 * adapt, 21, 45);
}

export function personalizedConfidence(
  cycleLengths: number[],
  predictionErrors: number[],
  baseConfidence: number,
): number {
  const cv = cycleLengths.length >= 2 ? standardDeviation(cycleLengths) : 6;
  const errPenalty =
    predictionErrors.length > 0
      ? mean(predictionErrors.map((e) => Math.abs(e))) / 18
      : 0;
  const c = baseConfidence - errPenalty * 0.22 - Math.min(0.18, cv / 25);
  return Math.round(clamp(c, 0.12, 0.96) * 100) / 100;
}

export function buildPersonalizedInsight(
  offsets: PersonalizationOffsets,
  weightedCycle: number,
  errAvg: number,
): string {
  const parts: string[] = [];
  if (offsets.gradualChangeDetected) {
    parts.push(
      'Your recent cycle lengths show a gentle drift; the next prediction includes a small trend adjustment.',
    );
  }
  if (offsets.prePeriodPattern) {
    parts.push(
      'You often log similar symptoms a few days before your period—treating that as a soft pattern alongside dates.',
    );
  }
  if (offsets.ovulationPattern) {
    parts.push(
      'Ovulation-style notes (discharge, LH, etc.) show up in your logs; fertile timing is nudged slightly.',
    );
  }
  if (Math.abs(errAvg) >= 0.75 && Math.abs(offsets.errorCorrectionDays) > 0.05) {
    parts.push(
      `Past predictions were off by about ${Math.abs(errAvg).toFixed(1)} days on average; a light correction is applied.`,
    );
  }
  if (!parts.length) {
    return `Using a ~${Math.round(weightedCycle)}-day cycle with adaptive tracking—log period starts to improve accuracy over time.`;
  }
  return parts.join(' ');
}

export interface PersonalizedDates {
  nextPeriodIso: string;
  ovulationIso: string;
  fertileWindow: { start: string; end: string };
  confidence: number;
  insight: string;
  effectiveCycleLength: number;
  offsets: PersonalizationOffsets;
}

export function buildPersonalizedSchedule(
  input: PersonalizationInput,
  baseConfidence: number,
): PersonalizedDates {
  const lp = utcMidnightFromDate(input.lastPeriodStart);
  const weighted = weightedMeanCycleLengths(input.cycleLengths);
  if (!input.cycleLengths.length) {
    const fb = clamp(input.fallbackCycleLength, 21, 45);
    const effective = combinedEffectiveCycleLength(fb, input.adaptiveCycleLength);
    const trend = 0;
    const prePeriod = detectRecurringPrePeriodSymptoms(input.sortedPeriodStartsAsc, input.trackRows);
    const ovPat = detectOvulationIndicatorPattern(input.trackRows);
    const symptom = symptomDayAdjustments(prePeriod, ovPat);
    const errCorr = weightedErrorCorrectionDays(input.predictionErrors);
    const totalDayOffset = Math.round(trend + symptom + errCorr);
    const nextP = addCalendarDays(lp, Math.round(effective) + totalDayOffset);
    const ovulation = addCalendarDays(nextP, -14);
    const std = 0;
    const widen = widenFertileForIrregular(std);
    const fwStart = addCalendarDays(ovulation, -5 - widen);
    const fwEnd = addCalendarDays(ovulation, 1 + widen);
    const errAvg = input.predictionErrors.length ? mean(input.predictionErrors) : 0;
    const confidence = personalizedConfidence([effective], input.predictionErrors, baseConfidence);
    const offsets: PersonalizationOffsets = {
      trendDays: 0,
      symptomDays: symptom,
      errorCorrectionDays: errCorr,
      prePeriodPattern: prePeriod,
      ovulationPattern: ovPat,
      gradualChangeDetected: false,
    };
    return {
      nextPeriodIso: toIsoDateOnly(nextP),
      ovulationIso: toIsoDateOnly(ovulation),
      fertileWindow: { start: toIsoDateOnly(fwStart), end: toIsoDateOnly(fwEnd) },
      confidence,
      insight: buildPersonalizedInsight(offsets, weighted, errAvg),
      effectiveCycleLength: Math.round(effective * 10) / 10,
      offsets,
    };
  }

  const effective = combinedEffectiveCycleLength(weighted, input.adaptiveCycleLength);
  const prePeriod = detectRecurringPrePeriodSymptoms(input.sortedPeriodStartsAsc, input.trackRows);
  const ovPat = detectOvulationIndicatorPattern(input.trackRows);
  const trend = trendDaysFromCycleLengths(input.cycleLengths);
  const symptom = symptomDayAdjustments(prePeriod, ovPat);
  const errCorr = weightedErrorCorrectionDays(input.predictionErrors);
  const gradualChangeDetected = input.cycleLengths.length >= 3 && Math.abs(trend) > 0.05;

  const totalDayOffset = Math.round(trend + symptom + errCorr);
  const nextP = addCalendarDays(lp, Math.round(effective) + totalDayOffset);
  const ovulation = addCalendarDays(nextP, -14);
  const std = standardDeviation(input.cycleLengths);
  const widen = widenFertileForIrregular(std);
  const fwStart = addCalendarDays(ovulation, -5 - widen);
  const fwEnd = addCalendarDays(ovulation, 1 + widen);

  const errAvg = input.predictionErrors.length ? mean(input.predictionErrors) : 0;
  const confidence = personalizedConfidence(input.cycleLengths, input.predictionErrors, baseConfidence);

  const offsets: PersonalizationOffsets = {
    trendDays: trend,
    symptomDays: symptom,
    errorCorrectionDays: errCorr,
    prePeriodPattern: prePeriod,
    ovulationPattern: ovPat,
    gradualChangeDetected,
  };

  return {
    nextPeriodIso: toIsoDateOnly(nextP),
    ovulationIso: toIsoDateOnly(ovulation),
    fertileWindow: { start: toIsoDateOnly(fwStart), end: toIsoDateOnly(fwEnd) },
    confidence,
    insight: buildPersonalizedInsight(offsets, weighted, errAvg),
    effectiveCycleLength: Math.round(effective * 10) / 10,
    offsets,
  };
}

export function parsePredictionErrors(raw: unknown): number[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
    .map((x) => Math.round(x))
    .slice(-5);
}

export function pushPredictionErrorFifo(prev: number[], err: number, max = 5): number[] {
  const next = [...prev, Math.round(err)];
  return next.slice(-max);
}
