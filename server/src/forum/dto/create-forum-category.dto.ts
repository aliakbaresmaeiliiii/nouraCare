import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateForumCategoryDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
