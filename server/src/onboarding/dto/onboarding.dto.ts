import { IsOptional, IsString, IsInt, IsBoolean, IsDate, IsEnum, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Status } from '@prisma/client';

export class OnboardingDataDto {
  @IsOptional()
  @IsEnum(Status)
  pregnancyStatus?: Status;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastPeriodDate?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  cycleLength?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  periodLength?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(42)
  pregnancyWeek?: number;

  @IsOptional()
  @IsString()
  pregnancyProgress?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  healthGoals?: string[];

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
}

export class CompleteOnboardingDto {
  @IsString()
  email: string;

  @IsString()
  phone: string;
}

export class OnboardingResponseDto {
  sessionId: string;
  onboardingData: OnboardingDataDto;
  expiresAt: Date;
}
