import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import { ForumThreadsService } from './forum-threads.service';
import { CreateForumThreadDto } from './dto/create-forum-thread.dto';
import { UpdateForumThreadDto } from './dto/update-forum-thread.dto';

@Controller('api/v1/forum-threads')
export class ForumThreadsController {
  constructor(private readonly forumThreadsService: ForumThreadsService) {}

  @Post()
  async create(
    @Body() createForumThreadDto: CreateForumThreadDto,
    @Req() req: any,
  ) {
    // In a real implementation, you would get the user ID from the authenticated request
    const authorId = req.user?.id || 1; // Default to user ID 1 for testing

    const thread = await this.forumThreadsService.create(
      createForumThreadDto,
      authorId,
    );
    return {
      success: true,
      message: 'Forum thread created successfully',
      data: thread,
    };
  }

  @Get()
  async findAll(
    @Query('forumId') forumId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.forumThreadsService.findAll(
      forumId,
      parseInt(page),
      parseInt(limit),
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('category/:categoryId')
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.forumThreadsService.findByCategory(
      categoryId,
      parseInt(page),
      parseInt(limit),
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    if (!query) {
      return {
        success: true,
        data: {
          threads: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
      };
    }

    const result = await this.forumThreadsService.search(
      query,
      parseInt(page),
      parseInt(limit),
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const thread = await this.forumThreadsService.findOne(id);
    return {
      success: true,
      data: thread,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateForumThreadDto: UpdateForumThreadDto,
    @Req() req: any,
  ) {
    // In a real implementation, you would get the user ID from the authenticated request
    const userId = req.user?.id || 1; // Default to user ID 1 for testing

    const thread = await this.forumThreadsService.update(
      id,
      updateForumThreadDto,
      userId,
    );
    return {
      success: true,
      message: 'Forum thread updated successfully',
      data: thread,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: any) {
    // In a real implementation, you would get the user ID from the authenticated request
    const userId = req.user?.id || 1; // Default to user ID 1 for testing

    await this.forumThreadsService.remove(id, userId);
    return {
      success: true,
      message: 'Forum thread deleted successfully',
    };
  }

  @Post(':id/pin')
  async togglePin(@Param('id') id: string) {
    const thread = await this.forumThreadsService.togglePin(id);
    return {
      success: true,
      message: thread.isPinned
        ? 'Thread pinned successfully'
        : 'Thread unpinned successfully',
      data: thread,
    };
  }

  @Post(':id/lock')
  async toggleLock(@Param('id') id: string) {
    const thread = await this.forumThreadsService.toggleLock(id);
    return {
      success: true,
      message: thread.isLocked
        ? 'Thread locked successfully'
        : 'Thread unlocked successfully',
      data: thread,
    };
  }
}
