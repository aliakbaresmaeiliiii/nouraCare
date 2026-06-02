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
import { Type } from 'class-transformer';
import { REPRODUCTIVE_STATES } from '../types/reproductive-state.type';

export class UpdateReproductiveStateDto {
  @IsNotEmpty()
  @IsIn(REPRODUCTIVE_STATES)
  state: 'cycle' | 'planning' | 'pregnant' | 'postpartum';

  @IsOptional()
  @IsDateString()
  /** First day of last menstrual period (LMP), ISO date. One of LMP, currentWeek, or pregnancyDueDate when state is pregnant. */
  pregnancyStartDate?: string;

  @IsOptional()
  @IsDateString()
  /** Estimated due date, ISO date. Mutually exclusive with pregnancyStartDate and currentWeek for pregnancy. */
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
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(60)
  cycleLength?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(42)
  /** Completed full weeks since LMP; LMP is derived as today minus (currentWeek × 7) calendar days. */
  currentWeek?: number;
}
