import { Controller } from '@nestjs/common';
import { SecretChatsService } from './secret-chats.service';

@Controller('secret-chats')
export class SecretChatsController {
  constructor(private secretChatsService: SecretChatsService) {}
}
