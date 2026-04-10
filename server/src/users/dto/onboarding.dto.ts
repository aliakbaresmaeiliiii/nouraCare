import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsDate,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PregnancyStatus } from './user.dto';

export class OnboardingDataDto {
  @IsOptional()
  @IsEnum(PregnancyStatus)
  pregnancyStatus?: PregnancyStatus;

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

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  onboardingStep?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class UserInfoResponseDto {
  id: number;
  userId: number;
  pregnancyStatus: string;
  lastPeriodDate: Date | null;
  cycleLength: number;
  periodLength: number;
  pregnancyWeek: number | null;
  pregnancyProgress: string | null;
  healthGoals: string[];
  notificationsEnabled: boolean;
  isCompleted: boolean;
  onboardingStep: number;
  createdAt: Date;
  updatedAt: Date;
}
