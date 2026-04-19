/**
 * Local calendar YYYY-MM-DD (avoids UTC day-shift from `Date#toISOString()`).
 */
import { addCalendarDaysIso, isoDateOnly } from './pregnancy-lmp.util';

export function localCalendarIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `ion-datetime` `highlightedDates`: marks today's cell in the calendar UI. */
export function ionDatetimeTodayHighlight(
  text = 'Today',
  color = 'primary',
): { date: string; text: string; color: string }[] {
  return [{ date: localCalendarIsoDate(), text, color }];
}

/**
 * Shape accepted by `ion-datetime` `highlightedDates` (Ionic 7.4+), including
 * `backgroundColor`, `textColor`, and `border` for custom cells.
 */
export type IonDatetimeHighlightedDate = {
  date: string;
  text?: string;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  border?: string;
};

const PERIOD_FILL = 'rgba(253, 164, 175, 0.32)';
const PERIOD_BORDER = '2px dashed rgba(190, 24, 93, 0.62)';
const PERIOD_TEXT = 'rgba(131, 24, 67, 0.92)';

/** Single estimated ovulation calendar day — strong so it reads as the peak day. */
const OVULATION_FILL = 'rgba(5, 150, 105, 0.88)';
const OVULATION_BORDER = '2px solid rgba(4, 100, 75, 1)';
const OVULATION_TEXT = '#ecfdf5';

/** Same rule as the cycle ring: `max(0, cycleLength - 15)` then clamped to 1..cycleLength. */
function ovulationCycleDay1Based(cycleLength: number): number {
  const v = Math.max(0, cycleLength - 15);
  return Math.max(1, Math.min(cycleLength, v || 1));
}

/**
 * Highlights for “last period start” calendar: estimated bleeding span (dashed pink),
 * one **estimated ovulation day** (strong green), plus today when it does not clash.
 */
export function buildCycleLmpDatetimeHighlights(
  lmpIso: string | null | undefined,
  cycleLength: number,
  periodLength: number,
  options?: { todayText?: string },
): IonDatetimeHighlightedDate[] {
  const todayText = options?.todayText ?? 'Today';
  const todayIso = localCalendarIsoDate();
  const lmp = isoDateOnly(
    lmpIso == null || lmpIso === '' ? null : String(lmpIso).trim(),
  );
  const out: IonDatetimeHighlightedDate[] = [];

  if (!lmp) {
    return ionDatetimeTodayHighlight(todayText) as IonDatetimeHighlightedDate[];
  }

  const cLen = Math.max(21, Math.min(45, Math.floor(cycleLength) || 28));
  const pLen = Math.max(2, Math.min(14, Math.floor(periodLength) || 5));

  const periodDates = new Set<string>();
  for (let i = 0; i < pLen; i++) {
    const d = addCalendarDaysIso(lmp, i);
    periodDates.add(d);
    out.push({
      date: d,
      text: '',
      backgroundColor: PERIOD_FILL,
      textColor: PERIOD_TEXT,
      border: PERIOD_BORDER,
    });
  }

  const ovu = ovulationCycleDay1Based(cLen);
  const ovuIso = addCalendarDaysIso(lmp, ovu - 1);
  if (!periodDates.has(ovuIso)) {
    out.push({
      date: ovuIso,
      text: 'Ov',
      textColor: OVULATION_TEXT,
      backgroundColor: OVULATION_FILL,
      border: OVULATION_BORDER,
    });
  }

  const ixToday = out.findIndex((h) => h.date === todayIso);
  if (ixToday >= 0) {
    const cur = out[ixToday];
    const prior = (cur.text ?? '').trim();
    out[ixToday] = {
      ...cur,
      text: prior ? `${prior} · ${todayText}` : todayText,
    };
  } else {
    out.push({ date: todayIso, text: todayText, color: 'primary' });
  }

  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}
