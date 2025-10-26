import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async getCategories() {
    return this.prisma.forumCategory.findMany({
      where: { isActive: true },
      include: {
        forums: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                forumThreads: true,
              },
            },
          },
        },
      },
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
      this.prisma.forum.findMany({
        where: {
          categoryId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              forumThreads: true,
            },
          },
          forumThreads: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              forumPosts: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  author: {
                    select: {
                      id: true,
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.forum.count({
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
      this.prisma.forumPost.findMany({
        where: {
          threadId: topicId,
          isDeleted: false,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.forumPost.count({
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
    const post = await this.prisma.forumPost.findUnique({
      where: { id, isDeleted: false },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
        thread: {
          include: {
            forum: {
              include: {
                category: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  async createPost(createPostDto: CreatePostDto, userId: number) {
    // Verify topic exists
    const topic = await this.prisma.forumThread.findFirst({
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

    return this.prisma.forumPost.create({
      data: {
        content: createPostDto.content,
        threadId: createPostDto.topicId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });
  }

  // Comments
  async createComment(createCommentDto: CreateCommentDto, userId: number) {
    // Verify forum post exists
    const post = await this.prisma.forumPost.findFirst({
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
      const parentComment = await this.prisma.forumComment.findFirst({
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

    return this.prisma.forumComment.create({
      data: {
        id: uuidv4(),
        content: createCommentDto.content,
        postId: createCommentDto.postId,
        authorId: userId,
        parentId: createCommentDto.parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async updateComment(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: number,
  ) {
    // Find comment and verify ownership
    const comment = await this.prisma.forumComment.findFirst({
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

    return this.prisma.forumComment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async deleteComment(id: string, userId: number) {
    // Find comment and verify ownership
    const comment = await this.prisma.forumComment.findFirst({
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
    await this.prisma.forumComment.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });
  }
}
