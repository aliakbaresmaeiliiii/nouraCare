import { Module } from '@nestjs/common';
import { ForumCategoriesService } from './forum-categories.service';
import { ForumCategoriesController } from './forum-categories.controller';
import { ForumThreadsService } from './forum-threads.service';
import { ForumThreadsController } from './forum-threads.controller';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ForumCategoriesController,
    ForumThreadsController,
    ForumController,
  ],
  providers: [
    ForumCategoriesService, 
    ForumThreadsService, 
    ForumService,
  ],
  exports: [ForumCategoriesService, ForumThreadsService, ForumService],
})
export class ForumModule {}
