/**
 * Calendar date helpers for pregnancy / cycle onboarding.
 * Uses UTC date parts to avoid DST edge cases on day arithmetic.
 *
 * LMP = first day of bleeding (period **start**), never last day of bleeding, stored as `YYYY-MM-DD` only.
 */

export function isoDateOnly(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const head = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(head)) return null;
  const [y, m, d] = head.split('-').map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return head;
}

/**
 * Normalize any ion-datetime / API / storage value to a single canonical LMP date string.
 * Handles arrays, Date, and ISO strings with time or timezone suffix.
 */
export function normalizeLmpInput(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (Array.isArray(raw)) {
    return raw.length ? normalizeLmpInput(raw[0]) : null;
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, '0');
    const d = String(raw.getUTCDate()).padStart(2, '0');
    return isoDateOnly(`${y}-${m}-${d}`);
  }
  return isoDateOnly(String(raw));
}

function parseIsoDateOnlyUtc(iso: string): Date {
  const d = isoDateOnly(iso);
  if (!d) return new Date(NaN);
  const [y, m, day] = d.split('-').map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, day));
}

export function addCalendarDaysIso(iso: string, deltaDays: number): string {
  const d = parseIsoDateOnlyUtc(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + deltaDays);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * First day of the menstrual period (LMP) when the user entered the **last day of bleeding**
 * and typical bleeding length in days.
 */
export function lmpIsoFromLastBleedingDay(
  lastBleedingDayIso: string,
  periodLengthDays: number,
): string {
  const pl = Math.max(1, Math.min(14, Math.floor(Number(periodLengthDays)) || 5));
  return addCalendarDaysIso(lastBleedingDayIso, -(pl - 1));
}

/** 1-based gestational week from LMP (aligned with server `computePregnancyMetricsFromLmp`). */
export function gestationalWeekFromLmp(
  lmpIso: string,
  ref: Date = new Date(),
): number {
  const lmp = parseIsoDateOnlyUtc(lmpIso);
  if (Number.isNaN(lmp.getTime())) return 0;
  const today = new Date(
    Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()),
  );
  const days = Math.floor(
    (today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.floor(days / 7) + 1;
}

export function isCalendarDateNotAfterToday(iso: string, ref: Date = new Date()): boolean {
  const d = parseIsoDateOnlyUtc(iso);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date(
    Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()),
  );
  return d.getTime() <= today.getTime();
}

/** UTC calendar "today" as `YYYY-MM-DD` from `ref` (avoids local timezone shifting the civil day). */
export function utcTodayIsoDateOnly(ref: Date = new Date()): string {
  const y = ref.getUTCFullYear();
  const m = String(ref.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ref.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Approximate LMP for a **1-based** gestational week `week` (same convention as `gestationalWeekFromLmp`):
 * LMP day counts as week 1 day 1, so week W starts (W−1)×7 days after LMP.
 * Returns LMP = today − (W−1)×7 calendar days (UTC).
 */
export function lmpIsoFromGestationalWeek1Based(
  week: number,
  ref: Date = new Date(),
): string | null {
  const w = Math.floor(Number(week));
  if (!Number.isFinite(w) || w < 1 || w > 42) return null;
  const todayIso = utcTodayIsoDateOnly(ref);
  const offsetDays = (w - 1) * 7;
  return addCalendarDaysIso(todayIso, -offsetDays);
}
