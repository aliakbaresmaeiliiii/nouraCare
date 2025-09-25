// Prisma-based DTOs and Services for Forum Extension
// These extend your existing Secret Chat system using Prisma ORM

import { IsOptional, IsString, IsBoolean, IsNumber, IsUUID } from 'class-validator';

// DTOs for Forum functionality

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateTopicDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsUUID()
  categoryId: string;
}

export class UpdateTopicDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;
}

export class CreateForumPostDto {
  @IsString()
  content: string;

  @IsUUID()
  topicId: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}

// Service interface for forum functionality
export interface ForumService {
  // Get all active categories with topic counts
  getCategoriesWithStats(): Promise<any[]>;

  // Get topics for a category with pagination
  getTopicsByCategory(categoryId: string, page?: number, limit?: number): Promise<{ topics: any[]; total: number; page: number; limit: number }>;

  // Get posts for a topic with pagination
  getPostsByTopic(topicId: string, page?: number, limit?: number): Promise<{ posts: any[]; total: number; page: number; limit: number }>;

  // Create a new topic
  createTopic(createTopicDto: CreateTopicDto, userId: number): Promise<any>;

  // Create a post in a topic
  createForumPost(createPostDto: CreateForumPostDto, userId: number): Promise<any>;
}

// Example implementation using Prisma
export class PrismaForumService implements ForumService {
  constructor(private readonly prisma: any) {}

  async getCategoriesWithStats(): Promise<any[]> {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        topics: {
          include: {
            _count: {
              select: { posts: true }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });
  }

  async getTopicsByCategory(categoryId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where: { categoryId },
        include: {
          _count: {
            select: { posts: true }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              profileImage: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.topic.count({ where: { categoryId } })
    ]);

    return { topics, total, page, limit };
  }

  async getPostsByTopic(topicId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { topicId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true
            }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.post.count({ where: { topicId } })
    ]);

    return { posts, total, page, limit };
  }

  async createTopic(createTopicDto: CreateTopicDto, userId: number) {
    return this.prisma.topic.create({
      data: {
        ...createTopicDto,
        createdById: userId
      },
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    });
  }

  async createForumPost(createPostDto: CreateForumPostDto, userId: number) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        topic: {
          include: {
            category: true
          }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });
  }
}

// Types for Prisma responses
export interface CategoryWithStats {
  id: string;
  name: string;
  description: string;
  slug: string;
  color?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  topics: Array<{
    _count: {
      posts: number;
    };
  }>;
  _count?: {
    topics: number;
  };
}

export interface TopicWithStats {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  createdById: number;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdBy: {
    id: number;
    name?: string;
    profileImage?: string;
  };
  _count: {
    posts: number;
  };
}

export interface ForumPostWithStats {
  id: string;
  content: string;
  topicId: string;
  authorId: number;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    name?: string;
    profileImage?: string;
  };
  topic: {
    id: string;
    title: string;
    category: {
      id: string;
      name: string;
    };
  };
  _count: {
    likes: number;
    comments: number;
  };
}
