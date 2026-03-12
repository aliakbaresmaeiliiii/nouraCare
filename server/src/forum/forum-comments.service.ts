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

@Injectable()
export class ForumCommentsService {
  constructor(private prismaService: PrismaService) {}

  async create(createCommentDto: CreateCommentDto, authorId: number) {
    try {
      // Validate input
      if (!createCommentDto.content?.trim()) {
        throw new BadRequestException('Content is required');
      }
      if (!createCommentDto.postId) {
        throw new BadRequestException('Post ID is required');
      }

      // Check if post exists
      const post = await this.prismaService.forum_posts.findUnique({
        where: { id: createCommentDto.postId },
      });

      if (!post) {
        throw new NotFoundException('Forum post not found');
      }

      // Check if parent comment exists (if provided)
      if (createCommentDto.parentId) {
        const parentComment = await this.prismaService.forum_comments.findUnique({
          where: { id: createCommentDto.parentId },
        });

        if (!parentComment) {
          throw new NotFoundException('Parent comment not found');
        }
      }

      // Check if user exists
      const user = await this.prismaService.user.findUnique({
        where: { id: authorId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create the comment
      const commentId = randomUUID();
      const comment = await this.prismaService.forum_comments.create({
        data: {
          id: commentId,
          content: createCommentDto.content.trim(),
          postId: createCommentDto.postId,
          authorId: authorId,
          parentId: createCommentDto.parentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
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
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          replies: {
            where: { isDeleted: false },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              _count: {
                select: {
                  replies: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              replies: true,
            },
          },
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
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
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
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          replies: {
            where: { isDeleted: false },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              _count: {
                select: {
                  replies: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

    if (!comment) {
      throw new NotFoundException('Forum comment not found');
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: number) {
    const comment = await this.prismaService.forum_comments.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Forum comment not found');
    }

    // Check if user is the author of the comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const updateData: any = {};
    
    if (updateCommentDto.content?.trim()) {
      updateData.content = updateCommentDto.content.trim();
    }

    return this.prismaService.forum_comments.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: number) {
    const comment = await this.prismaService.forum_comments.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Forum comment not found');
    }

    // Check if user is the author of the comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete the comment
    return this.prismaService.forum_comments.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });
  }
}
