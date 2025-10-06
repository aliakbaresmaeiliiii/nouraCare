import { IsBoolean, IsOptional, IsString, IsNumber, IsDate } from 'class-validator';

export class UpdateReproductiveStatusDto {
  @IsBoolean()
  isPregnant: boolean;

  @IsOptional()
  @IsString()
  pregnancyEndDate?: string;

  @IsOptional()
  @IsString()
  lastPeriodDate?: string;

  @IsOptional()
  @IsNumber()
  averageCycleLength?: number;
}

export class ReproductiveStatusResponseDto {
  @IsBoolean()
  isPregnant: boolean;

  @IsOptional()
  @IsDate()
  pregnancyEndDate?: Date;

  @IsOptional()
  @IsDate()
  lastPeriodStartDate?: Date;

  @IsOptional()
  @IsNumber()
  menstrualCycleLength?: number;

  @IsOptional()
  @IsNumber()
  pregnancyWeek?: number;

  @IsOptional()
  @IsString()
  pregnancyProgress?: string;
}
