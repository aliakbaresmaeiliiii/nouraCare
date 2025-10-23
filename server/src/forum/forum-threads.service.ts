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

      // Find or create a forum for this category
      let forum = await this.prismaService.forums.findFirst({
        where: { categoryId: createForumThreadDto.categoryId }
      });

      // If no forum exists for this category, create one
      if (!forum) {
        forum = await this.prismaService.forums.create({
          data: {
            id: uuidv4(),
            title: `${category.name} Discussions`,
            description: `Discussion forum for ${category.name}`,
            categoryId: createForumThreadDto.categoryId,
            createdById: authorId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any
        });
      }


      // Generate UUID for the thread ID
      const threadId = uuidv4();

      // Create the forum thread
      const createdThread = await this.prismaService.forum_threads.create({
        data: {
          title: createForumThreadDto.title.trim(),
          content: createForumThreadDto.description.trim(),
          forumId: forum.id,
          authorId: authorId,
          id: threadId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          forums: {
            include: {
              forum_categories: true,
            },
          },
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
      // Get forum IDs that belong to this category
      const forumsInCategory = await this.prismaService.forums.findMany({
        where: { categoryId },
        select: { id: true }
      });
      
      const forumIds = forumsInCategory.map(forum => forum.id);
      where.forumId = { in: forumIds };
    }

    const [threads, total] = await Promise.all([
      this.prismaService.forum_threads.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          forums: {
            include: {
              forum_categories: true,
            },
          },
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
      this.prismaService.forum_threads.count({ where }),
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
    const thread = await this.prismaService.forum_threads.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        forums: {
          include: {
            forum_categories: true,
          },
        },
        forum_posts: {
          where: {
            isDeleted: false,
          },
          include: {
           
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
    const thread = await this.prismaService.forum_threads.findFirst({
      where: { forumId: categoryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        forums: {
          include: {
            forum_categories: true,
          },
        },
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
    const thread = await this.prismaService.forum_threads.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    // Check if user is the creator of the thread
    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only update your own forum threads');
    }

    const updateData: any = {};
    
    if (updateForumThreadDto.title?.trim()) {
      updateData.title = updateForumThreadDto.title;
    }
    
    if (updateForumThreadDto.description?.trim()) {
      updateData.content = updateForumThreadDto.description;
    }

    return this.prismaService.forum_threads.update({
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
        forums: {
          include: {
            forum_categories: true,
          },
        },
        _count: {
          select: {
            forum_posts: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: number) {
    const thread = await this.prismaService.forum_threads.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    // Check if user is the creator of the thread
    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own forum threads');
    }

    // Delete the forum thread (hard delete since there's no soft delete field)
    return this.prismaService.forum_threads.delete({
      where: { id },
    });
  }

  async search(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      this.prismaService.forum_threads.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
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
          forums: {
            include: {
              forum_categories: true,
            },
          },
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
      this.prismaService.forum_threads.count({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
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
