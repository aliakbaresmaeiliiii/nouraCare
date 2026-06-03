import {
  addCalendarDaysIso,
  GESTATION_LENGTH_DAYS,
  isoDateOnly,
  isCalendarDateNotAfterToday,
  lmpIsoFromGestationalWeekAndDay,
  utcTodayIsoDateOnly,
} from './pregnancy-lmp.util';
import { localCalendarIsoDate } from './ion-datetime-today-highlight.util';

export { GESTATION_LENGTH_DAYS } from './pregnancy-lmp.util';

/** Matches server `validateLmpAgainstToday` (pregnancy-lmp.util.ts). */
export const MAX_PREGNANCY_DAYS_FROM_LMP = 320;
/** Cycle last-period picker: do not accept starts older than this. */
export const MAX_CYCLE_LAST_PERIOD_DAYS_AGO = 365;
/** Profile date of birth: earliest calendar year allowed (inclusive). */
export const MIN_DATE_OF_BIRTH_YEAR_OFFSET = 120;

export type ReproductiveDateValidationResult =
  | { valid: true; iso: string }
  | { valid: false; errorKey: string };

export function calendarDaysBetweenIso(
  fromIso: string,
  toIso: string,
): number | null {
  const from = isoDateOnly(fromIso);
  const to = isoDateOnly(toIso);
  if (!from || !to) return null;
  const [fy, fm, fd] = from.split('-').map((x) => Number(x));
  const [ty, tm, td] = to.split('-').map((x) => Number(x));
  const u0 = Date.UTC(fy, fm - 1, fd);
  const u1 = Date.UTC(ty, tm - 1, td);
  return Math.floor((u1 - u0) / 86400000);
}

/** LMP / last period start when setting pregnancy (stored as pregnancyStartDate). */
export function validatePregnancyLmpIso(
  iso: string,
  ref: Date = new Date(),
): ReproductiveDateValidationResult {
  const normalized = isoDateOnly(iso);
  if (!normalized) {
    return { valid: false, errorKey: 'pregnancySetup.validationInvalidDate' };
  }
  if (!isCalendarDateNotAfterToday(normalized, ref)) {
    return { valid: false, errorKey: 'pregnancySetup.validationLmpFuture' };
  }
  const todayIso = utcTodayIsoDateOnly(ref);
  const days = calendarDaysBetweenIso(normalized, todayIso);
  if (days === null || days > MAX_PREGNANCY_DAYS_FROM_LMP) {
    return { valid: false, errorKey: 'pregnancySetup.validationLmpTooOld' };
  }
  return { valid: true, iso: normalized };
}

/** Estimated due date (delivery) for pregnancy tracking. */
export function validatePregnancyDueIso(
  iso: string,
  ref: Date = new Date(),
): ReproductiveDateValidationResult {
  const normalized = isoDateOnly(iso);
  if (!normalized) {
    return { valid: false, errorKey: 'pregnancySetup.validationInvalidDate' };
  }
  const todayIso = utcTodayIsoDateOnly(ref);
  if (normalized < todayIso) {
    return { valid: false, errorKey: 'pregnancySetup.validationDuePast' };
  }
  const maxDueIso = addCalendarDaysIso(todayIso, GESTATION_LENGTH_DAYS);
  if (normalized > maxDueIso) {
    return { valid: false, errorKey: 'pregnancySetup.validationDueTooFar' };
  }
  const impliedLmp = addCalendarDaysIso(normalized, -GESTATION_LENGTH_DAYS);
  const lmpCheck = validatePregnancyLmpIso(impliedLmp, ref);
  if (!lmpCheck.valid) {
    return { valid: false, errorKey: 'pregnancySetup.validationDueImpliedInvalid' };
  }
  return { valid: true, iso: normalized };
}

export function validateGestationalWeekAndDay(
  week1Based: number,
  day0to6: number,
  ref: Date = new Date(),
): ReproductiveDateValidationResult {
  const lmp = lmpIsoFromGestationalWeekAndDay(week1Based, day0to6, ref);
  if (!lmp) {
    return { valid: false, errorKey: 'pregnancySetup.validationGestationalInvalid' };
  }
  return validatePregnancyLmpIso(lmp, ref);
}

/** First day of last period for cycle / planning setup. */
export function validateCycleLastPeriodIso(
  iso: string,
  ref: Date = new Date(),
): ReproductiveDateValidationResult {
  const normalized = isoDateOnly(iso);
  if (!normalized) {
    return { valid: false, errorKey: 'reproductiveStatus.validationInvalidDate' };
  }
  if (!isCalendarDateNotAfterToday(normalized, ref)) {
    return { valid: false, errorKey: 'reproductiveStatus.validationPeriodFuture' };
  }
  const todayIso = localCalendarIsoDate(ref);
  const minIso = addCalendarDaysIso(todayIso, -MAX_CYCLE_LAST_PERIOD_DAYS_AGO);
  if (normalized < minIso) {
    return { valid: false, errorKey: 'reproductiveStatus.validationPeriodTooOld' };
  }
  return { valid: true, iso: normalized };
}

