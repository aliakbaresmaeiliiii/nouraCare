import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class InitializeOnboardingDto {
  @IsNotEmpty()
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
  @MaxLength(2000)
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
