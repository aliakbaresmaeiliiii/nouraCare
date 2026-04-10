import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { REPRODUCTIVE_STATES } from '../types/reproductive-state.type';

export class UpdateReproductiveStateDto {
  @IsIn(REPRODUCTIVE_STATES)
  state: 'cycle' | 'planning' | 'pregnant' | 'postpartum';

  @IsOptional()
  @IsDateString()
  pregnancyStartDate?: string;

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
  @Min(1)
  @Max(42)
  currentWeek?: number;
}
