import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { LikeCommentDto } from './dto/like-comment.dto';

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async getCategories() {
    return this.prisma.forumCategory.findMany({
      where: { isActive: true },
      include: {
        forum_thread: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                forum_posts: {
                  where: { isDeleted: false },
                },
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  // Topics
  async getTopicsByCategory(categoryId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [topics, total] = await Promise.all([
      this.prisma.forum_thread.findMany({
        where: { 
          categoryId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              forum_posts: {
                where: { isDeleted: false },
              },
            },
          },
          forum_posts: {
            where: { isDeleted: false },
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
      this.prisma.forum_thread.count({
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
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  async createPost(createPostDto: CreatePostDto, userId: number) {
    // Verify topic exists
    const topic = await this.prisma.forum_thread.findFirst({
      where: { 
        id: createPostDto.topicId,
      },
    });

    if (!topic) {
      throw new HttpException('Topic not found or inactive', HttpStatus.NOT_FOUND);
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
    const thread = await this.prisma.forum_thread.findFirst({
      where: { 
        id: createCommentDto.id,
      },
    });

    if (!thread) {
      throw new HttpException('Thread not found', HttpStatus.NOT_FOUND);
    }

    // If parentId is provided, verify parent comment exists
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.forumComment.findFirst({
        where: { 
          id: createCommentDto.parentId,
        },
      });

      if (!parentComment) {
        throw new HttpException('Parent comment not found', HttpStatus.NOT_FOUND);
      }
    }

    return this.prisma.forumComment.create({
      data: {
        content: createCommentDto.content,
        threadId: createCommentDto.id,
        authorId: userId,
        parentId: createCommentDto.parentId,
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
  }

  async updateComment(id: string, updateCommentDto: UpdateCommentDto, userId: number) {
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
      throw new HttpException('You can only edit your own comments', HttpStatus.FORBIDDEN);
    }

    return this.prisma.forumComment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
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
      throw new HttpException('You can only delete your own comments', HttpStatus.FORBIDDEN);
    }

    // Delete the comment
    await this.prisma.forumComment.delete({
      where: { id },
    });
  }

  // Simple Like System for Comments
  async toggleCommentLike(commentId: string, userId: number) {
    // Check if comment exists
    const comment = await this.prisma.forumComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    // Check if user already liked this comment
    const existingLike = await this.prisma.forumCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the comment
      await this.prisma.forumCommentLike.delete({
        where: {
          commentId_userId: {
            commentId: commentId,
            userId,
          },
        },
      });
    } else {
      // Like the comment
      await this.prisma.forumCommentLike.create({
        data: {
          commentId: commentId,
          userId,
        },
      });
    }

    // Get updated like count
    const likeCount = await this.prisma.forumCommentLike.count({
      where: { commentId: commentId },
    });

    return {
      likeCount,
      userLiked: !existingLike,
    };
  }

  async getCommentLikes(commentId: string) {
    // Check if comment exists
    const comment = await this.prisma.forumComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    // Get likes with user information
    const likes = await this.prisma.forumCommentLike.findMany({
      where: { commentId: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const likeCount = likes.length;

    return {
      likes,
      likeCount,
    };
  }

  // Enhanced Like/Dislike System
  async toggleCommentReaction(commentId: string, userId: number, likeCommentDto: LikeCommentDto) {
    // Check if comment exists
    const comment = await this.prisma.forumComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    // Check if user already has a reaction on this comment
    const existingReaction = await this.prisma.forumCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction if clicking the same button again (temporary until Prisma is regenerated)
      await this.prisma.forumCommentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });
    } else {
      // Create new reaction (temporary - will use isLike field after Prisma regeneration)
      await this.prisma.forumCommentLike.create({
        data: {
          commentId,
          userId,
        },
      });
    }

    // Get updated reaction counts (temporary - will separate likes/dislikes after Prisma regeneration)
    const likeCount = await this.prisma.forumCommentLike.count({
      where: { commentId },
    });

    // Get user's current reaction
    const userReaction = await this.prisma.forumCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    return {
      likeCount,
      dislikeCount: 0, // Temporary until dislike functionality is implemented
      userReaction: userReaction ? true : null, // Temporary - will use isLike field
    };
  }

  async getCommentReactions(commentId: string) {
    // Check if comment exists
    const comment = await this.prisma.forumComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    // Get reactions with user information
    const reactions = await this.prisma.forumCommentLike.findMany({
      where: { commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const likeCount = reactions.length; // Temporary - all reactions are likes for now
    const dislikeCount = 0; // Temporary until dislike functionality is implemented

    return {
      reactions,
      likeCount,
      dislikeCount,
    };
  }

  // Get comments with reactions included
  async getCommentsWithReactions(threadId: string, userId?: number) {
    const comments = await this.prisma.forumComment.findMany({
      where: { 
        threadId,
        parentId: null, // Only top-level comments
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        replies: {
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
                likes: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform comments to include reaction counts and user's reaction
    const commentsWithReactions = await Promise.all(
      comments.map(async (comment) => {
        const likeCount = await this.prisma.forumCommentLike.count({
          where: { commentId: comment.id },
        });

        // Check if current user has liked this comment
        let userReaction = null;
        if (userId) {
          const userLike = await this.prisma.forumCommentLike.findUnique({
            where: {
              commentId_userId: {
                commentId: comment.id,
                userId,
              },
            },
          });
          userReaction = userLike ? true : null;
        }

        return {
          ...comment,
          likeCount,
          dislikeCount: 0, // Temporary until dislike functionality is implemented
          userReaction,
        };
      })
    );

    return commentsWithReactions;
  }
}
