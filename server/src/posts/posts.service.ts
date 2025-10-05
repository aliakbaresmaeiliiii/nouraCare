import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createPostDto: CreatePostDto) {
    const { title, tags, media, ...postData } = createPostDto;

    const data: any = {
      content: postData.content,
      authorId: userId,
      isAnonymous: postData.isAnonymous,
    };

    if (postData.categoryId) {
      data.categoryId = postData.categoryId;
    }

    if (media && media.length > 0) {
      data.media = {
        create: media.map((mediaItem, index) => ({
          url: mediaItem.url,
          type: mediaItem.type,
          caption: mediaItem.caption,
          order: index,
        }))
      };
    }

    return await this.prisma.post.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        category: true,
        media: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, categoryId?: string) {
    const skip = (page - 1) * limit;
    
    const where = categoryId ? { categoryId } : {};

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
          category: true,
          media: true,
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
          likes: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        category: true,
        media: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
            likes: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
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
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(id: string, userId: number, updatePostDto: UpdatePostDto) {
    const post = await this.findOne(id);

    if (post.authorId !== userId) {
      throw new NotFoundException('Post not found');
    }

    const { title, tags, media, ...postData } = updatePostDto;

    return await this.prisma.post.update({
      where: { id },
      data: {
        ...postData,
        media: media ? {
          deleteMany: {},
          create: media.map((mediaItem, index) => ({
            url: mediaItem.url,
            type: mediaItem.type,
            caption: mediaItem.caption,
            order: index,
          }))
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        category: true,
        media: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: number) {
    const post = await this.findOne(id);

    if (post.authorId !== userId) {
      throw new NotFoundException('Post not found');
    }

    return await this.prisma.post.delete({
      where: { id },
    });
  }

  async likePost(postId: string, userId: number) {
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await this.prisma.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return { liked: false };
    } else {
      // Like the post
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
      return { liked: true };
    }
  }

  async getPopularTags() {
    const popularTags = [
      'period',
      'cramps',
      'pregnancy',
      'fertility',
      'mental-health',
      'nutrition',
      'exercise',
      'parenting',
      'medical',
      'support',
      'first-trimester',
      'second-trimester',
      'third-trimester',
      'postpartum',
      'breastfeeding',
      'menopause',
      'hormones',
    ];

    return popularTags;
  }
}
