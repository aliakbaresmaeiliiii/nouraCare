import {
  addDays,
  addMonths,
  getDate,
  getDay,
  getDaysInMonth,
  startOfMonth,
} from 'date-fns-jalali';
import { format } from 'date-fns-jalali';

/**
 * Iranian week starts Saturday. JS `getDay` is 0=Sun … 6=Sat.
 * Returns how many empty cells belong before the first of the month.
 */
export function saturdayFirstWeekPadding(firstDayOfMonth: Date): number {
  return (getDay(firstDayOfMonth) + 1) % 7;
}

/** Jalali year-month key for comparing “same displayed month”. */
export function jalaliYearMonthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

/** Day of month in the Jalali calendar (1–31). */
export function jalaliDayOfMonth(date: Date): number {
  return getDate(date);
}

export {
  addDays,
  addMonths,
  getDaysInMonth,
  startOfMonth,
};
