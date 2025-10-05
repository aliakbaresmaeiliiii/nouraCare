export class CreateSecretChatDto {
  name?: string;
  description?: string;
  isGroup?: boolean = false;
  memberIds?: number[];
}
