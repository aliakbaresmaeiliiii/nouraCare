import {
  IsInt,
  IsDate,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePeriodLogDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  lastPeriodDate: Date;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  averagePeriodDuration?: number;
}

export class UpdatePeriodLogDto {
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : value)
  lastPeriodDate?: Date;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  averagePeriodDuration?: number;
}

export class PeriodLogResponseDto {
  @IsInt()
  id: number;

  @IsInt()
  userId: number;

  @IsDate()
  lastPeriodDate: Date;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  averagePeriodDuration?: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
