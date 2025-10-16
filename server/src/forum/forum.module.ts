import { Module } from '@nestjs/common';
import { ForumCategoriesService } from './forum-categories.service';
import { ForumCategoriesController } from './forum-categories.controller';
import { ForumThreadsService } from './forum-threads.service';
import { ForumThreadsController } from './forum-threads.controller';
import { ForumPostsService } from './forum-posts.service';
import { ForumPostsController } from './forum-posts.controller';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ForumCategoriesController,
    ForumThreadsController,
    ForumPostsController,
    ForumController,
  ],
  providers: [
    ForumCategoriesService, 
    ForumThreadsService, 
    ForumPostsService,
    ForumService,
  ],
  exports: [ForumCategoriesService, ForumThreadsService, ForumPostsService, ForumService],
})
export class ForumModule {}
