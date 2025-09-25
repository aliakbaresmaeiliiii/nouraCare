import { Module } from '@nestjs/common';
import { ForumCategoriesService } from './forum-categories.service';
import { ForumCategoriesController } from './forum-categories.controller';
import { ForumThreadsService } from './forum-threads.service';
import { ForumThreadsController } from './forum-threads.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ForumCategoriesController, ForumThreadsController],
  providers: [ForumCategoriesService, ForumThreadsService],
  exports: [ForumCategoriesService, ForumThreadsService],
})
export class ForumModule {}
