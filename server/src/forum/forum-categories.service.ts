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

  private async attachForumsToCategories(categories: any[]) {
    const categoryIds = categories.map((c) => c.id);
    if (categoryIds.length === 0) return categories;

    const forums = await this.prismaService.forums.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        categoryId: true,
        createdById: true,
        isPublic: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const forumsByCategory = new Map<string, any[]>();
    for (const forum of forums) {
      const list = forumsByCategory.get(forum.categoryId) ?? [];
      list.push(forum);
      forumsByCategory.set(forum.categoryId, list);
    }

    return categories.map((category) => ({
      ...category,
      forums: forumsByCategory.get(category.id) ?? [],
    }));
  }

  private async attachForumsToCategory(category: any) {
    const [withForums] = await this.attachForumsToCategories([category]);
    return withForums;
  }

  async create(createForumCategoryDto: CreateForumCategoryDto) {
    // Check if name already exists
    const existingCategory = await this.prismaService.forum_categories.findFirst({
      where: { name: createForumCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const created = await this.prismaService.forum_categories.create({
      data: {
        ...createForumCategoryDto,
        updatedAt: new Date(),
      },
    });

    return this.attachForumsToCategory(created as any);
  }

  async findAll() {
    const categories = await this.prismaService.forum_categories.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return this.attachForumsToCategories(categories as any[]);
  }

  async findOne(id: string) {
    const category = await this.prismaService.forum_categories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    return this.attachForumsToCategory(category as any);
  }

  async findByName(id: string) {
    const category = await this.prismaService.forum_categories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    return this.attachForumsToCategory(category as any);
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

    const updated = await this.prismaService.forum_categories.update({
      where: { id },
      data: {
        ...updateForumCategoryDto,
        updatedAt: new Date(),
      },
    });

    return this.attachForumsToCategory(updated as any);
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
    const forums = await this.prismaService.forums.findMany({
      where: { categoryId: id },
      select: { id: true },
    });
    const forumIds = forums.map((forum) => forum.id);
    const threadsCount = await this.prismaService.forum_threads.count({
      where: { forumId: { in: forumIds } },
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
    });

    if (!category) {
      throw new NotFoundException('Forum category not found');
    }

    const forums = await this.prismaService.forums.findMany({
      where: { categoryId: id, isActive: true },
      select: { id: true },
    });

    const forumIds = forums.map((f) => f.id);
    if (forumIds.length === 0) {
      return {
        ...category,
        stats: { totalThreads: 0, totalPosts: 0 },
      };
    }

    const totalThreads = await this.prismaService.forum_threads.count({
      where: { forumId: { in: forumIds } },
    });

    const threads = await this.prismaService.forum_threads.findMany({
      where: { forumId: { in: forumIds } },
      select: { id: true },
    });

    const totalPosts = await this.prismaService.forum_posts.count({
      where: {
        threadId: { in: threads.map((t) => t.id) },
        isDeleted: false,
      },
    });

    return {
      ...category,
      stats: {
        totalThreads,
        totalPosts,
      },
    };
  }
}
