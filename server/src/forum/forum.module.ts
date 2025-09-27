import { Module } from '@nestjs/common';
import { ForumCategoriesService } from './forum-categories.service';
import { ForumCategoriesController } from './forum-categories.controller';
import { ForumThreadsService } from './forum-threads.service';
import { ForumThreadsController } from './forum-threads.controller';
import { ForumPostsService } from './forum-posts.service';
import { ForumPostsController } from './forum-posts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ForumCategoriesController,
    ForumThreadsController,
    ForumPostsController,
  ],
  providers: [ForumCategoriesService, ForumThreadsService, ForumPostsService],
  exports: [ForumCategoriesService, ForumThreadsService, ForumPostsService],
})
export class ForumModule {}
