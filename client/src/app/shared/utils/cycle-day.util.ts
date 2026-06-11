/**
 * Cycle day math shared by home, cycle ring, and calendar views.
 * LMP is always a calendar date string `YYYY-MM-DD` (local civil date, not UTC-shifted).
 */

/** `${year}-${monthIndex0to11}-${dayOfMonth}` — matches the home week strip. */
export function toCycleViewDateKey(date: Date): string {
  const d = localMidnight(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Parse a week-strip selection key into local midnight. */
export function parseCycleViewDateKey(key: string): Date | null {
  const parts = key.split('-').map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return null;
  }
  const d = new Date(parts[0], parts[1], parts[2]);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function localMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function lmpLocalMidnight(iso: string): Date | null {
  const day = iso.includes('T') ? iso.split('T')[0] : iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return null;
  }
  const d = new Date(`${day}T12:00:00`);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toLocalIsoDate(date: Date): string {
  const d = localMidnight(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 1-based cycle day for `viewDate` relative to LMP (wraps by `cycleLength`). */
export function cycleDayFromLmpIso(
  lmpIso: string,
  viewDate: Date = new Date(),
  cycleLength = 28,
): number {
  const start = lmpLocalMidnight(lmpIso);
  if (!start) {
    return 0;
  }
  const view = localMidnight(viewDate);
  const diffDays = Math.floor(
    (view.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const safeLen = Math.max(1, Math.floor(Number(cycleLength)) || 28);
  const mod = ((diffDays % safeLen) + safeLen) % safeLen;
  return mod + 1;
}
