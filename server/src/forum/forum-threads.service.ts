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
import { assertNoProfanity } from '../common/utils/profanity-filter.util';

@Injectable()
export class ForumThreadsService {
  constructor(private prismaService: PrismaService) {}

  private normalizeCategoryLookup(value: string) {
    return value.trim().toLowerCase().replace(/[-_]+/g, ' ');
  }

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

      assertNoProfanity(createForumThreadDto.title, normalizedContent);

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


  async findAll(categoryId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
  
    const where: any = {};
  
    if (categoryId) {
      const normalized = this.normalizeCategoryLookup(categoryId);
      const matchedCategory = await this.prismaService.forum_categories.findFirst({
        where: {
          OR: [
            { id: categoryId },
            { name: categoryId },
            { name: normalized },
          ],
        },
        select: { id: true },
      });

      const forumsInCategory = await this.prismaService.forums.findMany({
        where: { categoryId: matchedCategory?.id ?? categoryId },
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

    const threadIds = threads.map((thread) => thread.id);
    const posts = threadIds.length
      ? await this.prismaService.forum_posts.findMany({
          where: {
            threadId: { in: threadIds },
            isDeleted: false,
          },
          select: {
            id: true,
            threadId: true,
          },
        })
      : [];

    const postIds = posts.map((post) => post.id);

    const comments = postIds.length
      ? await this.prismaService.forum_comments.findMany({
          where: {
            postId: { in: postIds },
            isDeleted: false,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            postId: true,
            comment: true,
            authorId: true,
            likeCount: true,
            createdAt: true,
            updatedAt: true,
            parentId: true,
          },
        })
      : [];

    const postToThread = new Map(posts.map((post) => [post.id, post.threadId]));

    const commentsByThread = new Map<
      string,
      {
        id: string;
        postId: string;
        comment: string;
        authorId: number;
        likeCount: number;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
      }[]
    >();
    for (const comment of comments) {
      const threadId = postToThread.get(comment.postId);
      if (!threadId) continue;
      const list = commentsByThread.get(threadId) ?? [];
      list.push(comment);
      commentsByThread.set(threadId, list);
    }

    const enrichedThreads = threads.map((thread) => {
      const threadComments = commentsByThread.get(thread.id) ?? [];
      return {
        ...thread,
        likeCount: 0,
        commentCount: threadComments.length,
        comments: threadComments.slice(0, 5),
      };
    });
  
    return {
      threads: enrichedThreads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(threadId: string, viewerId?: number) {
    try {
      const thread = await this.prismaService.forum_threads.update({
        where: { id: threadId },
        data: {
          viewCount: { increment: 1 },
        },
      });

      const postIds = (
        await this.prismaService.forum_posts.findMany({
          where: { threadId, isDeleted: false },
          select: { id: true },
        })
      ).map((post) => post.id);

      const comments =
        postIds.length > 0
          ? await this.prismaService.forum_comments.findMany({
              where: {
                postId: { in: postIds },
                isDeleted: false,
              },
              orderBy: { createdAt: 'desc' },
              take: 20,
              select: {
                id: true,
                postId: true,
                comment: true,
                authorId: true,
                likeCount: true,
                createdAt: true,
                updatedAt: true,
                parentId: true,
              },
            })
          : [];

      const commentIds = comments.map((item) => item.id);
      const likedCommentIds = new Set<string>();
      if (
        typeof viewerId === 'number' &&
        Number.isFinite(viewerId) &&
        commentIds.length > 0
      ) {
        const myLikes = await this.prismaService.forum_comment_likes.findMany({
          where: {
            userId: viewerId,
            commentId: { in: commentIds },
          },
          select: { commentId: true },
        });
        for (const row of myLikes) likedCommentIds.add(row.commentId);
      }

      return {
        ...thread,
        commentCount: comments.length,
        comments: comments.map((item) => ({
          ...item,
          isLiked: likedCommentIds.has(item.id),
        })),
      };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Forum thread not found');
      }
      throw error;
    }
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

    const authorId = Number(thread.authorId);
    const requestUserId = Number(userId);
    if (authorId !== requestUserId) {
      throw new ForbiddenException('You can only update your own threads');
    }

    const dto = updateForumThreadDto as Record<string, unknown>;
    const normalizedUpdateContent =
      (typeof dto.description === 'string' && dto.description.trim()) ||
      (typeof dto.content === 'string' && dto.content.trim()) ||
      '';

    const updateData: {
      title?: string;
      content?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (typeof dto.title === 'string' && dto.title.trim()) {
      updateData.title = dto.title.trim();
    }

    if (normalizedUpdateContent) {
      updateData.content = normalizedUpdateContent;
    }

    const hasBodyUpdate =
      updateData.title !== undefined || updateData.content !== undefined;
    if (!hasBodyUpdate) {
      throw new BadRequestException(
        'Provide at least title or content/description to update',
      );
    }

    const updated = await this.prismaService.forum_threads.update({
      where: { id },
      data: updateData,
    });

    // Root forum_post (used for comments / some UIs) must stay in sync with thread body
    if (normalizedUpdateContent) {
      const rootPost = await this.prismaService.forum_posts.findFirst({
        where: { threadId: id, isDeleted: false },
        orderBy: { createdAt: 'asc' },
      });
      if (rootPost) {
        await this.prismaService.forum_posts.update({
          where: { id: rootPost.id },
          data: {
            content: normalizedUpdateContent,
            updatedAt: new Date(),
          },
        });
      }
    }

    return updated;
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

  private static readonly EXPERIENCE_CATEGORY_IDS = ['pregnancy-journey'];

  private async getExperienceForumIds(): Promise<string[]> {
    const forums = await this.prismaService.forums.findMany({
      where: {
        categoryId: { in: ForumThreadsService.EXPERIENCE_CATEGORY_IDS },
      },
      select: { id: true },
    });
    return forums.map((forum) => forum.id);
  }

  async getUserActivity(
    userId: number,
    page = 1,
    limit = 10,
    type: 'questions' | 'answers' | 'experiences' = 'questions',
  ) {
    const skip = (page - 1) * limit;
    const experienceForumIds = await this.getExperienceForumIds();
    const experienceThreadFilter =
      experienceForumIds.length > 0
        ? { authorId: userId, forumId: { in: experienceForumIds } }
        : { authorId: userId, forumId: { in: [] as string[] } };

    const [questionsCount, answersCount, experiencesCount] =
      await Promise.all([
        this.prismaService.forum_threads.count({
          where: { authorId: userId },
        }),
        this.prismaService.forum_comments.count({
          where: { authorId: userId, isDeleted: false },
        }),
        this.prismaService.forum_threads.count({
          where: experienceThreadFilter,
        }),
      ]);

    const stats = {
      questions: questionsCount,
      answers: answersCount,
      experiences: experiencesCount,
    };

    if (type === 'answers') {
      const [answers, total] = await Promise.all([
        this.prismaService.forum_comments.findMany({
          where: { authorId: userId, isDeleted: false },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            comment: true,
            createdAt: true,
            postId: true,
          },
        }),
        Promise.resolve(answersCount),
      ]);

      const mappedAnswers = await this.mapUserForumAnswers(answers);

      return {
        stats,
        answers: mappedAnswers,
        pagination: this.buildActivityPagination(page, limit, total),
      };
    }

    const threadWhere =
      type === 'experiences'
        ? experienceThreadFilter
        : { authorId: userId };

    const total =
      type === 'experiences' ? experiencesCount : questionsCount;

    const threads = await this.prismaService.forum_threads.findMany({
      where: threadWhere,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        viewCount: true,
        likeCount: true,
      },
    });

    const listKey = type === 'experiences' ? 'experiences' : 'questions';

    return {
      stats,
      [listKey]: threads,
      pagination: this.buildActivityPagination(page, limit, total),
    };
  }

  private buildActivityPagination(page: number, limit: number, total: number) {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    return {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  private async mapUserForumAnswers(
    answers: Array<{
      id: string;
      comment: string;
      createdAt: Date;
      postId: string;
    }>,
  ) {
    const postIds = [...new Set(answers.map((answer) => answer.postId))];
    const posts =
      postIds.length > 0
        ? await this.prismaService.forum_posts.findMany({
            where: { id: { in: postIds } },
            select: { id: true, threadId: true },
          })
        : [];
    const threadIds = [...new Set(posts.map((post) => post.threadId))];
    const threads =
      threadIds.length > 0
        ? await this.prismaService.forum_threads.findMany({
            where: { id: { in: threadIds } },
            select: { id: true, title: true },
          })
        : [];

    const postToThreadId = new Map(
      posts.map((post) => [post.id, post.threadId]),
    );
    const threadById = new Map(threads.map((thread) => [thread.id, thread]));

    return answers.map((answer) => {
      const threadId = postToThreadId.get(answer.postId) ?? null;
      const thread = threadId ? threadById.get(threadId) : undefined;

      return {
        id: answer.id,
        content: answer.comment,
        createdAt: answer.createdAt,
        threadId: thread?.id ?? threadId,
        threadTitle: thread?.title ?? null,
      };
    });
  }
}
