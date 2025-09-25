import { IsString, IsOptional, IsBoolean, IsArray, IsInt, Min } from 'class-validator';

export class CreateForumThreadDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  forumId: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
