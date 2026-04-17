import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class InitializeOnboardingDto {
  @IsIn(['cycle', 'planning', 'pregnant', 'postpartum'])
  state: 'cycle' | 'planning' | 'pregnant' | 'postpartum';

  @IsOptional()
  @IsDateString()
  pregnancyStartDate?: string;

  @IsOptional()
  @IsDateString()
  pregnancyDueDate?: string;

  @IsOptional()
  @IsDateString()
  tryingSince?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  lastPeriodDate?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(60)
  cycleLength?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(42)
  currentWeek?: number;
}
