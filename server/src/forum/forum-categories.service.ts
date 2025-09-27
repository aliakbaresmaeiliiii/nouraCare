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
    // Check if slug already exists
    const existingCategory = await this.prismaService.forumCategory.findUnique({
      where: { slug: createForumCategoryDto.slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    return this.prismaService.forumCategory.create({
      data: createForumCategoryDto,
      include: {
        forums: {
          include: {
            _count: {
              select: {
                threads: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prismaService.forumCategory.findMany({
      where: { isActive: true },
      include: {
        forums: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                threads: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prismaService.forumCategory.findUnique({
      where: { id },
      include: {
        forums: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                threads: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prismaService.forumCategory.findUnique({
      where: { slug },
      include: {
        forums: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                threads: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
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

    // If slug is being updated, check for conflicts
    if (
      updateForumCategoryDto.slug &&
      updateForumCategoryDto.slug !== existingCategory.slug
    ) {
      const slugConflict = await this.prismaService.forumCategory.findUnique({
        where: { slug: updateForumCategoryDto.slug },
      });

      if (slugConflict) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    return this.prismaService.forumCategory.update({
      where: { id },
      data: updateForumCategoryDto,
      include: {
        forums: {
          include: {
            _count: {
              select: {
                threads: true,
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

    // Check if category has forums
    const forumsCount = await this.prismaService.forum.count({
      where: { categoryId: id },
    });

    if (forumsCount > 0) {
      throw new ConflictException(
        'Cannot delete category that contains forums',
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
      data: { isActive: false },
    });
  }

  async getCategoryStats(id: string) {
    const category = await this.prismaService.forumCategory.findUnique({
      where: { id },
      include: {
        forums: {
          include: {
            _count: {
              select: {
                threads: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    const totalForums = category.forums.length;
    const totalThreads = category.forums.reduce(
      (sum, forum) => sum + forum._count.threads,
      0,
    );

    return {
      ...category,
      stats: {
        totalForums,
        totalThreads,
      },
    };
  }
}
