import { IsOptional, IsString, IsInt, Min, Max, Matches } from 'class-validator';

export class OnboardingDataDto {
  @IsOptional()
  @IsString()
  pregnancy_status?: string;

  /**
   * Canonical LMP (first day of last menstrual period), `YYYY-MM-DD` only.
   * Prefer this field; `last_period` is kept as an alias for older clients.
   */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  lmp_date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  last_period?: string;

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
