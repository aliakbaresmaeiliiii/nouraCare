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
import { Public } from '../auth/decorators/public.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('forum-comments')
export class ForumCommentsController {
  constructor(private readonly forumCommentsService: ForumCommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    const comment = await this.forumCommentsService.create(
      createCommentDto,
      req.user.id,
    );
    return {
      success: true,
      data: comment,
    };
  }

  @Public()
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

  @Public()
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

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.forumCommentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ) {
    const data = await this.forumCommentsService.update(
      id,
      updateCommentDto,
      req.user.id,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    const data = await this.forumCommentsService.remove(id, req.user.id);
    return { success: true, data };
  }
}
