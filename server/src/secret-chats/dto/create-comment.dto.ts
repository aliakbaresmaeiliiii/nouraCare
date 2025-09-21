import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsString()
  postId: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;
}
