import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateForumCategoryDto } from './dto/create-forum-category.dto';
import { UpdateForumCategoryDto } from './dto/update-forum-category.dto';

@Injectable()
export class ForumCategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createForumCategoryDto: CreateForumCategoryDto) {
    // Check if name already exists
    const existingCategory = await this.prismaService.forumCategory.findUnique({
      where: { id: createForumCategoryDto.id },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prismaService.forumCategory.create({
      data: createForumCategoryDto,
      include: {
        forums: {
          include: {
            forumThreads: {
              include: {
                _count: {
                  select: {
                    forumPosts: {
                      where: { isDeleted: false },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prismaService.forumCategory.findMany({
      include: {
        forums: {
          include: {
            forumThreads: {
              include: {
                _count: {
                  select: {
                    forumPosts: {
                      where: { isDeleted: false },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prismaService.forumCategory.findUnique({
      where: { id },
      include: {
        forums: {
          include: {
            forumThreads: {
              include: {
                _count: {
                  select: {
                    forumPosts: {
                      where: { isDeleted: false },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    return category;
  }

  async findByName(id: string) {
    const category = await this.prismaService.forumCategory.findUnique({
      where: { id },
      include: {
        forums: {
          include: {
            forumThreads: {
              include: {
                _count: {
                  select: {
                    forumPosts: {
                      where: { isDeleted: false },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    return category;
  }

  async update(id: string, updateForumCategoryDto: UpdateForumCategoryDto) {
    // Check if category exists
    const existingCategory = await this.prismaService.forumCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Forum category not found');
    }

    // If name is being updated, check for conflicts
    if (
      updateForumCategoryDto.name &&
      updateForumCategoryDto.name !== existingCategory.name
    ) {
      const nameConflict = await this.prismaService.forumCategory.findUnique({
        where: { id: updateForumCategoryDto.id },
      });

      if (nameConflict) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prismaService.forumCategory.update({
      where: { id },
      data: updateForumCategoryDto,
      include: {
        forums: {
          include: {
            forumThreads: {
              include: {
                _count: {
                  select: {
                    forumPosts: {
                      where: { isDeleted: false },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Check if category exists
    const category = await this.prismaService.forumCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    // Check if category has forum threads
    const threadsCount = await this.prismaService.forumThread.count({
      where: { 
        forum: {
          categoryId: id
        }
      },
    });

    if (threadsCount > 0) {
      throw new ConflictException(
        'Cannot delete category that contains forum threads',
      );
    }

    return this.prismaService.forumCategory.delete({
      where: { id },
    });
  }

  async deactivate(id: string) {
    const category = await this.prismaService.forumCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    return this.prismaService.forumCategory.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getCategoryStats(id: string) {
    const category = await this.prismaService.forumCategory.findUnique({
      where: { id },
      include: {
        forums: {
          include: {
            forumThreads: {
              include: {
                _count: {
                  select: {
                    forumPosts: {
                      where: { isDeleted: false },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    const totalThreads = category.forums.reduce(
      (sum, forum) => sum + forum.forumThreads.length,
      0,
    );
    const totalPosts = category.forums.reduce(
      (sum, forum) => sum + forum.forumThreads.reduce(
        (threadSum, thread) => threadSum + thread._count.forumPosts,
        0
      ),
      0,
    );

    return {
      ...category,
      stats: {
        totalThreads,
        totalPosts,
      },
    };
  }
}
