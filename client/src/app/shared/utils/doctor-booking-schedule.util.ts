import { DoctorBookingTimeSlot } from '../models/doctor-booking.model';
import { bookingIsoDateKey } from './doctor-booking-format.util';

export function groupSlotsByDate(
  slots: DoctorBookingTimeSlot[],
): Map<string, DoctorBookingTimeSlot[]> {
  const grouped = new Map<string, DoctorBookingTimeSlot[]>();

  for (const slot of slots) {
    if (!slot.scheduledAt) {
      continue;
    }
    const key = bookingIsoDateKey(slot.scheduledAt);
    const list = grouped.get(key) ?? [];
    list.push(slot);
    grouped.set(key, list);
  }

  for (const list of grouped.values()) {
    list.sort(
      (a, b) =>
        new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime(),
    );
  }

  return grouped;
}

export function countAvailableSlotsForDate(
  slots: DoctorBookingTimeSlot[],
  isoDate: string,
): number {
  return slots.filter(
    (slot) =>
      slot.available &&
      slot.scheduledAt &&
      bookingIsoDateKey(slot.scheduledAt) === isoDate,
  ).length;
}

export function firstBookableDateIso(
  slots: DoctorBookingTimeSlot[],
): string | null {
  const available = slots
    .filter((slot) => slot.available && slot.scheduledAt)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime(),
    );

  return available[0]?.scheduledAt
    ? bookingIsoDateKey(available[0].scheduledAt)
    : null;
}
