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
import { ForumPostsService } from './forum-posts.service';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';

@Controller('api/v1/forum-posts')
export class ForumPostsController {
  constructor(private readonly forumPostsService: ForumPostsService) {}

  @Post()
  async create(@Body() createForumPostDto: CreateForumPostDto, @Req() req: any) {
    // In a real implementation, you would get the user ID from the authenticated request
    const authorId = req.user?.id || 1; // Default to user ID 1 for testing

    const post = await this.forumPostsService.create(createForumPostDto, authorId);
    return {
      success: true,
      message: createForumPostDto.parentId ? 'Reply created successfully' : 'Forum post created successfully',
      data: post,
    };
  }

  @Get('thread/:threadId')
  async findAll(
    @Param('threadId') threadId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.forumPostsService.findAll(
      threadId,
      parseInt(page),
      parseInt(limit),
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('replies/:parentId')
  async findReplies(
    @Param('parentId') parentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.forumPostsService.findReplies(
      parentId,
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
    const post = await this.forumPostsService.findOne(id);
    return {
      success: true,
      data: post,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateForumPostDto: UpdateForumPostDto,
    @Req() req: any,
  ) {
    // In a real implementation, you would get the user ID from the authenticated request
    const userId = req.user?.id || 1; // Default to user ID 1 for testing

    const post = await this.forumPostsService.update(id, updateForumPostDto, userId);
    return {
      success: true,
      message: 'Forum post updated successfully',
      data: post,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: any) {
    // In a real implementation, you would get the user ID from the authenticated request
    const userId = req.user?.id || 1; // Default to user ID 1 for testing

    await this.forumPostsService.remove(id, userId);
    return {
      success: true,
      message: 'Forum post deleted successfully',
    };
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Req() req: any) {
    // In a real implementation, you would get the user ID from the authenticated request
    const userId = req.user?.id || 1; // Default to user ID 1 for testing

    const post = await this.forumPostsService.toggleLike(id, userId);
    return {
      success: true,
      message: post._count.likes > 0 ? 'Post liked successfully' : 'Post unliked successfully',
      data: post,
    };
  }
}
