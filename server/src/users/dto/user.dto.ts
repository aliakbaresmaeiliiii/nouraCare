import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PregnancyStatus {
  PLANNING_PREGNANCY = 'PLANNING_PREGNANCY',
  PREGNANT = 'PREGNANT',
  NOT_PLANNING = 'NOT_PLANNING',
  HAS_CHILD = 'HAS_CHILD',
  POSTPARTUM = 'POSTPARTUM',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  verificationCode?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  verificationCodeExpiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  // @IsUrl()
  profileImage?: string;

  @IsOptional()
  @IsEnum(PregnancyStatus)
  status?: PregnancyStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  menstrualCycleLength?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  periodDuration?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastPeriodStartDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  city?: string; // 🏙️ added city
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  verificationCode?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  verificationCodeExpiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  profileImage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  menstrualCycleLength?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  periodDuration?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastPeriodStartDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  city?: string;
}
