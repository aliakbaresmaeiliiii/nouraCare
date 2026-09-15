import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { doctors_consultationType } from '@prisma/client';

export class CreateDoctorAdminDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  specialty!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experienceYears!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  about!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  clinicName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @IsEnum(doctors_consultationType)
  consultationType!: doctors_consultationType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  licenseNumber?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
