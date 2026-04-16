/**
 * Calendar date helpers for pregnancy / cycle onboarding.
 * Uses UTC date parts to avoid DST edge cases on day arithmetic.
 */

export function isoDateOnly(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const head = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(head) ? head : null;
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

/** Same gestational week convention as {@link HomeComponent.calculateAndUpdatePregnancyStatus}. */
export function gestationalWeekFromLmp(
  lmpIso: string,
  ref: Date = new Date(),
): number {
  const lmp = parseIsoDateOnlyUtc(lmpIso);
  if (Number.isNaN(lmp.getTime())) return 0;
  const today = new Date(
    Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate()),
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
    Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate()),
  );
  return d.getTime() <= today.getTime();
}
