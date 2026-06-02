import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  SYSTEM = 'SYSTEM',
}

export class CreateMessageDto {
  @ValidateIf((o) => o.messageType === MessageType.TEXT || !o.messageType)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content?: string;

  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsString()
  @IsUrl()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;
}
