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
import { REPRODUCTIVE_STATES } from '../types/reproductive-state.type';

export class InitializeReproductiveStateDto {
  @IsNotEmpty()
  @IsIn(REPRODUCTIVE_STATES)
  state: 'cycle' | 'planning' | 'pregnant' | 'postpartum' | 'menopause';

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

  @IsOptional()
  @IsIn(['perimenopause', 'menopause'])
  menopauseStage?: 'perimenopause' | 'menopause';
}
