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

@Injectable()
export class ForumThreadsService {
  constructor(private prismaService: PrismaService) {}


  async create(createForumThreadDto: CreateForumThreadDto, authorId: number) {
    // Validate input
    if (!createForumThreadDto.title?.trim()) {
      throw new BadRequestException('Title is required');
    }
    if (!createForumThreadDto.content?.trim()) {
      throw new BadRequestException('Content is required');
    }
    if (!createForumThreadDto.categoryId) {
      throw new BadRequestException('Category ID is required');
    }

    // Check if forum exists and is active
    const forum = await this.prismaService.forums.findUnique({
      where: { id: createForumThreadDto.categoryId },
    });

    if (!forum) {
      throw new NotFoundException('Forum not found');
    }

    // Check if forum is active
    if (!forum.isActive) {
      throw new ConflictException('Cannot create thread in inactive forum');
    }

    // Create the forum thread
    return this.prismaService.forum_threads.create({
      data: {
        title: createForumThreadDto.title,
        content: createForumThreadDto.content,
        forumId: createForumThreadDto.categoryId,
        authorId: authorId,
        isPinned: createForumThreadDto.isPinned || false,
        isLocked: createForumThreadDto.isLocked || false,
      } as any, // Type assertion to bypass Prisma type issues
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

  async findAll(forumId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (forumId) {
      where.forumId = forumId;
    }

    const [threads, total] = await Promise.all([
      this.prismaService.forum_threads.findMany({
        where,
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
      throw new NotFoundException('Forum thread not found');
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

    // Check if thread is locked
    if (thread.isLocked) {
      throw new ConflictException('Cannot update a locked thread');
    }

    const updateData: any = {};
    
    if (updateForumThreadDto.title?.trim()) {
      updateData.title = updateForumThreadDto.title;
    }
    
    if (updateForumThreadDto.content?.trim()) {
      updateData.content = updateForumThreadDto.content;
    }

    if (updateForumThreadDto.isPinned !== undefined) {
      updateData.isPinned = updateForumThreadDto.isPinned;
    }

    if (updateForumThreadDto.isLocked !== undefined) {
      updateData.isLocked = updateForumThreadDto.isLocked;
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
