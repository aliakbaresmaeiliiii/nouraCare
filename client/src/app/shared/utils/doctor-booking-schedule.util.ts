import { DoctorBookingTimeSlot } from '../models/doctor-booking.model';
import {
  bookingIsoDateKey,
  slotBookingDateKey,
} from './doctor-booking-format.util';

function compareSlotsByTime(
  a: DoctorBookingTimeSlot,
  b: DoctorBookingTimeSlot,
): number {
  const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
  const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
  return aTime - bTime;
}

export function groupSlotsByDate(
  slots: DoctorBookingTimeSlot[],
): Map<string, DoctorBookingTimeSlot[]> {
  const grouped = new Map<string, DoctorBookingTimeSlot[]>();

  for (const slot of slots) {
    const key = slotBookingDateKey(slot);
    if (!key) {
      continue;
    }
    const list = grouped.get(key) ?? [];
    list.push(slot);
    grouped.set(key, list);
  }

  for (const list of grouped.values()) {
    list.sort(compareSlotsByTime);
  }

  return grouped;
}

export function countAvailableSlotsForDate(
  slots: DoctorBookingTimeSlot[],
  isoDate: string,
): number {
  return slots.filter(
    (slot) => slot.available && slotBookingDateKey(slot) === isoDate,
  ).length;
}

export function hasSlotsForDate(
  slots: DoctorBookingTimeSlot[],
  isoDate: string,
): boolean {
  return slots.some((slot) => slotBookingDateKey(slot) === isoDate);
}

export function firstBookableDateIso(
  slots: DoctorBookingTimeSlot[],
): string | null {
  const dated = slots
    .map((slot) => ({ slot, key: slotBookingDateKey(slot) }))
    .filter(
      (entry): entry is { slot: DoctorBookingTimeSlot; key: string } =>
        entry.key != null,
    )
    .sort((a, b) => compareSlotsByTime(a.slot, b.slot));

  const firstAvailable = dated.find((entry) => entry.slot.available);
  if (firstAvailable) {
    return firstAvailable.key;
  }

  return dated[0]?.key ?? null;
}

export function bookingScheduleMonthRange(
  slots: DoctorBookingTimeSlot[],
): { min: Date; max: Date } | null {
  const keys = slots
    .map((slot) => slotBookingDateKey(slot))
    .filter((key): key is string => key != null)
    .sort();

  if (keys.length === 0) {
    return null;
  }

  const minKey = keys[0];
  const maxKey = keys[keys.length - 1];
  const [minY, minM] = minKey.split('-').map(Number);
  const [maxY, maxM] = maxKey.split('-').map(Number);

  return {
    min: new Date(minY, minM - 1, 1),
    max: new Date(maxY, maxM - 1, 1),
  };
}

export function isSameBookingMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

export function isBookingMonthBefore(left: Date, right: Date): boolean {
  const leftIndex = left.getFullYear() * 12 + left.getMonth();
  const rightIndex = right.getFullYear() * 12 + right.getMonth();
  return leftIndex < rightIndex;
}
