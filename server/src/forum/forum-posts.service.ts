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
  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  async create(createForumPostDto: CreateForumPostDto, authorId: number) {
    let threadId = createForumPostDto.threadId;

    // First, verify that the author exists
    const author = await this.prismaService.user.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    // If categoryId is provided but threadId is not, create a new thread
    if (createForumPostDto.categoryId && !threadId) {
      if (!createForumPostDto.title) {
        throw new NotFoundException('Title is required when creating a new thread');
      }

      // Find or create a forum in the specified category
      let forum = await this.prismaService.forum.findFirst({
        where: { categoryId: createForumPostDto.categoryId },
      });

      if (!forum) {
        // Create a default forum for this category
        const category = await this.prismaService.forumCategory.findUnique({
          where: { id: createForumPostDto.categoryId },
        });

        if (!category) {
          throw new NotFoundException('Category not found');
        }

        forum = await this.prismaService.forum.create({
          data: {
            title: `${category.name} Forum`,
            description: `Default forum for ${category.name} category`,
            categoryId: createForumPostDto.categoryId,
            createdById: authorId,
          },
        });
      }

      // Create a new thread - use the title and content for the thread
      const newThread = await this.prismaService.forumThread.create({
        data: {
          title: createForumPostDto.title,
          content: createForumPostDto.content, // Thread content is the post content
          forumId: forum.id,
          authorId,
        },
      });

      threadId = newThread.id;
    }

    // If threadId is still not set, throw error
    if (!threadId) {
      throw new NotFoundException('Either threadId or categoryId with title is required');
    }

    // Check if thread exists
    const thread = await this.prismaService.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    // Check if thread is locked
    if (thread.isLocked) {
      throw new ForbiddenException('Cannot post in a locked thread');
    }

    // If this is a reply, check if parent post exists
    if (createForumPostDto.parentId) {
      const parentPost = await this.prismaService.forumPost.findUnique({
        where: { id: createForumPostDto.parentId },
      });

      if (!parentPost) {
        throw new NotFoundException('Parent post not found');
      }

      // Ensure parent post belongs to the same thread
      if (parentPost.threadId !== threadId) {
        throw new ForbiddenException(
          'Parent post does not belong to the same thread',
        );
      }
    }

    const createdPost = await this.prismaService.forumPost.create({
      data: {
        content: createForumPostDto.content,
        threadId,
        authorId,
        parentId: createForumPostDto.parentId,
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
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
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    // Real-time events removed - WebSocket functionality disabled

    return createdPost;
  }

  async findAll(threadId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prismaService.forumPost.findMany({
        where: {
          threadId,
          parentId: null, // Only get top-level posts (not replies)
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
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              likes: true,
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prismaService.forumPost.count({
        where: {
          threadId,
          parentId: null,
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
      this.prismaService.forumPost.findMany({
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
              likes: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prismaService.forumPost.count({
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
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
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
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
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
      where: { id },
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
        ...updateForumPostDto,
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
        parent: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
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
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    // Real-time events removed - WebSocket functionality disabled

    return updatedPost;
  }

  async remove(id: string, currentUser: any) {
    const post = await this.prismaService.forumPost.findUnique({
      where: { id },
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

    // Soft delete by marking as deleted
    const deletedPost = await this.prismaService.forumPost.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Real-time events removed - WebSocket functionality disabled

    return deletedPost;
  }

  async toggleLike(postId: string, userId: number) {
    const post = await this.prismaService.forumPost.findUnique({
      where: { id: postId },
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
            replies: true,
          },
        },
      },
    });

    // Real-time events removed - WebSocket functionality disabled

    return updatedPost;
  }

  async editComment(commentId: string, content: string, currentUser: any) {
    const comment = await this.prismaService.forumPost.findUnique({
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

    const updatedComment = await this.prismaService.forumPost.update({
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
        parent: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
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
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    // Real-time events removed - WebSocket functionality disabled

    return updatedComment;
  }

  async deleteComment(commentId: string, currentUser: any) {
    const comment = await this.prismaService.forumPost.findUnique({
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

    // Soft delete by marking as deleted
    const deletedComment = await this.prismaService.forumPost.update({
      where: { id: commentId },
      data: { isDeleted: true },
    });

    // Real-time events removed - WebSocket functionality disabled

    return deletedComment;
  }
}
