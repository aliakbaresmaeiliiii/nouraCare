import { format } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

const FA = { locale: faIR };

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** USD → Toman rate (same as shop pricing). */
export const USD_TO_TOMAN = 420_000;

/** Legacy seed/API values below this are treated as USD and converted to Tomans. */
const LEGACY_DOCTOR_FEE_USD_THRESHOLD = 10_000;

export function doctorFeeToTomans(fee: number): number {
  if (fee > 0 && fee < LEGACY_DOCTOR_FEE_USD_THRESHOLD) {
    return Math.round(fee * USD_TO_TOMAN);
  }
  return Math.round(fee);
}

export function formatTomanPrice(amount: number, languageCode: string): string {
  const tomans = Math.round(amount);
  if (isPersianAppLanguage(languageCode)) {
    return `${tomans.toLocaleString('fa-IR')} تومان`;
  }
  if (languageCode === 'zh' || languageCode.startsWith('zh-')) {
    return `${tomans.toLocaleString('zh-CN')} 土曼`;
  }
  return `${tomans.toLocaleString('en-US')} Toman`;
}

export function formatDoctorFee(fee: number, languageCode: string): string {
  return formatTomanPrice(doctorFeeToTomans(fee), languageCode);
}

/** Localized digits for UI numbers (Persian uses Eastern Arabic numerals). */
export function formatLocalizedNumber(
  value: number | string,
  languageCode: string,
): string {
  if (isPersianAppLanguage(languageCode)) {
    return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);
  }
  return String(value);
}

/** Convert Western digits in any string when the app language is Persian. */
export function localizeDigitsInText(
  text: string,
  languageCode: string,
): string {
  return formatLocalizedNumber(text, languageCode);
}

/** App Persian/Farsi language code (see `LanguageService`). */
export function isPersianAppLanguage(code: string): boolean {
  return code === 'fa' || code.startsWith('fa-');
}

/**
 * Weekday headers: English Sun-first; Persian Saturday-first (شنبه، یکشنبه، …).
 */
export function getCalendarWeekdayLabels(languageCode: string): string[] {
  const en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (!isPersianAppLanguage(languageCode)) {
    return en;
  }
  // Saturday 6 Jan 2024 — full Persian weekday names, Iranian column order.
  const saturday = new Date(2024, 0, 6);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    return format(d, 'EEEE', FA);
  });
}

export function formatHistoryDayDate(date: Date, languageCode: string): string {
  if (isPersianAppLanguage(languageCode)) {
    return format(date, 'EEE d MMM yyyy', FA);
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRecordedAtDate(date: Date, languageCode: string): string {
  if (isPersianAppLanguage(languageCode)) {
    return format(date, 'd MMM yyyy', FA);
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthYearTitle(date: Date, languageCode: string): string {
  if (isPersianAppLanguage(languageCode)) {
    return format(date, 'MMMM yyyy', FA);
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/** Center headline date above the cycle ring (was `date: 'EEE, MMM d, yyyy'`). */
export function formatCycleStripCenterDate(date: Date, languageCode: string): string {
  if (isPersianAppLanguage(languageCode)) {
    return format(date, 'EEE, d MMM yyyy', FA);
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Short “day month” for phase markers (period start, ovulation, etc.). */
export function formatCyclePhaseShortDate(date: Date, languageCode: string): string {
  if (isPersianAppLanguage(languageCode)) {
    return format(date, 'd MMM', FA);
  }
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  });
}

/** Calendar day-of-month number shown in the week strip (Jalali day when language is `fa`). */
export function weekStripDayOfMonth(date: Date, languageCode: string): number {
  if (isPersianAppLanguage(languageCode)) {
    return Number(format(date, 'd', FA));
  }
  return date.getDate();
}

/** Weekday label in the strip when not “today” / “last” (M… vs شنبه…). */
export function weekStripWeekdayShort(date: Date, languageCode: string): string {
  if (isPersianAppLanguage(languageCode)) {
    return format(date, 'EEE', FA);
  }
  const letter = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dow = date.getDay();
  const idx = dow === 0 ? 6 : dow - 1;
  return letter[idx];
}

/** Legal pages: locale-aware date (Jalali + Persian digits when language is `fa`). */
export function formatLegalEffectiveDate(
  isoDate: string,
  languageCode: string,
): string {
  const normalized = isoDate.includes('T') ? isoDate.slice(0, 10) : isoDate;
  const date = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return normalized;
  }
  if (isPersianAppLanguage(languageCode)) {
    return format(date, 'd MMMM yyyy', FA).replace(
      /\d/g,
      (d) => PERSIAN_DIGITS[+d],
    );
  }
  if (languageCode === 'zh' || languageCode.startsWith('zh-')) {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  if (languageCode === 'ms' || languageCode.startsWith('ms-')) {
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
