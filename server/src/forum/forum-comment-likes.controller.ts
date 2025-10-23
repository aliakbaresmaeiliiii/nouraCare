import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ForumCommentLikesService } from './forum-comment-likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/forum-comment-likes')
export class ForumCommentLikesController {
  constructor(private readonly forumCommentLikesService: ForumCommentLikesService) {}

  @Post('comment/:commentId/like')
  @UseGuards(JwtAuthGuard)
  likeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.forumCommentLikesService.likeComment(commentId, req.user.id);
  }

  @Delete('comment/:commentId/unlike')
  @UseGuards(JwtAuthGuard)
  unlikeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.forumCommentLikesService.unlikeComment(commentId, req.user.id);
  }

  @Get('comment/:commentId/likes')
  getCommentLikes(
    @Param('commentId') commentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.forumCommentLikesService.getCommentLikes(
      commentId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('user/:userId/likes')
  getUserLikes(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.forumCommentLikesService.getUserLikes(
      parseInt(userId),
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('comment/:commentId/check-like')
  @UseGuards(JwtAuthGuard)
  checkUserLike(@Param('commentId') commentId: string, @Request() req) {
    return this.forumCommentLikesService.checkUserLike(commentId, req.user.id);
  }

  @Get('my-likes')
  @UseGuards(JwtAuthGuard)
  getMyLikes(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Request() req,
  ) {
    return this.forumCommentLikesService.getUserLikes(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }
}
