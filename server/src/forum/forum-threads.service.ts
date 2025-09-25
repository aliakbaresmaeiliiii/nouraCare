import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateForumThreadDto } from './dto/create-forum-thread.dto';
import { UpdateForumThreadDto } from './dto/update-forum-thread.dto';

@Injectable()
export class ForumThreadsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createForumThreadDto: CreateForumThreadDto, authorId: number) {
    // Check if forum exists
    const forum = await this.prismaService.forum.findUnique({
      where: { id: createForumThreadDto.forumId },
    });

    if (!forum) {
      throw new NotFoundException('Forum not found');
    }

    // Check if forum is active
    if (!forum.isActive) {
      throw new ConflictException('Cannot create thread in inactive forum');
    }

    return this.prismaService.forumThread.create({
      data: {
        title: createForumThreadDto.title,
        content: createForumThreadDto.content,
        forumId: createForumThreadDto.forumId,
        authorId,
        isPinned: createForumThreadDto.isPinned || false,
        isLocked: createForumThreadDto.isLocked || false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        forum: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });
  }

  async findAll(forumId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const where = forumId ? { forumId } : {};

    const [threads, total] = await Promise.all([
      this.prismaService.forumThread.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          forum: {
            include: {
              category: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prismaService.forumThread.count({ where }),
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
    const thread = await this.prismaService.forumThread.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        forum: {
          include: {
            category: true,
          },
        },
        posts: {
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
            posts: true,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    // Increment view count
    await this.prismaService.forumThread.update({
      where: { id },
      data: { viewCount: thread.viewCount + 1 },
    });

    return thread;
  }

  async update(id: string, updateForumThreadDto: UpdateForumThreadDto, userId: number) {
    const thread = await this.prismaService.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    // Check if user is the author
    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only update your own threads');
    }

    return this.prismaService.forumThread.update({
      where: { id },
      data: updateForumThreadDto,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        forum: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: number) {
    const thread = await this.prismaService.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    // Check if user is the author
    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own threads');
    }

    return this.prismaService.forumThread.delete({
      where: { id },
    });
  }

  async togglePin(id: string) {
    const thread = await this.prismaService.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    return this.prismaService.forumThread.update({
      where: { id },
      data: { isPinned: !thread.isPinned },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async toggleLock(id: string) {
    const thread = await this.prismaService.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Forum thread not found');
    }

    return this.prismaService.forumThread.update({
      where: { id },
      data: { isLocked: !thread.isLocked },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async findByCategory(categoryId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      this.prismaService.forumThread.findMany({
        where: {
          forum: {
            categoryId,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          forum: {
            include: {
              category: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prismaService.forumThread.count({
        where: {
          forum: {
            categoryId,
          },
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

  async search(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      this.prismaService.forumThread.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
          ],
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          forum: {
            include: {
              category: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prismaService.forumThread.count({
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
