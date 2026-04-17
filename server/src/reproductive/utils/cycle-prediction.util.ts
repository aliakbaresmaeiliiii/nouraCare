import { calendarDaysBetweenUtc } from './pregnancy-metrics.util';

export interface FertileWindowRange {
  start: string;
  end: string;
}

export interface CyclePredictionResult {
  cycleDay: number | null;
  nextPeriod: string | null;
  ovulationDate: string | null;
  fertileWindow: FertileWindowRange | null;
  /** 0–1 heuristic; not a medical guarantee. */
  confidence: number;
  avgCycleLength: number;
  avgPeriodLength: number;
}

export function toIsoDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Normalize stored timestamps to UTC calendar midnight for stable diffs. */
export function utcMidnightFromDate(d: Date): Date {
  const [y, m, day] = d.toISOString().split('T')[0].split('-').map((x) => parseInt(x, 10));
  return new Date(Date.UTC(y, m - 1, day));
}

export function addCalendarDays(d: Date, days: number): Date {
  const base = utcMidnightFromDate(d);
  return new Date(base.getTime() + days * 86400000);
}

export function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function standardDeviation(nums: number[]): number {
  if (nums.length < 2) {
    return 0;
  }
  const m = mean(nums);
  return Math.sqrt(mean(nums.map((x) => (x - m) ** 2)));
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Consecutive period starts → inter-cycle lengths; keep biologically plausible gaps only. */
export function inferCycleLengthsFromSortedStarts(sortedStartsAsc: Date[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < sortedStartsAsc.length; i++) {
    const a = utcMidnightFromDate(sortedStartsAsc[i - 1]);
    const b = utcMidnightFromDate(sortedStartsAsc[i]);
    const days = calendarDaysBetweenUtc(a, b);
    if (days >= 21 && days <= 45) {
      out.push(days);
    }
  }
  return out;
}

export function dedupeSortedPeriodStarts(dates: Date[]): Date[] {
  const keys = new Set<string>();
  const out: Date[] = [];
  for (const d of dates) {
    const k = toIsoDateOnly(d);
    if (!keys.has(k)) {
      keys.add(k);
      out.push(utcMidnightFromDate(d));
    }
  }
  out.sort((x, y) => x.getTime() - y.getTime());
  return out;
}

/** Most recent period start that is still on or before `today` (sorted ascending input). */
export function pickLatestPeriodStartOnOrBefore(sortedAsc: Date[], today: Date): Date | null {
  if (!sortedAsc.length) {
    return null;
  }
  const t = utcMidnightFromDate(today);
  let last: Date | null = null;
  for (const d of sortedAsc) {
    const x = utcMidnightFromDate(d);
    if (x.getTime() <= t.getTime()) {
      last = x;
    }
  }
  return last ?? utcMidnightFromDate(sortedAsc[sortedAsc.length - 1]);
}

export function confidenceFromRegularity(
  stdDev: number,
  sampleCount: number,
  usedFallbackCycle: boolean,
): number {
  if (usedFallbackCycle || sampleCount === 0) {
    return 0.36;
  }
  if (sampleCount >= 4) {
    return clamp(0.95 - stdDev / 12, 0.32, 0.94);
  }
  if (sampleCount >= 2) {
    return clamp(0.78 - stdDev / 14, 0.34, 0.88);
  }
  return 0.52;
}

/** Extra days to extend the fertile window on each side when cycles are irregular. */
export function widenFertileForIrregular(stdDev: number): number {
  if (stdDev <= 3) {
    return 0;
  }
  return clamp(Math.round(stdDev / 2), 1, 4);
}

export type SymptomHint = 'ovulation_like' | 'period_like' | 'none';

export function classifySymptomsText(symptoms: string | null | undefined): SymptomHint {
  if (!symptoms) {
    return 'none';
  }
  const s = symptoms.toLowerCase();
  const ov = [
    'ovul',
    'mittelschmerz',
    'lh surge',
    'lh positive',
    'egg white',
    'fertile cm',
    'clearblue',
    'peak fertility',
    'ewcm',
    'cervical mucus',
    'watery discharge',
    'sticky discharge',
  ];
  const pd = ['period', 'menstrual', 'heavy flow', 'day 1 bleed', 'period cramps', 'menstruation'];
  if (ov.some((k) => s.includes(k))) {
    return 'ovulation_like';
  }
  if (pd.some((k) => s.includes(k))) {
    return 'period_like';
  }
  return 'none';
}

export function adjustConfidenceForSymptoms(
  base: number,
  trackRows: { date: Date; symptoms: string | null }[],
  predictedOvulation: Date,
  predictedNextPeriod: Date,
): number {
  let bump = 0;
  const ov = utcMidnightFromDate(predictedOvulation);
  const np = utcMidnightFromDate(predictedNextPeriod);
  for (const row of trackRows) {
    const d = utcMidnightFromDate(row.date);
    const hint = classifySymptomsText(row.symptoms);
    const nearOv = Math.abs(calendarDaysBetweenUtc(d, ov)) <= 2;
    const nearNext = Math.abs(calendarDaysBetweenUtc(d, np)) <= 3;
    if (hint === 'ovulation_like' && nearOv) {
      bump += 0.035;
    }
    if (hint === 'period_like' && nearNext) {
      bump += 0.02;
    }
  }
  return clamp(base + bump, 0.12, 0.97);
}

export function buildFloStylePrediction(
  lastPeriodStart: Date | null,
  avgCycle: number,
  avgBleed: number,
  cycleLengthsSample: number[],
  trackRows: { date: Date; symptoms: string | null }[],
  now: Date = new Date(),
): CyclePredictionResult {
  const safeCycle = clamp(Math.round(avgCycle) || 28, 21, 45);
  const safeBleed = clamp(Math.round(avgBleed) || 5, 2, 10);

  if (!lastPeriodStart) {
    return {
      cycleDay: null,
      nextPeriod: null,
      ovulationDate: null,
      fertileWindow: null,
      confidence: 0.18,
      avgCycleLength: safeCycle,
      avgPeriodLength: safeBleed,
    };
  }

  const lp = utcMidnightFromDate(lastPeriodStart);
  const today = utcMidnightFromDate(now);
  const cycleDay = Math.max(1, calendarDaysBetweenUtc(lp, today) + 1);

  const nextP = addCalendarDays(lp, safeCycle);
  const ovulation = addCalendarDays(nextP, -14);

  const stdDev = standardDeviation(cycleLengthsSample);
  const widen = widenFertileForIrregular(stdDev);
  const fwStart = addCalendarDays(ovulation, -5 - widen);
  const fwEnd = addCalendarDays(ovulation, 1 + widen);

  const usedFallbackCycle = cycleLengthsSample.length === 0;
  const confidenceRaw = confidenceFromRegularity(
    stdDev,
    cycleLengthsSample.length,
    usedFallbackCycle,
  );
  const confidence = adjustConfidenceForSymptoms(confidenceRaw, trackRows, ovulation, nextP);

  return {
    cycleDay,
    nextPeriod: toIsoDateOnly(nextP),
    ovulationDate: toIsoDateOnly(ovulation),
    fertileWindow: { start: toIsoDateOnly(fwStart), end: toIsoDateOnly(fwEnd) },
    confidence: Math.round(confidence * 100) / 100,
    avgCycleLength: safeCycle,
    avgPeriodLength: safeBleed,
  };
}
