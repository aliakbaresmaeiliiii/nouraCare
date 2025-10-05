export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  SYSTEM = 'SYSTEM',
}

export class CreateMessageDto {
  content?: string;
  chatId: string;
  messageType?: MessageType = MessageType.TEXT;
  mediaUrl?: string;
  replyToId?: string;
}
