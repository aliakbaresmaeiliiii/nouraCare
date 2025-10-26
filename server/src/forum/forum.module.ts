import { Module } from '@nestjs/common';
import { ForumCategoriesService } from './forum-categories.service';
import { ForumCategoriesController } from './forum-categories.controller';
import { ForumThreadsService } from './forum-threads.service';
import { ForumThreadsController } from './forum-threads.controller';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { ForumCommentsService } from './forum-comments.service';
import { ForumCommentsController } from './forum-comments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ForumCategoriesController,
    ForumThreadsController,
    ForumCommentsController,
    ForumController,
  ],
  providers: [
    ForumCategoriesService, 
    ForumThreadsService, 
    ForumCommentsService,
    ForumService,
  ],
  exports: [
    ForumCategoriesService, 
    ForumThreadsService, 
    ForumCommentsService,
    ForumService,
  ],
})
export class ForumModule {}
