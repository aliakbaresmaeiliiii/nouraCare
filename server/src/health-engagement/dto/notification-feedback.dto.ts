import { IsBoolean, IsOptional } from 'class-validator';

export class NotificationFeedbackDto {
  @IsOptional()
  @IsBoolean()
  ignored?: boolean;
}
