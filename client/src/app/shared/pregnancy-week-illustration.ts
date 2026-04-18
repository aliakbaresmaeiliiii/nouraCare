/**
 * Optional hero illustration per gestational week (1-based).
 * Add more ranges / files under `src/assets/svg/` and extend this map.
 */
const ILLUSTRATION_BY_WEEK_RANGE: readonly {
  minWeek: number;
  maxWeek: number;
  asset: string;
}[] = [{ minWeek: 4, maxWeek: 5, asset: 'assets/svg/week4-5.png' }];

function clampPregnancyDisplayWeek(week: number): number {
  return Math.min(40, Math.max(1, Math.round(Number(week) || 1)));
}

/** Asset URL relative to `src/` (served as `/assets/...`), or `null` to use emoji fallback. */
export function pregnancyWeekIllustrationUrl(displayWeek: number): string | null {
  const w = clampPregnancyDisplayWeek(displayWeek);
  for (const row of ILLUSTRATION_BY_WEEK_RANGE) {
    if (w >= row.minWeek && w <= row.maxWeek) {
      return row.asset;
    }
  }
  return null;
}

export function pregnancyWeekIllustrationAlt(displayWeek: number): string {
  const w = clampPregnancyDisplayWeek(displayWeek);
  return `Illustration for pregnancy week ${w}`;
}
