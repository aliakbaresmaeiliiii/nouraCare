import { Module } from '@nestjs/common';
import { ForumCategoriesService } from './forum-categories.service';
import { ForumCategoriesController } from './forum-categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ForumCategoriesController],
  providers: [ForumCategoriesService],
  exports: [ForumCategoriesService],
})
export class ForumModule {}
