import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async getCategories() {
    return this.prisma.forum_categories.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Topics
  async getTopicsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.forums.findMany({
        where: {
          categoryId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.forums.count({
        where: {
          categoryId,
          isActive: true,
        },
      }),
    ]);

    return {
      topics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Posts
  async getPostsByTopic(topicId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.forum_posts.findMany({
        where: {
          threadId: topicId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.forum_posts.count({
        where: {
          threadId: topicId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostWithComments(id: string) {
    const post = await this.prisma.forum_posts.findUnique({
      where: { id, isDeleted: false },
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  async createPost(createPostDto: CreatePostDto, userId: number) {
    // Verify topic exists
    const topic = await this.prisma.forum_threads.findFirst({
      where: {
        id: createPostDto.topicId,
      },
    });

    if (!topic) {
      throw new HttpException(
        'Topic not found or inactive',
        HttpStatus.NOT_FOUND,
      );
    }

      // Use raw SQL to avoid type issues
      const postId = randomUUID();
      await this.prisma.$executeRawUnsafe(
        'INSERT INTO forum_posts (id, content, threadId, authorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        postId,
        createPostDto.content,
        createPostDto.topicId,
        userId,
        new Date(),
        new Date()
      );

      // Fetch the created post with relations
      const createdPost = await this.prisma.forum_posts.findUnique({
        where: { id: postId },
      });

      return createdPost;
  }

  // Comments
  async createComment(createCommentDto: CreateCommentDto, userId: number) {
    // Verify forum post exists
    const post = await this.prisma.forum_posts.findFirst({
      where: {
        id: createCommentDto.postId,
        isDeleted: false,
      },
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    // If parentId is provided, verify parent comment exists
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.forum_comments.findFirst({
        where: {
          id: createCommentDto.parentId,
          isDeleted: false,
        },
      });

      if (!parentComment) {
        throw new HttpException(
          'Parent comment not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    return this.prisma.forum_comments.create({
      data: {
        id: randomUUID(),
        comment: createCommentDto.comment,
        postId: createCommentDto.postId,
        authorId: userId,
        parentId: createCommentDto.parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async updateComment(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: number,
  ) {
    // Find comment and verify ownership
    const comment = await this.prisma.forum_comments.findFirst({
      where: {
        id,
      },
    });

    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    if (comment.authorId !== userId) {
      throw new HttpException(
        'You can only edit your own comments',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.prisma.forum_comments.update({
      where: { id },
      data: {
        comment: updateCommentDto.comment,
        updatedAt: new Date(),
      },
    });
  }

  async deleteComment(id: string, userId: number) {
    // Find comment and verify ownership
    const comment = await this.prisma.forum_comments.findFirst({
      where: {
        id,
      },
    });

    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    if (comment.authorId !== userId) {
      throw new HttpException(
        'You can only delete your own comments',
        HttpStatus.FORBIDDEN,
      );
    }

    // Soft delete the comment
    await this.prisma.forum_comments.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });
  }

  async likeComment(commentId: string, userId: number, isLike: boolean) {
    const comment = await this.prisma.forum_comments.findFirst({
      where: {
        id: commentId,
        isDeleted: false,
      },
    });

    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    const existingLike = await this.prisma.forum_comment_likes.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (isLike && !existingLike) {
      await this.prisma.forum_comment_likes.create({
        data: {
          id: randomUUID(),
          commentId,
          userId,
          createdAt: new Date(),
        },
      });
    }

    if (!isLike && existingLike) {
      await this.prisma.forum_comment_likes.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });
    }

    const likeCount = await this.prisma.forum_comment_likes.count({
      where: { commentId },
    });

    return {
      liked: isLike,
      likeCount,
    };
  }
}
