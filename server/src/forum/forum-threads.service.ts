import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { randomUUID } from 'crypto';
import { CreateForumThreadDto } from './dto/create-forum-thread.dto';
import { UpdateForumThreadDto } from './dto/update-forum-thread.dto';

@Injectable()
export class ForumThreadsService {
  constructor(private prismaService: PrismaService) {}

  async create(createForumThreadDto: CreateForumThreadDto, authorId: number) {
    try {
      const normalizedContent =
        createForumThreadDto.description?.trim() ||
        createForumThreadDto.content?.trim();

      // Validate input
      if (!createForumThreadDto.title?.trim()) {
        throw new BadRequestException('Title is required');
      }
      if (!normalizedContent) {
        throw new BadRequestException('Content is required');
      }
      if (!createForumThreadDto.categoryId?.trim()) {
        throw new BadRequestException('Category ID is required');
      }

      // Validate title and content length
      if (createForumThreadDto.title.trim().length < 3) {
        throw new BadRequestException(
          'Title must be at least 3 characters long',
        );
      }
      if (normalizedContent.length < 10) {
        throw new BadRequestException(
          'Content must be at least 10 characters long',
        );
      }

      // Check if category exists and is active
      const category = await this.prismaService.forum_categories.findUnique({
        where: { id: createForumThreadDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${createForumThreadDto.categoryId} not found`,
        );
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
        where: { categoryId: createForumThreadDto.categoryId },
      });

      // If no forum exists for this category, create one
      if (!forum) {
        forum = await this.prismaService.forums.create({
          data: {
            id: randomUUID(),
            title: `${category.name} Discussions`,
            description: `Discussion forum for ${category.name}`,
            categoryId: createForumThreadDto.categoryId,
            createdById: authorId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Generate UUID for the thread ID
      const threadId = randomUUID();

      // Create the forum thread
      const createdThread = await this.prismaService.forum_threads.create({
        data: {
          title: createForumThreadDto.title.trim(),
          content: normalizedContent,
          forumId: forum.id,
          authorId: authorId,
          id: threadId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return createdThread;
    } catch (error) {
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A thread with similar data already exists',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid foreign key reference');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Referenced record not found');
      }

      // Re-throw NestJS exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Log unexpected errors and throw generic error
      console.error('Unexpected error creating forum thread:', error);
      throw new BadRequestException(
        'Failed to create forum thread. Please try again.',
      );
    }
  }

  // async findAll(categoryId?: string, page: number = 1, limit: number = 20) {
  //   const skip = (page - 1) * limit;

  //   const where: any = {};

  //   if (categoryId) {
  //     // Get forum IDs that belong to this category
  //     const forumsInCategory = await this.prismaService.forums.findMany({
  //       where: { categoryId },
  //       select: { id: true },
  //     });

  //     const forumIds = forumsInCategory.map((forum) => forum.id);
  //     where.forumId = { in: forumIds };
  //   }

  //   const [threads, total] = await Promise.all([
  //     this.prismaService.forum_threads.findMany({
  //       where,
  //       include: {
  //         forums: {
  //           include: {
  //             category: true,
  //           },
  //         },
  //         forum_posts: {
  //           include: {
  //             _count: {
  //               select: { forum_comments: true },
  //             },
  //             forum_comments: {
  //               take: 1,
  //               orderBy: { createdAt: 'desc' },
  //             },
  //           },
  //         },
  //         user: {
  //           select: {
  //             id: true,
  //             fullName: true,
  //             email: true,
  //             user_profile: {
  //               select: {
  //                 avatarUrl: true,
  //                 bio: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //       orderBy: { createdAt: 'desc' },
  //       skip,
  //       take: limit,
  //     }),
  //     this.prismaService.forum_threads.count({ where }),
  //   ]);

  //   return {
  //     threads,
  //     pagination: {
  //       page,
  //       limit,
  //       total,
  //       totalPages: Math.ceil(total / limit),
  //     },
  //   };
  // }


  async findAll(categoryId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
  
    const where: any = {};
  
    if (categoryId) {
      const forumsInCategory = await this.prismaService.forums.findMany({
        where: { categoryId },
        select: { id: true },
      });
  
      where.forumId = {
        in: forumsInCategory.map(f => f.id),
      };
    }
  
    const [threads, total] = await Promise.all([
      this.prismaService.forum_threads.findMany({
        where,
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

  async findOne(threadId: string) {
    return this.prismaService.forum_threads.findUnique({
      where: { id: threadId },
    });
  }

  async findByCategory(categoryId: string) {
    const thread = await this.prismaService.forum_threads.findFirst({
      where: { forumId: categoryId },
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

    // Check if user is the author of the thread
    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only update your own threads');
    }

    const updateData: any = {};
    const normalizedUpdateContent =
      updateForumThreadDto.description?.trim() ||
      updateForumThreadDto.content?.trim();

    if (updateForumThreadDto.title?.trim()) {
      updateData.title = updateForumThreadDto.title.trim();
    }

    if (normalizedUpdateContent) {
      updateData.content = normalizedUpdateContent;
    }

    return this.prismaService.forum_threads.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: number) {
    const thread = await this.prismaService.forum_threads.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    // Check if user is the author of the thread
    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own threads');
    }

    // Delete the forum thread
    return this.prismaService.forum_threads.delete({
      where: { id },
    });
  }

  async search(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      this.prismaService.forum_threads.findMany({
        where: {
          OR: [{ title: { contains: query } }],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.forum_threads.count({
        where: {
          OR: [{ title: { contains: query } }],
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
