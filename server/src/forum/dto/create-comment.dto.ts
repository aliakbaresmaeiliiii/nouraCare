import { IsString, IsNotEmpty, IsOptional, MaxLength, ValidateIf } from 'class-validator';

export class CreateCommentDto {
  @ValidateIf((o: CreateCommentDto) => !o.content?.trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  comment?: string;

  @ValidateIf((o: CreateCommentDto) => !o.comment?.trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content?: string;

  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
