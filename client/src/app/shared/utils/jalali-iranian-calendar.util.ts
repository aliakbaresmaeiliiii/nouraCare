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

export function formatJalaliFaFromIso(iso: string, format = 'YYYY/MM/DD'): string {
  if (!iso) return '';
  const s = dayjs(iso).calendar('jalali').locale('fa').format(format);
  return toFa(s);
}

export function saturdayFirstWeekPadding(firstDayOfMonth: Date): number {
  return (getDay(firstDayOfMonth) + 1) % 7;
}

export function formatJalaliDate(
  date: string | Date,
  format: string = 'YYYY/MM/DD',
): string {
  debugger;
  if (!date) return '';

  const formatted = dayjs(date).calendar('jalali').locale('fa').format(format);
  return toPersianDigits(formatted);
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
