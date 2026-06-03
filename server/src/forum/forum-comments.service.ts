import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { randomUUID } from 'crypto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { assertNoProfanity } from '../common/utils/profanity-filter.util';

@Injectable()
export class ForumCommentsService {
  constructor(private prismaService: PrismaService) {}

  async create(createCommentDto: any, postId: number) {
    try {
      const normalizedComment =
        createCommentDto.comment?.trim() || createCommentDto.content?.trim();
      const postOrThreadId =
        createCommentDto.postId || createCommentDto.id || createCommentDto.threadId;
      const normalizedParentId =
        typeof createCommentDto.parentId === 'string' &&
        createCommentDto.parentId.trim() === ''
          ? null
          : createCommentDto.parentId;

      // Validate input
      if (!normalizedComment) {
        throw new BadRequestException('Content is required');
      }
      if (!postOrThreadId) {
        throw new BadRequestException('Post ID is required');
      }

      assertNoProfanity(normalizedComment);

      // Try direct post lookup first
      let targetPost = await this.prismaService.forum_posts.findUnique({
        where: { id: postOrThreadId },
      });

      // If payload passed a threadId, map it to one post of that thread
      if (!targetPost) {
        targetPost = await this.prismaService.forum_posts.findFirst({
          where: { threadId: postOrThreadId, isDeleted: false },
          orderBy: { createdAt: 'asc' },
        });
      }

      // If thread exists but has no posts yet, create a root post so comments/replies can attach
      if (!targetPost) {
        const thread = await this.prismaService.forum_threads.findUnique({
          where: { id: postOrThreadId },
        });
        if (thread) {
          targetPost = await this.prismaService.forum_posts.create({
            data: {
              id: randomUUID(),
              content: thread.content || thread.title || 'Thread starter',
              threadId: thread.id,
              authorId: postId,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }

      if (!targetPost) {
        throw new NotFoundException('Forum post or thread not found');
      }

      // Check if parent comment exists (if provided)
      if (normalizedParentId) {
        const parentComment = await this.prismaService.forum_comments.findUnique({
          where: { id: normalizedParentId },
        });

        if (!parentComment) {
          throw new NotFoundException('Parent comment not found');
        }
      }

      // Check if user exists
      const user = await this.prismaService.user.findUnique({
        where: { id: postId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create the comment
      const commentId = randomUUID();
      const comment = await this.prismaService.forum_comments.create({
        data: {
          id: commentId,
          comment: normalizedComment,
          postId: targetPost.id,
          authorId: postId,
          parentId: normalizedParentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return comment;
    } catch (error) {
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        throw new ConflictException('A comment with similar data already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid foreign key reference');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Referenced record not found');
      }

      // Re-throw NestJS exceptions
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }

      // Log unexpected errors and throw generic error
      console.error('Unexpected error creating forum comment:', error);
      throw new BadRequestException('Failed to create forum comment. Please try again.');
    }
  }

  async findByPost(postId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prismaService.forum_comments.findMany({
        where: {
          postId: postId,
          isDeleted: false,
          parentId: null, // Only get top-level comments
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.forum_comments.count({
        where: {
          postId: postId,
          isDeleted: false,
          parentId: null,
        },
      }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findReplies(commentId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prismaService.forum_comments.findMany({
        where: {
          parentId: commentId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prismaService.forum_comments.count({
        where: {
          parentId: commentId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      replies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
      const comment = await this.prismaService.forum_comments.findUnique({
        where: { id },
      });

    if (!comment) {
      throw new NotFoundException('Forum comment not found');
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: number) {
    const comment = await this.prismaService.forum_comments.findFirst({
      where: { id, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundException('Forum comment not found');
    }

    if (Number(comment.authorId) !== Number(userId)) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const normalizedComment = updateCommentDto.comment?.trim();
    if (!normalizedComment) {
      throw new BadRequestException('Comment content is required');
    }

    assertNoProfanity(normalizedComment);

    return this.prismaService.forum_comments.update({
      where: { id },
      data: {
        comment: normalizedComment,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string, userId: number) {
    const comment = await this.prismaService.forum_comments.findFirst({
      where: { id, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundException('Forum comment not found');
    }

    if (Number(comment.authorId) !== Number(userId)) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Hard delete the comment and its direct replies from DB.
    return this.prismaService.$transaction(async (tx) => {
      const replyIds = (
        await tx.forum_comments.findMany({
          where: { parentId: id },
          select: { id: true },
        })
      ).map((item) => item.id);
      const targets = [id, ...replyIds];

      await tx.forum_comment_likes.deleteMany({
        where: { commentId: { in: targets } },
      });
      await tx.forum_comments.deleteMany({
        where: { parentId: id },
      });
      return tx.forum_comments.delete({
        where: { id },
      });
    });
  }
}
