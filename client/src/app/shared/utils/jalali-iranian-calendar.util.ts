import {
  addDays,
  addMonths,
  getDate,
  getDay,
  getDaysInMonth,
  startOfMonth,
} from 'date-fns-jalali';
import { format } from 'date-fns-jalali';
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';
import * as jalaali from 'jalaali-js';
/**
 * Iranian week starts Saturday. JS `getDay` is 0=Sun … 6=Sat.
 * Returns how many empty cells belong before the first of the month.
 */

dayjs.extend(jalaliday);

export const J_MONTHS = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند'
];

/** Ionic picker / overlay class — widens the month column so full names are visible. */
export const JALALI_DATE_PICKER_CLASS = 'jalali-date-picker';

/** Legacy ion-picker-legacy column width for full Persian month labels. */
export const JALALI_PICKER_MONTH_COL_WIDTH = '8.25rem';

const faDigits = '۰۱۲۳۴۵۶۷۸۹';
export const toFa = (s: string | number) => String(s).replace(/\d/g, d => faDigits[+d]);


export function jalaliDaysInMonth(jy: number, jm: number) {
  return jalaali.jalaaliMonthLength(jy, jm); // jm: 1..12
}

export function toPersianDigits(value: string): string {
  return value.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

export function jalaliToIsoDate(jy: number, jm: number, jd: number): string {
  const g = jalaali.toGregorian(jy, jm, jd);
  return dayjs(new Date(g.gy, g.gm - 1, g.gd)).format('YYYY-MM-DD');
}

function formatJalaliParts(
  jy: number,
  jm: number,
  jd: number,
  formatStr: string,
): string {
  const monthName = J_MONTHS[jm - 1] ?? '';
  const tokens: [string, string][] = [
    ['YYYY', String(jy)],
    ['YY', String(jy).slice(-2)],
    ['MMMM', monthName],
    ['MMM', monthName],
    ['MM', String(jm).padStart(2, '0')],
    ['DD', String(jd).padStart(2, '0')],
    ['D', String(jd)],
    ['M', String(jm)],
  ];
  let result = formatStr;
  for (const [token, value] of tokens) {
    result = result.replace(token, value);
  }
  return result;
}

export function formatJalaliFaFromIso(iso: string, format = 'YYYY/MM/DD'): string {
  if (!iso) return '';
  const normalized = iso.includes('T') ? iso.slice(0, 10) : iso;
  const [gy, gm, gd] = normalized.split('-').map((n) => parseInt(n, 10));
  if (!Number.isFinite(gy) || !Number.isFinite(gm) || !Number.isFinite(gd)) {
    return '';
  }
  const j = jalaali.toJalaali(gy, gm, gd);
  return toFa(formatJalaliParts(j.jy, j.jm, j.jd, format));
}

export function saturdayFirstWeekPadding(firstDayOfMonth: Date): number {
  return (getDay(firstDayOfMonth) + 1) % 7;
}

export function formatJalaliDate(
  date: string | Date,
  format: string = 'YYYY/MM/DD',
): string {
  if (!date) return '';
  const iso =
    typeof date === 'string'
      ? (date.includes('T') ? date.slice(0, 10) : date)
      : dayjs(date).format('YYYY-MM-DD');
  return formatJalaliFaFromIso(iso, format);
}
/** Jalali year-month key for comparing “same displayed month”. */
export function jalaliYearMonthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

/** Day of month in the Jalali calendar (1–31). */
export function jalaliDayOfMonth(date: Date): number {
  return getDate(date);
}

export { addDays, addMonths, getDaysInMonth, startOfMonth };
