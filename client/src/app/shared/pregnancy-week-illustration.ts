/** Default vector hero when no week-specific raster is configured. */
export const PREGNANCY_HERO_SVG_ASSET = 'assets/svg/pregnancy-hero.svg';

/**
 * Optional hero illustration per gestational week (1-based).
 * Paths are under `src/assets/` (served as `/assets/...`).
 * First matching range wins; keep ranges non-overlapping.
 * When no range matches, the home hero uses the inline `app-pregnancy-hero-svg` component.
 */
/** Add raster paths here only when the files exist under `src/assets/`. */
const ILLUSTRATION_BY_WEEK_RANGE: readonly {
  minWeek: number;
  maxWeek: number;
  asset: string;
}[] = [];

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
