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

export class OnboardingDataDto {
  @IsOptional()
  @IsString()
  pregnancy_status?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  last_period?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  cycle_length?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  period_length?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(42)
  pregnancy_week?: number;

  @IsOptional()
  @IsString()
  pregnancy_progress?: string;

  @IsOptional()
  @IsString()
  health_goals?: string;

  @IsOptional()
  notifications?: boolean | string;
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
