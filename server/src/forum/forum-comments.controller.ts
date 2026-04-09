import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ForumCommentsService } from './forum-comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('forum-comments')
export class ForumCommentsController {
  constructor(private readonly forumCommentsService: ForumCommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createCommentDto: any, @Request() req) {
    const comment = await this.forumCommentsService.create(
      createCommentDto,
      req.user.id,
    );
    return {
      success: true,
      data: comment,
    };
  }

  @Get('post/:postId')
  findByPost(
    @Param('postId') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.forumCommentsService.findByPost(
      postId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('comment/:commentId/replies')
  findReplies(
    @Param('commentId') commentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.forumCommentsService.findReplies(
      commentId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.forumCommentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: any,
    @Request() req,
  ) {
    return this.forumCommentsService.update(id, updateCommentDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.forumCommentsService.remove(id, req.user.id);
  }
}
