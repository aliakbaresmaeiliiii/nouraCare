import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  SYSTEM = 'SYSTEM',
}

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsString()
  chatId: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;
}
