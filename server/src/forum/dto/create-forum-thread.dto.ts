import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateForumThreadDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string; 

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
