import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { doctors_consultationType } from '@prisma/client';

export class UpdateDoctorAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  specialty?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  about?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  clinicName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string | null;

  @IsOptional()
  @IsEnum(doctors_consultationType)
  consultationType?: doctors_consultationType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fee?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  licenseNumber?: string | null;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
