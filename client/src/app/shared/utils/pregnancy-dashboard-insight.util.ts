/**
 * Trimester + gestational week line for pregnancy home (aligned with server
 * `pregnancyDashboardInsight` in `pregnancy-metrics.util.ts`).
 */
export function pregnancyDashboardInsightFromWeek(week: number): string {
  const w = Math.min(42, Math.max(1, Math.round(week)));
  if (w <= 13) {
    return `First trimester · week ${w}`;
  }
  if (w <= 27) {
    return `Second trimester · week ${w}`;
  }
  return `Third trimester · week ${w}`;
}
