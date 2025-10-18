import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';

@Injectable()
export class ForumPostsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createForumPostDto: CreateForumPostDto, authorId: number) {
    // First, verify that the author exists
    const author = await this.prismaService.user.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    // Verify topic exists
    const topic = await this.prismaService.forum_thread.findFirst({
      where: {
        id: createForumPostDto.categoryId,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // If this is a reply, check if parent comment exists
    if (createForumPostDto.parentId) {
      const parentComment = await this.prismaService.comment.findFirst({
        where: {
          id: createForumPostDto.parentId,
        },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const createdPost = await this.prismaService.forumPost.create({
      data: {
        content: createForumPostDto.content,
        threadId: createForumPostDto.categoryId,
        authorId: authorId,
      },
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
            forum_categories: true,
            },
            },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    return createdPost;
  }

  async findAll(topicId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prismaService.forumPost.findMany({
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
      this.prismaService.forumPost.count({
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

  async findReplies(parentId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prismaService.comment.findMany({
        where: {
          parentId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
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
      this.prismaService.comment.count({
        where: {
          parentId,
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
    const post = await this.prismaService.forumPost.findUnique({
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
            forum_categories: true,
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
      throw new NotFoundException('Forum post not found');
    }

    return post;
  }

  async update(
    id: string,
    updateForumPostDto: UpdateForumPostDto,
    currentUser: any,
  ) {
    const post = await this.prismaService.forumPost.findUnique({
      where: { id, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException('Forum post not found');
    }

    // Check if the current user is the post author OR an admin
    const isOwner = post.authorId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const updatedPost = await this.prismaService.forumPost.update({
      where: { id },
      data: {
        content: updateForumPostDto.content,
        updatedAt: new Date(),
      },
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
            forum_categories: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    return updatedPost;
  }

  async remove(id: string, currentUser: any) {
    const post = await this.prismaService.forumPost.findUnique({
      where: { id, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException('Forum post not found');
    }

    // Check if the current user is the post author OR an admin
    const isOwner = post.authorId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete the post
    const deletedPost = await this.prismaService.forumPost.update({
      where: { id },
      data: { isDeleted: true },
    });

    return deletedPost;
  }

  async toggleLike(postId: string, userId: number) {
    const post = await this.prismaService.forumPost.findUnique({
      where: { id: postId, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException('Forum post not found');
    }

    // Check if user already liked the post
    const existingLike = await this.prismaService.forumPostLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await this.prismaService.forumPostLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
    } else {
      // Like the post
      await this.prismaService.forumPostLike.create({
        data: {
          postId,
          userId,
        },
      });
    }

    // Return updated post with like count
    const updatedPost = await this.prismaService.forumPost.findUnique({
      where: { id: postId },
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

    return updatedPost;
  }

  async editComment(commentId: string, content: string, currentUser: any) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if the current user is the comment author OR an admin
    const isOwner = comment.authorId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.prismaService.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async deleteComment(commentId: string, currentUser: any) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if the current user is the comment author OR an admin
    const isOwner = comment.authorId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete the comment
    const deletedComment = await this.prismaService.comment.delete({
      where: { id: commentId },
    });

    return deletedComment;
  }
}
