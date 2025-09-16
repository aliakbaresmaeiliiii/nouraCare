export enum ConsultationType {
  ONLINE = 'ONLINE',
  IN_PERSON = 'IN_PERSON',
  BOTH = 'BOTH',
}

export interface DoctorDto {
  id?: number;
  fullName: string;
  specialty: string;
  experienceYears: number;
  about: string;
  rating?: number;
  profileImageUrl?: string;
  clinicName?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  consultationType: ConsultationType;
  fee?: number;
  availableSlots?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDoctorDto {
  fullName: string;
  specialty: string;
  experienceYears: number;
  about: string;
  rating?: number;
  profileImageUrl?: string;
  clinicName?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  consultationType: ConsultationType;
  fee?: number;
  availableSlots?: any;
}

export interface DoctorAvailableSlot {
  day: string;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}
