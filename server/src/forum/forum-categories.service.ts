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
    const existingCategory = await this.prismaService.forum_categories.findFirst({
      where: { name: createForumCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prismaService.forum_categories.create({
      data: {
        ...createForumCategoryDto,
        updatedAt: new Date(),
      },
      include: {
        forums: {
          include: {
            forum_threads: {
              include: {
                _count: {
                  select: {
                    forum_posts: {
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
    return this.prismaService.forum_categories.findMany({
      include: {
        forums: {
          include: {
            forum_threads: {
              include: {
                _count: {
                  select: {
                    forum_posts: {
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
    const category = await this.prismaService.forum_categories.findUnique({
      where: { id },
      include: {
        forums: {
          include: {
            forum_threads: {
              include: {
                _count: {
                  select: {
                    forum_posts: {
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
    const category = await this.prismaService.forum_categories.findUnique({
      where: { id },
      include: {
        forums: {
          include: {
            forum_threads: {
              include: {
                _count: {
                  select: {
                    forum_posts: {
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
    const existingCategory = await this.prismaService.forum_categories.findUnique({
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
      const nameConflict = await this.prismaService.forum_categories.findFirst({
        where: { name: updateForumCategoryDto.name },
      });

      if (nameConflict) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prismaService.forum_categories.update({
      where: { id },
      data: {
        ...updateForumCategoryDto,
        updatedAt: new Date(),
      },
      include: {
        forums: {
          include: {
            forum_threads: {
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
        },
      },
    });
  }

  async remove(id: string) {
    // Check if category exists
    const category = await this.prismaService.forum_categories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    // Check if category has forum threads
    const threadsCount = await this.prismaService.forum_threads.count({
      where: { 
        forums: {
          categoryId: id
        }
      },
    });

    if (threadsCount > 0) {
      throw new ConflictException(
        'Cannot delete category that contains forum threads',
      );
    }

    return this.prismaService.forum_categories.delete({
      where: { id },
    });
  }

  async deactivate(id: string) {
    const category = await this.prismaService.forum_categories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    return this.prismaService.forum_categories.update({
      where: { id },
      data: { isActive: true, updatedAt: new Date() },
    });
  }

  async getCategoryStats(id: string) {
    const category = await this.prismaService.forum_categories.findUnique({
      where: { id },
      include: {
        forums: {
          include: {
            forum_threads: {
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
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    const totalThreads = category.forums.reduce(
      (sum, forum) => sum + forum.forum_threads.length,
      0,
    );
    const totalPosts = category.forums.reduce(
      (sum, forum) => sum + forum.forum_threads.reduce(
        (threadSum, thread) => threadSum + thread._count.forum_posts,
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
