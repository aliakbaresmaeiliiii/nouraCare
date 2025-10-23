import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

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
                forum_threads: true,
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
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
        include: {
          _count: {
            select: {
              forum_threads: true,
            },
          },
          forum_threads: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
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
      this.prisma.forumPost.findMany({
        where: {
          threadId: topicId,
          isDeleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
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
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        forum_thread: {
          include: {
            forums: {
              include: {
                forum_categories: true,
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

    return this.prisma.forumPost.create({
      data: {
        content: createPostDto.content,
        threadId: createPostDto.topicId,
        authorId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
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
    // Verify forum thread exists
    const thread = await this.prisma.forum_threads.findFirst({
      where: {
        id: createCommentDto.id,
      },
    });

    if (!thread) {
      throw new HttpException('Thread not found', HttpStatus.NOT_FOUND);
    }

    // If parentId is provided, verify parent comment exists
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.forumPost.findFirst({
        where: {
          id: createCommentDto.parentId,
        },
      });

      if (!parentComment) {
        throw new HttpException(
          'Parent comment not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    return this.prisma.forumPost.create({
      data: {
        content: createCommentDto.content,
        threadId: createCommentDto.id,
        authorId: userId,
        parentId: createCommentDto.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            other_forum_posts: true,
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
    const comment = await this.prisma.forumPost.findFirst({
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

    return this.prisma.forumPost.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            other_forum_posts: true,
          },
        },
      },
    });
  }

  async deleteComment(id: string, userId: number) {
    // Find comment and verify ownership
    const comment = await this.prisma.forumPost.findFirst({
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

    // Delete the comment
    await this.prisma.forumPost.delete({
      where: { id },
    });
  }
}
