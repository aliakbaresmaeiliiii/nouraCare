import type { FertilityResults } from '../components/fertility-results-modal/fertility-results-modal.component';
import {
  formatCyclePhaseShortDate,
  formatHistoryDayDate,
} from './locale-date-format.util';

export type FertilityPhase =
  | 'period'
  | 'follicular'
  | 'fertile'
  | 'ovulation_peak'
  | 'luteal';

export interface FertilityDayEntry {
  date: Date;
  formatted: string;
  isPeak: boolean;
  isToday: boolean;
  isPast: boolean;
}

export type FertilityChartPhase = 'period' | 'follicular' | 'fertile' | 'luteal';

export interface FertilityChartPoint {
  cycleDay: number;
  chancePercent: number;
  phase: FertilityChartPhase;
}

/** Relative conception chance (0–100) for chart display — educational estimate only. */
export function fertilityChancePercentForDay(
  cycleDay: number,
  periodLength: number,
  ovulationCycleDay: number,
  fertileStartCycleDay: number,
  fertileEndCycleDay: number,
): number {
  if (cycleDay <= periodLength) {
    return 8 + (cycleDay / Math.max(1, periodLength)) * 6;
  }
  if (cycleDay < fertileStartCycleDay) {
    const span = Math.max(1, fertileStartCycleDay - periodLength - 1);
    const t = (cycleDay - periodLength) / span;
    return 14 + t * 36;
  }
  if (cycleDay < ovulationCycleDay) {
    const span = Math.max(1, ovulationCycleDay - fertileStartCycleDay);
    const t = (cycleDay - fertileStartCycleDay) / span;
    return 50 + t * 35;
  }
  if (cycleDay === ovulationCycleDay) {
    return 100;
  }
  if (cycleDay <= fertileEndCycleDay) {
    const span = Math.max(1, fertileEndCycleDay - ovulationCycleDay);
    const t = (cycleDay - ovulationCycleDay) / span;
    return 100 - t * 28;
  }
  const dist = cycleDay - fertileEndCycleDay;
  return Math.max(8, 72 - dist * 9);
}

export function getFertilityChartPhase(
  cycleDay: number,
  periodLength: number,
  fertileStartCycleDay: number,
  fertileEndCycleDay: number,
): FertilityChartPhase {
  if (cycleDay <= periodLength) return 'period';
  if (cycleDay <= fertileEndCycleDay) {
    return cycleDay < fertileStartCycleDay ? 'follicular' : 'fertile';
  }
  return 'luteal';
}

export function buildFertilityChartPoints(
  cycleLength: number,
  periodLength: number,
  ovulationCycleDay: number,
  fertileStartCycleDay: number,
  fertileEndCycleDay: number,
): FertilityChartPoint[] {
  const points: FertilityChartPoint[] = [];
  for (let day = 1; day <= cycleLength; day++) {
    points.push({
      cycleDay: day,
      chancePercent: Math.round(
        fertilityChancePercentForDay(
          day,
          periodLength,
          ovulationCycleDay,
          fertileStartCycleDay,
          fertileEndCycleDay,
        ),
      ),
      phase: getFertilityChartPhase(
        day,
        periodLength,
        fertileStartCycleDay,
        fertileEndCycleDay,
      ),
    });
  }
  return points;
}

export interface FertilityOverviewData {
  cycleLength: number;
  periodLength: number;
  currentCycleDay: number;
  phase: FertilityPhase;
  fertileDays: FertilityDayEntry[];
  ovulationDate: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
  nextPeriodDate: Date;
  lastPeriodDate: Date;
  timelineTodayPercent: number;
  ovulationCycleDay: number;
  fertileStartCycleDay: number;
  fertileEndCycleDay: number;
  results: FertilityResults;
}

function parseLocalIso(iso: string): Date {
  const clean = iso.includes('T') ? iso.split('T')[0] : iso.slice(0, 10);
  const parts = clean.split('-').map((p) => Number(p));
  if (parts.length === 3 && !parts.some((n) => Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(clean);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function diffDays(a: Date, b: Date): number {
  return Math.floor(
    (startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000,
  );
}

export function computeFertilityOverview(
  lastPeriodIso: string,
  cycleLength: number,
  periodLength: number,
  languageCode: string,
  referenceDate: Date = new Date(),
): FertilityOverviewData {
  const len = Math.max(21, Math.min(45, cycleLength || 28));
  const plen = Math.max(1, Math.min(14, periodLength || 5));
  const lastPeriodDate = startOfDay(parseLocalIso(lastPeriodIso));
  const today = startOfDay(referenceDate);

  const currentCycleDay = Math.max(1, diffDays(today, lastPeriodDate) + 1);
  const ovulationCycleDay = Math.max(plen + 1, len - 14);
  const fertileStartCycleDay = Math.max(plen + 1, ovulationCycleDay - 5);
  const fertileEndCycleDay = ovulationCycleDay + 1;

  const ovulationDate = addDays(lastPeriodDate, ovulationCycleDay - 1);
  const fertileWindowStart = addDays(lastPeriodDate, fertileStartCycleDay - 1);
  const fertileWindowEnd = addDays(lastPeriodDate, fertileEndCycleDay - 1);
  const nextPeriodDate = addDays(lastPeriodDate, len);

  let phase: FertilityPhase = 'luteal';
  if (currentCycleDay <= plen) phase = 'period';
  else if (currentCycleDay < fertileStartCycleDay) phase = 'follicular';
  else if (currentCycleDay === ovulationCycleDay) phase = 'ovulation_peak';
  else if (currentCycleDay >= fertileStartCycleDay && currentCycleDay <= fertileEndCycleDay)
    phase = 'fertile';
  else if (currentCycleDay < ovulationCycleDay) phase = 'follicular';

  const fertileDays: FertilityDayEntry[] = [];
  let cursor = new Date(fertileWindowStart);
  while (cursor <= fertileWindowEnd) {
    const isPeak =
      diffDays(cursor, ovulationDate) === 0 ||
      diffDays(cursor, ovulationDate) === -1;
    fertileDays.push({
      date: new Date(cursor),
      formatted: formatCyclePhaseShortDate(cursor, languageCode),
      isPeak,
      isToday: diffDays(cursor, today) === 0,
      isPast: diffDays(cursor, today) < 0,
    });
    cursor = addDays(cursor, 1);
  }

  const formatDate = (date: Date) => formatHistoryDayDate(date, languageCode);

  const results: FertilityResults = {
    fertileDays: fertileDays.map((d) => formatDate(d.date)),
    ovulationDay: formatDate(ovulationDate),
    nextPeriod: formatDate(nextPeriodDate),
    cycleLength: len,
    lastPeriodDate: formatDate(lastPeriodDate),
  };

  const timelineTodayPercent = Math.min(
    100,
    Math.max(0, ((currentCycleDay - 1) / len) * 100),
  );

  return {
    cycleLength: len,
    periodLength: plen,
    currentCycleDay,
    phase,
    fertileDays,
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    nextPeriodDate,
    lastPeriodDate,
    timelineTodayPercent,
    ovulationCycleDay,
    fertileStartCycleDay,
    fertileEndCycleDay,
    results,
  };
}
