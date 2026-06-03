import { format } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import {
  formatLocalizedNumber,
  isPersianAppLanguage,
} from './locale-date-format.util';

const FA = { locale: faIR };

export function bookingIsoDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Stable calendar date from server slot id (e.g. 20260603_1030 → 2026-06-03). */
export function slotBookingDateKey(slot: {
  id: string;
  scheduledAt?: string | null;
}): string | null {
  const fromId = slot.id.match(/^(\d{4})(\d{2})(\d{2})_/);
  if (fromId) {
    return `${fromId[1]}-${fromId[2]}-${fromId[3]}`;
  }
  if (slot.scheduledAt) {
    return bookingIsoDateKey(slot.scheduledAt);
  }
  return null;
}

export function formatBookingTime(
  scheduledAt: string,
  languageCode: string,
): string {
  const date = new Date(scheduledAt);
  if (isPersianAppLanguage(languageCode)) {
    return formatLocalizedNumber(format(date, 'HH:mm', FA), languageCode);
  }
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatBookingWeekday(
  scheduledAt: string,
  languageCode: string,
): string {
  const date = new Date(scheduledAt);
  if (isPersianAppLanguage(languageCode)) {
    return format(date, 'EEE', FA);
  }
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatBookingDayNumber(
  scheduledAt: string,
  languageCode: string,
): string {
  const date = new Date(scheduledAt);
  return formatLocalizedNumber(date.getDate(), languageCode);
}

export function formatBookingMonthYear(
  date: Date,
  languageCode: string,
): string {
  if (isPersianAppLanguage(languageCode)) {
    return formatLocalizedNumber(format(date, 'MMMM yyyy', FA), languageCode);
  }
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatBookingDateTimeLabel(
  scheduledAt: string,
  languageCode: string,
): string {
  const date = new Date(scheduledAt);
  const now = new Date();
  const todayKey = bookingIsoDateKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const slotKey = bookingIsoDateKey(date);

  const time = formatBookingTime(scheduledAt, languageCode);

  if (slotKey === todayKey) {
    return isPersianAppLanguage(languageCode)
      ? `امروز، ${time}`
      : `Today, ${time}`;
  }

  if (slotKey === bookingIsoDateKey(tomorrow)) {
    return isPersianAppLanguage(languageCode)
      ? `فردا، ${time}`
      : `Tomorrow, ${time}`;
  }

  if (isPersianAppLanguage(languageCode)) {
    const day = formatLocalizedNumber(format(date, 'd MMMM', FA), languageCode);
    return `${day}، ${time}`;
  }

  const day = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `${day}, ${time}`;
}

export function isSameBookingDay(
  left: string | Date,
  right: string | Date,
): boolean {
  return bookingIsoDateKey(left) === bookingIsoDateKey(right);
}

export function startOfBookingMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addBookingMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function calendarWeekPadding(date: Date, languageCode: string): number {
  const day = date.getDay();
  if (isPersianAppLanguage(languageCode)) {
    return (day + 1) % 7;
  }
  return day;
}

export function buildCalendarMonthDays(
  month: Date,
  languageCode: string,
): Date[] {
  const start = startOfBookingMonth(month);
  const padding = calendarWeekPadding(start, languageCode);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - padding);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    days.push(day);
  }
  return days;
}
