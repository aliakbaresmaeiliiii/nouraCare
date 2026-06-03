export type DoctorBookingType = 'online' | 'in-person';

export interface DoctorBookingTimeSlot {
  id: string;
  available: boolean;
  scheduledAt: string;
  labelKey?: string;
}

export interface DoctorBookingResult {
  type: DoctorBookingType;
  timeSlotId: string;
  timeLabel: string;
  appointmentId: string;
  scheduledAt: string;
}
