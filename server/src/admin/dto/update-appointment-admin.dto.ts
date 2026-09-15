import { IsEnum } from 'class-validator';
import { doctor_appointment_status } from '@prisma/client';

export class UpdateAppointmentAdminDto {
  @IsEnum(doctor_appointment_status)
  status!: doctor_appointment_status;
}
