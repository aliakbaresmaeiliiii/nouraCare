export const BOOKING_DAYS_AHEAD = 14;

/** Weekday hours offered each bookable day (local server time). */
export const DAILY_SLOT_TIMES: ReadonlyArray<{ hour: number; minute: number }> = [
  { hour: 9, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 12, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 16, minute: 30 },
  { hour: 18, minute: 0 },
];

/** Friday (5) is treated as non-working in the default Iranian schedule. */
export const NON_WORKING_WEEKDAYS = new Set([5]);

export type GeneratedDoctorSlot = {
  id: string;
  scheduledAt: Date;
};

export function buildSlotKey(scheduledAt: Date): string {
  const y = scheduledAt.getFullYear();
  const m = String(scheduledAt.getMonth() + 1).padStart(2, '0');
  const d = String(scheduledAt.getDate()).padStart(2, '0');
  const h = String(scheduledAt.getHours()).padStart(2, '0');
  const min = String(scheduledAt.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}`;
}

export function parseSlotKey(
  slotKey: string,
  referenceDate: Date = new Date(),
): Date | null {
  const compact = slotKey.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})$/);
  if (compact) {
    return new Date(
      Number(compact[1]),
      Number(compact[2]) - 1,
      Number(compact[3]),
      Number(compact[4]),
      Number(compact[5]),
      0,
      0,
    );
  }

  return resolveLegacySlotDateTime(slotKey, referenceDate);
}

export function isValidSlotKey(slotKey: string): boolean {
  return parseSlotKey(slotKey) != null;
}

export function generateDoctorScheduleSlots(
  referenceDate: Date = new Date(),
  daysAhead: number = BOOKING_DAYS_AHEAD,
): GeneratedDoctorSlot[] {
  const now = new Date(referenceDate);
  const slots: GeneratedDoctorSlot[] = [];

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + dayOffset);

    if (NON_WORKING_WEEKDAYS.has(day.getDay())) {
      continue;
    }

    for (const { hour, minute } of DAILY_SLOT_TIMES) {
      const scheduledAt = new Date(day);
      scheduledAt.setHours(hour, minute, 0, 0);
      if (scheduledAt <= now) {
        continue;
      }

      slots.push({
        id: buildSlotKey(scheduledAt),
        scheduledAt,
      });
    }
  }

  return slots;
}

/** @deprecated Legacy fixed slots kept for backward compatibility. */
const LEGACY_SLOT_DEFINITIONS = [
  { id: 'today_2pm', hour: 14, minute: 0, dayOffset: 0 },
  { id: 'today_430pm', hour: 16, minute: 30, dayOffset: 0 },
  { id: 'tomorrow_10am', hour: 10, minute: 0, dayOffset: 1 },
  { id: 'tomorrow_2pm', hour: 14, minute: 0, dayOffset: 1 },
] as const;

function resolveLegacySlotDateTime(
  slotKey: string,
  referenceDate: Date,
): Date | null {
  const definition = LEGACY_SLOT_DEFINITIONS.find((slot) => slot.id === slotKey);
  if (!definition) {
    return null;
  }

  const scheduledAt = new Date(referenceDate);
  scheduledAt.setHours(0, 0, 0, 0);
  scheduledAt.setDate(scheduledAt.getDate() + definition.dayOffset);
  scheduledAt.setHours(definition.hour, definition.minute, 0, 0);
  return scheduledAt;
}
