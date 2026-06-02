import { IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateCommentDto {
  @ValidateIf((o: UpdateCommentDto) => !o.content?.trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  comment?: string;

  @ValidateIf((o: UpdateCommentDto) => !o.comment?.trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content?: string;
}
