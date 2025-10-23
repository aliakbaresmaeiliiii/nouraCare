import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ForumCommentLikesService {
  constructor(private prismaService: PrismaService) {}

  async likeComment(commentId: string, userId: number) {
    try {
      // Check if comment exists
      const comment = await this.prismaService.forum_comments.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundException('Forum comment not found');
      }

      // Check if user exists
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user already liked this comment
      const existingLike = await this.prismaService.forum_comment_likes.findUnique({
        where: {
          commentId_userId: {
            commentId: commentId,
            userId: userId,
          },
        },
      });

      if (existingLike) {
        throw new ConflictException('You have already liked this comment');
      }

      // Create the like
      const likeId = uuidv4();
      const like = await this.prismaService.forum_comment_likes.create({
        data: {
          id: likeId,
          commentId: commentId,
          userId: userId,
          createdAt: new Date(),
        },
        include: {
          comment: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  replies: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      });

      return like;
    } catch (error) {
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        throw new ConflictException('You have already liked this comment');
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
      console.error('Unexpected error liking forum comment:', error);
      throw new BadRequestException('Failed to like forum comment. Please try again.');
    }
  }

  async unlikeComment(commentId: string, userId: number) {
    try {
      // Check if like exists
      const existingLike = await this.prismaService.forum_comment_likes.findUnique({
        where: {
          commentId_userId: {
            commentId: commentId,
            userId: userId,
          },
        },
      });

      if (!existingLike) {
        throw new NotFoundException('Like not found');
      }

      // Delete the like
      await this.prismaService.forum_comment_likes.delete({
        where: {
          id: existingLike.id,
        },
      });

      return { message: 'Comment unliked successfully' };
    } catch (error) {
      // Handle Prisma-specific errors
      if (error.code === 'P2025') {
        throw new NotFoundException('Like not found');
      }

      // Re-throw NestJS exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log unexpected errors and throw generic error
      console.error('Unexpected error unliking forum comment:', error);
      throw new BadRequestException('Failed to unlike forum comment. Please try again.');
    }
  }

  async getCommentLikes(commentId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prismaService.forum_comment_likes.findMany({
        where: {
          commentId: commentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.forum_comment_likes.count({
        where: {
          commentId: commentId,
        },
      }),
    ]);

    return {
      likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserLikes(userId: number, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prismaService.forum_comment_likes.findMany({
        where: {
          userId: userId,
        },
        include: {
          comment: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  replies: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.forum_comment_likes.count({
        where: {
          userId: userId,
        },
      }),
    ]);

    return {
      likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async checkUserLike(commentId: string, userId: number) {
    const like = await this.prismaService.forum_comment_likes.findUnique({
      where: {
        commentId_userId: {
          commentId: commentId,
          userId: userId,
        },
      },
    });

    return {
      hasLiked: !!like,
      like: like || null,
    };
  }
}
