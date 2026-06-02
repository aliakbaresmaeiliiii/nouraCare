import { IsBoolean } from 'class-validator';

export class LikeCommentDto {
  @IsBoolean()
  isLike: boolean;
}
