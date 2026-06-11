import { calendarDaysBetweenUtc } from '../../utils/pregnancy-metrics.util';
import { utcMidnightFromDate } from '../../utils/cycle-prediction.util';

/** API-facing phase labels (fertile = ovulation window for backward compatibility). */
export type CyclePhase = 'none' | 'period' | 'follicular' | 'fertile' | 'luteal';

export interface DeterminePhaseInput {
  cycleDay: number;
  avgBleed: number;
  cycleLength: number;
  ovulationIso: string | null;
  fertileWindow: { start: string; end: string } | null;
  today?: Date;
}

/**
 * Pure: map cycle day + calendar context to a phase.
 * "fertile" covers the ovulation window (legacy API name).
 */
export function determineCyclePhase(input: DeterminePhaseInput): Exclude<CyclePhase, 'none'> {
  const bleed = Math.max(2, Math.min(10, Math.round(input.avgBleed)));
  const len = Math.max(21, Math.min(45, Math.round(input.cycleLength)));
  const today = input.today ?? new Date();

  if (input.cycleDay <= bleed) {
    return 'period';
  }

  const t = utcMidnightFromDate(today);
  if (input.fertileWindow) {
    const start = utcMidnightFromDate(new Date(`${input.fertileWindow.start}T00:00:00.000Z`));
    const end = utcMidnightFromDate(new Date(`${input.fertileWindow.end}T00:00:00.000Z`));
    if (t.getTime() >= start.getTime() && t.getTime() <= end.getTime()) {
      return 'fertile';
    }
  }

  if (input.ovulationIso) {
    const ov = utcMidnightFromDate(new Date(`${input.ovulationIso}T00:00:00.000Z`));
    const daysToOv = calendarDaysBetweenUtc(t, ov);
    if (daysToOv >= -1 && daysToOv <= 5) {
      return 'fertile';
    }
    if (input.cycleDay < len - 14) {
      return 'follicular';
    }
  } else if (input.cycleDay <= 14) {
    return 'follicular';
  }

  return 'luteal';
}
