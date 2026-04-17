/** Calendar-day difference in UTC (date-only, no time-of-day drift). */
export function calendarDaysBetweenUtc(from: Date, to: Date): number {
  const u0 = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const u1 = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((u1 - u0) / 86400000);
}

export interface PregnancyMetrics {
  days: number;
  week: number;
  day: number;
  progress: number;
}

/** LMP = inclusive start day; days = whole days elapsed since LMP day through `today`. */
export function computePregnancyMetricsFromLmp(lmp: Date, today: Date = new Date()): PregnancyMetrics {
  const days = Math.max(0, calendarDaysBetweenUtc(lmp, today));
  const week = Math.floor(days / 7);
  const day = days % 7;
  const progress = Math.min(1, days / 280);
  return { days, week, day, progress };
}

export function tipsForPregnancyWeek(week: number): string[] {
  if (week < 0) return [];
  if (week <= 4) {
    return [
      'Rest when you can and stay hydrated.',
      'Schedule your first prenatal visit if you have not already.',
    ];
  }
  if (week <= 13) {
    return [
      'Folic acid and balanced meals support early development.',
      'Mention any nausea or spotting to your clinician.',
    ];
  }
  if (week <= 27) {
    return [
      'Gentle movement like walking is often well tolerated.',
      'Keep up with routine prenatal appointments.',
    ];
  }
  if (week <= 36) {
    return [
      'Watch for regular contractions or changes in movement patterns.',
      'Plan ahead for birth preferences and support.',
    ];
  }
  return [
    'Pack your hospital bag and confirm your birth plan with your care team.',
    'Rest often; labor could start any time in the coming weeks.',
  ];
}