export function validateCycleLengthDays(
  value: number,
): { valid: true } | { valid: false; errorKey: string } {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 21 || n > 60) {
    return { valid: false, errorKey: 'reproductiveStatus.validationCycleLengthRange' };
  }
  return { valid: true };
}

export function validateBleedingDays(
  value: number,
): { valid: true } | { valid: false; errorKey: string } {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 2 || n > 10) {
    return { valid: false, errorKey: 'reproductiveStatus.validationBleedingRange' };
  }
  return { valid: true };
}

export function validateBleedingVsCycleLength(
  bleedingDays: number,
  cycleLengthDays: number,
): { valid: true } | { valid: false; errorKey: string } {
  const bleed = Math.round(Number(bleedingDays));
  const cycle = Math.round(Number(cycleLengthDays));
  if (bleed >= cycle) {
    return { valid: false, errorKey: 'reproductiveStatus.validationBleedingTooLong' };
  }
  return { valid: true };
}

export function minPregnancyLmpIso(ref: Date = new Date()): string {
  return addCalendarDaysIso(utcTodayIsoDateOnly(ref), -MAX_PREGNANCY_DAYS_FROM_LMP);
}

export function maxPregnancyDueIso(ref: Date = new Date()): string {
  return addCalendarDaysIso(localCalendarIsoDate(ref), GESTATION_LENGTH_DAYS);
}

export function minCycleLastPeriodIso(ref: Date = new Date()): string {
  return addCalendarDaysIso(
    localCalendarIsoDate(ref),
    -MAX_CYCLE_LAST_PERIOD_DAYS_AGO,
  );
}

export function maxDateOfBirthIso(ref: Date = new Date()): string {
  return localCalendarIsoDate(ref);
}

export function minDateOfBirthIso(ref: Date = new Date()): string {
  const todayIso = localCalendarIsoDate(ref);
  const year = Number(todayIso.slice(0, 4)) - MIN_DATE_OF_BIRTH_YEAR_OFFSET;
  return `${year}-01-01`;
}

/** User profile birthday (not in the future; within a reasonable age range). */
export function validateDateOfBirthIso(
  iso: string,
  ref: Date = new Date(),
): ReproductiveDateValidationResult {
  const normalized = isoDateOnly(iso);
  if (!normalized) {
    return { valid: false, errorKey: 'editProfile.validation.dobInvalid' };
  }
  if (!isCalendarDateNotAfterToday(normalized, ref)) {
    return { valid: false, errorKey: 'editProfile.validation.dobFuture' };
  }
  if (normalized < minDateOfBirthIso(ref)) {
    return { valid: false, errorKey: 'editProfile.validation.dobTooOld' };
  }
  return { valid: true, iso: normalized };
}

/** Optional UX hint shown under a validation error to guide correction. */
export const VALIDATION_HELP_BY_ERROR: Record<string, string> = {
  'pregnancySetup.validationInvalidDate': 'pregnancySetup.helpInvalidDate',
  'pregnancySetup.validationLmpRequired': 'pregnancySetup.helpLmpRequired',
  'pregnancySetup.validationLmpFuture': 'pregnancySetup.helpLmpFuture',
  'pregnancySetup.validationLmpTooOld': 'pregnancySetup.helpLmpTooOld',
  'pregnancySetup.validationDueRequired': 'pregnancySetup.helpDueRequired',
  'pregnancySetup.validationDuePast': 'pregnancySetup.helpDuePast',
  'pregnancySetup.validationDueTooFar': 'pregnancySetup.helpDueTooFar',
  'pregnancySetup.validationDueImpliedInvalid': 'pregnancySetup.helpDueImpliedInvalid',
  'pregnancySetup.validationGestationalInvalid': 'pregnancySetup.helpGestationalInvalid',
  'reproductiveStatus.validationInvalidDate': 'reproductiveStatus.helpInvalidDate',
  'reproductiveStatus.validationPeriodRequired': 'reproductiveStatus.helpPeriodRequired',
  'reproductiveStatus.validationPeriodFuture': 'reproductiveStatus.helpPeriodFuture',
  'reproductiveStatus.validationPeriodTooOld': 'reproductiveStatus.helpPeriodTooOld',
  'reproductiveStatus.validationCycleLengthRange': 'reproductiveStatus.helpCycleLengthRange',
  'reproductiveStatus.validationBleedingRange': 'reproductiveStatus.helpBleedingRange',
  'reproductiveStatus.validationBleedingTooLong': 'reproductiveStatus.helpBleedingTooLong',
  'editProfile.validation.dobInvalid': 'editProfile.help.dobInvalid',
  'editProfile.validation.dobFuture': 'editProfile.help.dobFuture',
  'editProfile.validation.dobTooOld': 'editProfile.help.dobTooOld',
};

export function helpKeyForValidationError(errorKey: string): string | null {
  return VALIDATION_HELP_BY_ERROR[errorKey] ?? null;
}
