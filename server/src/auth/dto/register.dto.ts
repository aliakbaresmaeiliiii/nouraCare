import { IsEmail, IsString, IsOptional, IsInt, Min, Max, IsDate, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OnboardingDataDto {
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

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OnboardingDataDto)
  onboardingData?: OnboardingDataDto;
}
