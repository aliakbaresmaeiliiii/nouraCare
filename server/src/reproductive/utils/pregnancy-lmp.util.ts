import { BadRequestException } from '@nestjs/common';
import { calendarDaysBetweenUtc } from './pregnancy-metrics.util';

export type PregnancyDateInputKind = 'lmp' | 'week' | 'due';

export function parseDateOnlyUtc(iso: string): Date {
  const trimmed = iso.trim();
  const dayPart = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed.slice(0, 10);
  const [y, m, d] = dayPart.split('-').map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    throw new BadRequestException('Invalid date format.');
  }
  return new Date(Date.UTC(y, m - 1, d));
}

export function utcToday(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

/**
 * When switching to pregnant, exactly one of LMP (`pregnancyStartDate`),
 * completed weeks (`currentWeek`), or due date (`pregnancyDueDate`) must be provided.
 * `pregnancyStartDate` is always stored as LMP (first day of last menstrual period).
 */
export function resolveLmpFromPregnancyInputs(payload: {
  pregnancyStartDate?: string;
  currentWeek?: number;
  pregnancyDueDate?: string;
}): { lmp: Date; kind: PregnancyDateInputKind } {
  const hasLmp = payload.pregnancyStartDate != null && String(payload.pregnancyStartDate).trim() !== '';
  const hasWeek = payload.currentWeek !== undefined && payload.currentWeek !== null;
  const hasDue = payload.pregnancyDueDate != null && String(payload.pregnancyDueDate).trim() !== '';

  const n = Number(hasLmp) + Number(hasWeek) + Number(hasDue);
  if (n === 0) {
    throw new BadRequestException(
      'To set pregnancy, provide exactly one of: last period start (LMP), current pregnancy week, or due date.',
    );
  }
  if (n > 1) {
    throw new BadRequestException(
      'Provide only one of: LMP (pregnancyStartDate), current pregnancy week (currentWeek), or due date (pregnancyDueDate).',
    );
  }

  const today = utcToday();

  if (hasLmp) {
    const lmp = parseDateOnlyUtc(String(payload.pregnancyStartDate));
    validateLmpAgainstToday(lmp, today);
    return { lmp, kind: 'lmp' };
  }

  if (hasWeek) {
    const week = Number(payload.currentWeek);
    if (!Number.isInteger(week) || week < 0 || week > 42) {
      throw new BadRequestException('currentWeek must be an integer between 0 and 42.');
    }
    const lmp = new Date(today.getTime() - week * 7 * 86400000);
    validateLmpAgainstToday(lmp, today);
    return { lmp, kind: 'week' };
  }

  const due = parseDateOnlyUtc(String(payload.pregnancyDueDate));
  if (calendarDaysBetweenUtc(today, due) < 0) {
    throw new BadRequestException('Due date cannot be in the past.');
  }
  const lmp = new Date(due.getTime() - 280 * 86400000);
  validateLmpAgainstToday(lmp, today);
  return { lmp, kind: 'due' };
}

function validateLmpAgainstToday(lmp: Date, today: Date) {
  if (calendarDaysBetweenUtc(lmp, today) < 0) {
    throw new BadRequestException('Last menstrual period (LMP) cannot be in the future.');
  }
  const days = calendarDaysBetweenUtc(lmp, today);
  if (days > 320) {
    throw new BadRequestException('That date would imply a pregnancy longer than supported; please check your entry.');
  }
}
