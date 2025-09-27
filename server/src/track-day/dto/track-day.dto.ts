import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SymptomDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  icon: string;

  @IsString()
  severity: string;

  @IsDateString()
  timestamp: string;
}

export class CreateTrackDayDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsString()
  energy?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomDto)
  symptoms?: SymptomDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTrackDayDto {
  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsString()
  energy?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomDto)
  symptoms?: SymptomDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
