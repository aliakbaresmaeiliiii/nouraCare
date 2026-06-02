import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RecordOpenDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  localHour?: number;
}
