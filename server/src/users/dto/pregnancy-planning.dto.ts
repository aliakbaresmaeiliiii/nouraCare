import { IsInt, IsDate, IsString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePregnancyPlanningDto {
  @IsDate()
  @Type(() => Date)
  lastPeriodDate: Date;

  @IsInt()
  @Min(21)
  @Max(35)
  cycleLength: number;

  @IsString()
  @IsOptional()
  lifestyleGoals?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePregnancyPlanningDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastPeriodDate?: Date;

  @IsInt()
  @Min(21)
  @Max(35)
  @IsOptional()
  cycleLength?: number;

  @IsString()
  @IsOptional()
  lifestyleGoals?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class PregnancyPlanningResponseDto {
  id: number;
  userId: number;
  lastPeriodDate: Date;
  cycleLength: number;
  lifestyleGoals?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Calculated fields
  ovulationDate?: Date;
  fertileWindow?: {
    start: Date;
    end: Date;
  };
  nextPeriodDate?: Date;
  pregnancyProbability?: number;
}
