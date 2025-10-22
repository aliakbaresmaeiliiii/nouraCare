import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateForumThreadDto } from './dto/create-forum-thread.dto';
import { UpdateForumThreadDto } from './dto/update-forum-thread.dto';
import { PrismaService } from '../prisma/services/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ForumThreadsService {
  constructor(private prismaService: PrismaService) {}


  async create(createForumThreadDto: CreateForumThreadDto, authorId: number) {
    try {
      // Validate input
      if (!createForumThreadDto.title?.trim()) {
        throw new BadRequestException('Title is required');
      }
      if (!createForumThreadDto.description?.trim()) {
        throw new BadRequestException('Description is required');
      }
      if (!createForumThreadDto.categoryId?.trim()) {
        throw new BadRequestException('Category ID is required');
      }

      // Validate title and description length
      if (createForumThreadDto.title.trim().length < 3) {
        throw new BadRequestException('Title must be at least 3 characters long');
      }
      if (createForumThreadDto.description.trim().length < 10) {
        throw new BadRequestException('Description must be at least 10 characters long');
      }

      // Check if category exists and is active
      const category = await this.prismaService.forumCategory.findUnique({
        where: { id: createForumThreadDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${createForumThreadDto.categoryId} not found`);
      }

      // Check if category is active
      if (!category.isActive) {
        throw new ConflictException('Cannot create thread in inactive category');
      }

      // Check if user exists
      const user = await this.prismaService.user.findUnique({
        where: { id: authorId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate UUID for the thread ID
      const threadId = uuidv4();

      // Create the forum thread with type assertion to bypass Prisma type issues
      const createdThread = await this.prismaService.forum_thread.create({
        data: {
          title: createForumThreadDto.title.trim(),
          description: createForumThreadDto.description.trim(),
          categoryId: createForumThreadDto.categoryId,
          createdById: authorId,
          isPublic: createForumThreadDto.isPublic || true,
          isActive: createForumThreadDto.isActive || true,
          updatedAt: new Date(),
          id: threadId,
        } as any, // Type assertion to bypass Prisma type issues
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          forum_categories: true,
          _count: {
            select: {
              forum_posts: true,
            },
          },
        },
      });

      return createdThread;
    } catch (error) {
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        throw new ConflictException('A thread with similar data already exists');
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
      console.error('Unexpected error creating forum thread:', error);
      throw new BadRequestException('Failed to create forum thread. Please try again.');
    }
  }

  async findAll(categoryId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [threads, total] = await Promise.all([
      this.prismaService.forum_thread.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          forum_categories: true,
          _count: {
            select: {
              forum_posts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.forum_thread.count({ where }),
    ]);

    return {
      threads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const thread = await this.prismaService.forum_thread.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        forum_categories: true,
        forum_comments: {
          where: {
            parentId: null, // Only get top-level comments (not replies)
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
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        forum_posts: {
          where: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            forum_posts: {
              where: {
                isDeleted: false,
              },
            },
            forum_comments: true,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    return thread;
  }

  async findByCategory(categoryId: string) {
    const thread = await this.prismaService.forum_thread.findFirst({
      where: { categoryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        forum_categories: true,
        _count: {
          select: {
            forum_posts: true,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found for this category');
    }

    return thread;
  }

  async update(
    id: string,
    updateForumThreadDto: UpdateForumThreadDto,
    userId: number,
  ) {
    const thread = await this.prismaService.forum_thread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    // Check if user is the creator of the thread
    if (thread.createdById !== userId) {
      throw new ForbiddenException('You can only update your own forum threads');
    }

    const updateData: any = {};
    
    if (updateForumThreadDto.title?.trim()) {
      updateData.title = updateForumThreadDto.title;
    }
    
    if (updateForumThreadDto.description?.trim()) {
      updateData.description = updateForumThreadDto.description;
    }

    if (updateForumThreadDto.isPublic !== undefined) {
      updateData.isPublic = updateForumThreadDto.isPublic;
    }

    if (updateForumThreadDto.isActive !== undefined) {
      updateData.isActive = updateForumThreadDto.isActive;
    }

    return this.prismaService.forum_thread.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        forum_categories: true,
        _count: {
          select: {
            forum_posts: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: number) {
    const thread = await this.prismaService.forum_thread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    // Check if user is the creator of the thread
    if (thread.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own forum threads');
    }

    // Delete the forum thread (hard delete since there's no soft delete field)
    return this.prismaService.forum_thread.delete({
      where: { id },
    });
  }

  async search(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      this.prismaService.forum_thread.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          forum_categories: true,
          _count: {
            select: {
              forum_posts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.forum_thread.count({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
      }),
    ]);

    return {
      threads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
