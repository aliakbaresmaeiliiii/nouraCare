import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  doctor_appointment,
  doctor_appointment_consultationType,
  doctor_appointment_status,
  doctors_consultationType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
  buildSlotKey,
  generateDoctorScheduleSlots,
  isValidSlotKey,
  parseSlotKey,
} from './doctor-schedule.util';

export type DoctorScheduleSlotDto = {
  id: string;
  scheduledAt: string;
  available: boolean;
};

export type DoctorScheduleDto = {
  doctorId: string;
  slots: DoctorScheduleSlotDto[];
};

export type AppointmentDto = {
  id: string;
  doctorId: string;
  userId: number;
  slotKey: string;
  scheduledAt: string;
  consultationType: doctor_appointment_consultationType;
  status: doctor_appointment_status;
  feeTomans: number | null;
  createdAt: string;
};

const ACTIVE_STATUSES: doctor_appointment_status[] = [
  doctor_appointment_status.PENDING,
  doctor_appointment_status.CONFIRMED,
];

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDoctorSchedule(doctorId: string): Promise<DoctorScheduleDto> {
    const doctor = await this.prisma.doctors.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const now = new Date();
    const slots = generateDoctorScheduleSlots(now).map((slot) => ({
      id: slot.id,
      scheduledAt: slot.scheduledAt,
    }));

    const booked = await this.prisma.doctor_appointment.findMany({
      where: {
        doctorId,
        status: { in: ACTIVE_STATUSES },
        scheduledAt: { in: slots.map((slot) => slot.scheduledAt) },
      },
      select: { scheduledAt: true },
    });

    const bookedAt = new Set(
      booked.map((row) => row.scheduledAt.toISOString()),
    );

    return {
      doctorId,
      slots: slots.map((slot) => ({
        id: slot.id,
        scheduledAt: slot.scheduledAt.toISOString(),
        available: !bookedAt.has(slot.scheduledAt.toISOString()),
      })),
    };
  }

  async createAppointment(
    userId: number,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentDto> {
    if (!isValidSlotKey(dto.slotKey)) {
      throw new BadRequestException('Invalid time slot');
    }

    const doctor = await this.prisma.doctors.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const consultationType = this.mapConsultationType(dto.consultationType);
    this.assertDoctorSupportsType(doctor.consultationType, consultationType);

    const scheduledAt = parseSlotKey(dto.slotKey);
    if (!scheduledAt || scheduledAt <= new Date()) {
      throw new BadRequestException('Selected time is no longer available');
    }

    const conflict = await this.prisma.doctor_appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        scheduledAt,
        status: { in: ACTIVE_STATUSES },
      },
    });
    if (conflict) {
      throw new ConflictException('This time slot is already booked');
    }

    const feeTomans =
      doctor.fee != null ? Math.round(doctor.fee * 420_000) : null;

    const row = await this.prisma.doctor_appointment.create({
      data: {
        id: randomUUID(),
        doctorId: dto.doctorId,
        userId,
        slotKey: dto.slotKey,
        scheduledAt,
        consultationType,
        status: doctor_appointment_status.PENDING,
        feeTomans,
        updatedAt: new Date(),
      },
    });

    return this.mapAppointment(row);
  }

  async cancelAppointment(
    userId: number,
    appointmentId: string,
  ): Promise<AppointmentDto> {
    const row = await this.prisma.doctor_appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!row) {
      throw new NotFoundException('Appointment not found');
    }
    if (row.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own appointments');
    }
    if (row.status === doctor_appointment_status.CANCELLED) {
      return this.mapAppointment(row);
    }

    const updated = await this.prisma.doctor_appointment.update({
      where: { id: appointmentId },
      data: {
        status: doctor_appointment_status.CANCELLED,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return this.mapAppointment(updated);
  }

  async confirmAppointment(
    userId: number,
    appointmentId: string,
  ): Promise<AppointmentDto> {
    const row = await this.prisma.doctor_appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!row) {
      throw new NotFoundException('Appointment not found');
    }
    if (row.userId !== userId) {
      throw new ForbiddenException('You can only confirm your own appointments');
    }
    if (row.status === doctor_appointment_status.CANCELLED) {
      throw new BadRequestException('Appointment was cancelled');
    }
    if (row.status === doctor_appointment_status.CONFIRMED) {
      return this.mapAppointment(row);
    }

    const updated = await this.prisma.doctor_appointment.update({
      where: { id: appointmentId },
      data: {
        status: doctor_appointment_status.CONFIRMED,
        updatedAt: new Date(),
      },
    });

    return this.mapAppointment(updated);
  }

  private mapConsultationType(
    type: 'online' | 'in-person',
  ): doctor_appointment_consultationType {
    return type === 'online'
      ? doctor_appointment_consultationType.ONLINE
      : doctor_appointment_consultationType.IN_PERSON;
  }

  private assertDoctorSupportsType(
    doctorType: doctors_consultationType,
    requested: doctor_appointment_consultationType,
  ): void {
    const supportsOnline =
      doctorType === doctors_consultationType.ONLINE ||
      doctorType === doctors_consultationType.BOTH;
    const supportsInPerson =
      doctorType === doctors_consultationType.IN_PERSON ||
      doctorType === doctors_consultationType.BOTH;

    if (
      requested === doctor_appointment_consultationType.ONLINE &&
      !supportsOnline
    ) {
      throw new BadRequestException('Doctor does not offer online consultations');
    }
    if (
      requested === doctor_appointment_consultationType.IN_PERSON &&
      !supportsInPerson
    ) {
      throw new BadRequestException(
        'Doctor does not offer in-person consultations',
      );
    }
  }

  private mapAppointment(row: doctor_appointment): AppointmentDto {
    return {
      id: row.id,
      doctorId: row.doctorId,
      userId: row.userId,
      slotKey: row.slotKey,
      scheduledAt: row.scheduledAt.toISOString(),
      consultationType: row.consultationType,
      status: row.status,
      feeTomans: row.feeTomans,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
