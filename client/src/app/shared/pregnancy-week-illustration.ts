/**
 * Optional hero illustration per gestational week (1-based).
 * Paths are under `src/assets/` (served as `/assets/...`).
 * First matching range wins; keep ranges non-overlapping.
 */
const ILLUSTRATION_BY_WEEK_RANGE: readonly {
  minWeek: number;
  maxWeek: number;
  asset: string;
}[] = [
  { minWeek: 4, maxWeek: 5, asset: 'assets/svg/weeks4-5.png' },
  { minWeek: 6, maxWeek: 7, asset: 'assets/svg/weeks6-7.png' },
  { minWeek: 8, maxWeek: 9, asset: 'assets/svg/weeks8-9.png' },
  { minWeek: 10, maxWeek: 11, asset: 'assets/svg/weeks10-12.png' },
  { minWeek: 12, maxWeek: 13, asset: 'assets/svg/weeks-13-15.png' }

];

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
