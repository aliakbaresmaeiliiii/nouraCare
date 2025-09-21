import { Module } from '@nestjs/common';
import { SecretChatsController } from './secret-chats.controller';
import { SecretChatsService } from './secret-chats.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecretChatsController],
  providers: [SecretChatsService],
  exports: [SecretChatsService],
})
export class SecretChatsModule {}
