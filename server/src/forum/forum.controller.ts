import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { ForumService } from './forum.service';

@Controller('api/v1/forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // Categories
  @Get('categories')
  async getCategories() {
    const categories = await this.forumService.getCategories();
    return {
      success: true,
      data: categories,
    };
  }

  // Topics
  @Get('topics/:categoryId')
  async getTopicsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.forumService.getTopicsByCategory(
      categoryId,
      parseInt(page),
      parseInt(limit),
    );
    return {
      success: true,
      data: result,
    };
  }

  // Posts
  @Get('posts/:topicId')
  async getPostsByTopic(
    @Param('topicId') topicId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.forumService.getPostsByTopic(
      topicId,
      parseInt(page),
      parseInt(limit),
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('post/:id')
  async getPostWithComments(@Param('id') id: string) {
    const post = await this.forumService.getPostWithComments(id);
    return {
      success: true,
      data: post,
    };
  }

  @Post('post')
  @UseGuards(JwtAuthGuard)
  async createPost(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    const userId = req.user.id;
    const post = await this.forumService.createPost(createPostDto, userId);
    return {
      success: true,
      message: 'Post created successfully',
      data: post,
    };
  }

  // Comments
  @Post('create-comment')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const comment = await this.forumService.createComment(
      createCommentDto,
      userId,
    );
    return {
      success: true,
      message: createCommentDto.parentId
        ? 'Reply created successfully'
        : 'Comment created successfully',
      data: comment,
    };
  }

  @Put('comment/:id')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const comment = await this.forumService.updateComment(
      id,
      updateCommentDto,
      userId,
    );
    return {
      success: true,
      message: 'Comment updated successfully',
      data: comment,
    };
  }

  @Delete('comment/:id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    await this.forumService.deleteComment(id, userId);
    return {
      success: true,
      message: 'Comment deleted successfully',
    };
  }
}
