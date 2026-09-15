import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  doctor_appointment_consultationType,
  doctor_appointment_status,
} from '@prisma/client';

export class ListAppointmentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(doctor_appointment_status)
  status?: doctor_appointment_status;

  @IsOptional()
  @IsEnum(doctor_appointment_consultationType)
  consultationType?: doctor_appointment_consultationType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  doctorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
