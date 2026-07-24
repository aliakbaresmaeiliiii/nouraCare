import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  doctor_appointment_status,
  Prisma,
  user_role,
  user_status,
} from '@prisma/client';
import { PrismaService } from '../prisma/services/prisma.service';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ListDoctorsQueryDto } from './dto/list-doctors.query.dto';
import { UpdateDoctorAdminDto } from './dto/update-doctor-admin.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query.dto';
import { ListThreadsQueryDto } from './dto/list-threads.query.dto';
import { UpdateThreadAdminDto } from './dto/update-thread-admin.dto';

const USER_ADMIN_SELECT = {
  id: true,
  email: true,
  phoneNumber: true,
  fullName: true,
  role: true,
  status: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  user_subscription: {
    select: {
      tier: true,
      premiumUntil: true,
      trialEndsAt: true,
      billingInterval: true,
    },
  },
  user_engagement: {
    select: {
      engagementScore: true,
      engagementTier: true,
      lastOpenAt: true,
      growthPoints: true,
    },
  },
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 6);
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      verifiedUsers,
      admins,
      newToday,
      newThisWeek,
      newThisMonth,
      usersByStatus,
      subscriptionByTier,
      reproductiveByState,
      doctorsTotal,
      doctorsVerified,
      appointmentsTotal,
      appointmentsPending,
      forumThreads,
      forumPosts,
      secretChats,
      recentSignups,
      signupsByDayRaw,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: user_status.ACTIVE } }),
      this.prisma.user.count({ where: { status: user_status.SUSPENDED } }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({
        where: {
          role: { in: [user_role.ADMIN, user_role.SUPER_ADMIN] },
        },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.user.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.user_subscription.groupBy({
        by: ['tier'],
        _count: { _all: true },
      }),
      this.prisma.reproductive_state.groupBy({
        by: ['state'],
        _count: { _all: true },
      }),
      this.prisma.doctors.count(),
      this.prisma.doctors.count({ where: { isVerified: true } }),
      this.prisma.doctor_appointment.count(),
      this.prisma.doctor_appointment.count({
        where: { status: doctor_appointment_status.PENDING },
      }),
      this.prisma.forum_threads.count(),
      this.prisma.forum_posts.count(),
      this.prisma.secret_chats.count(),
      this.prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          createdAt: true,
          isVerified: true,
        },
      }),
      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE(createdAt) AS day, COUNT(*) AS count
        FROM user
        WHERE createdAt >= ${startOfWeek}
        GROUP BY DATE(createdAt)
        ORDER BY day ASC
      `,
    ]);

    const dayKeys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setUTCDate(startOfWeek.getUTCDate() + i);
      dayKeys.push(d.toISOString().slice(0, 10));
    }

    const signupMap = new Map(
      signupsByDayRaw.map((row) => [
        new Date(row.day).toISOString().slice(0, 10),
        Number(row.count),
      ]),
    );

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        verified: verifiedUsers,
        admins,
        newToday,
        newThisWeek,
        newThisMonth,
        byStatus: Object.fromEntries(
          usersByStatus.map((row) => [row.status, row._count._all]),
        ),
      },
      subscriptions: {
        byTier: Object.fromEntries(
          subscriptionByTier.map((row) => [row.tier, row._count._all]),
        ),
      },
      reproductive: {
        byState: Object.fromEntries(
          reproductiveByState.map((row) => [row.state, row._count._all]),
        ),
      },
      doctors: {
        total: doctorsTotal,
        verified: doctorsVerified,
        unverified: doctorsTotal - doctorsVerified,
      },
      appointments: {
        total: appointmentsTotal,
        pending: appointmentsPending,
      },
      community: {
        threads: forumThreads,
        posts: forumPosts,
        secretChats,
      },
      charts: {
        signupsLast7Days: dayKeys.map((day) => ({
          day,
          count: signupMap.get(day) ?? 0,
        })),
      },
      recentSignups,
    };
  }

  async listUsers(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.userWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.role) where.role = query.role;
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { email: { contains: q } },
        { fullName: { contains: q } },
        { phoneNumber: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_ADMIN_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_ADMIN_SELECT,
        dateOfBirth: true,
        user_profile: {
          select: {
            bio: true,
            avatarUrl: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            forum_threads: true,
            forum_posts: true,
            forum_comments: true,
            doctor_appointments: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Aggregate-only health context — mode label only, no cycle logs / symptoms
    const reproductive = await this.prisma.reproductive_state.findUnique({
      where: { userId: id },
      select: { state: true, updatedAt: true },
    });

    return { ...user, reproductive };
  }

  async updateUser(
    id: number,
    dto: UpdateUserAdminDto,
    actorId: number,
  ) {
    if (dto.status === undefined && dto.role === undefined) {
      throw new BadRequestException('No changes provided');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      id === actorId &&
      dto.role !== undefined &&
      dto.role !== user_role.SUPER_ADMIN &&
      dto.role !== user_role.ADMIN
    ) {
      throw new ForbiddenException('You cannot remove your own admin role');
    }

    if (id === actorId && dto.status && dto.status !== user_status.ACTIVE) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    // Never leave the system without a SUPER_ADMIN
    if (
      user.role === user_role.SUPER_ADMIN &&
      dto.role !== undefined &&
      dto.role !== user_role.SUPER_ADMIN
    ) {
      const superAdminCount = await this.prisma.user.count({
        where: { role: user_role.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        throw new ForbiddenException('Cannot demote the last super admin');
      }
    }

    // Protect last operator-level admin (ADMIN + SUPER_ADMIN)
    if (
      (user.role === user_role.ADMIN || user.role === user_role.SUPER_ADMIN) &&
      dto.role === user_role.USER
    ) {
      const privilegedCount = await this.prisma.user.count({
        where: {
          role: { in: [user_role.ADMIN, user_role.SUPER_ADMIN] },
        },
      });
      if (privilegedCount <= 1) {
        throw new ForbiddenException('Cannot demote the last admin');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.role !== undefined && { role: dto.role }),
        updatedAt: new Date(),
      },
      select: USER_ADMIN_SELECT,
    });
  }

  async listDoctors(query: ListDoctorsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.doctorsWhereInput = {};
    if (query.verified !== undefined) where.isVerified = query.verified;
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { fullName: { contains: q } },
        { specialty: { contains: q } },
        { contactEmail: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.doctors.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          specialty: true,
          experienceYears: true,
          rating: true,
          consultationType: true,
          fee: true,
          isVerified: true,
          verifiedAt: true,
          contactEmail: true,
          contactPhone: true,
          clinicName: true,
          location: true,
          createdAt: true,
          _count: { select: { doctor_appointments: true } },
        },
      }),
      this.prisma.doctors.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async updateDoctor(id: string, dto: UpdateDoctorAdminDto) {
    const doctor = await this.prisma.doctors.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (dto.isVerified === undefined) {
      throw new BadRequestException('No changes provided');
    }

    return this.prisma.doctors.update({
      where: { id },
      data: {
        isVerified: dto.isVerified,
        verifiedAt: dto.isVerified ? new Date() : null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        specialty: true,
        isVerified: true,
        verifiedAt: true,
        updatedAt: true,
      },
    });
  }

  async listAppointments(query: ListAppointmentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.doctor_appointmentWhereInput = {};
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.doctor_appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true,
          status: true,
          consultationType: true,
          scheduledAt: true,
          feeTomans: true,
          createdAt: true,
          cancelledAt: true,
          doctor: {
            select: { id: true, fullName: true, specialty: true },
          },
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      this.prisma.doctor_appointment.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listThreads(query: ListThreadsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.forum_threadsWhereInput = {};
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.forum_threads.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          isPinned: true,
          isLocked: true,
          viewCount: true,
          likeCount: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, fullName: true, email: true },
          },
          forums: {
            select: { id: true, title: true },
          },
          _count: { select: { forum_posts: true } },
        },
      }),
      this.prisma.forum_threads.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async updateThread(id: string, dto: UpdateThreadAdminDto) {
    if (dto.isPinned === undefined && dto.isLocked === undefined) {
      throw new BadRequestException('No changes provided');
    }

    const thread = await this.prisma.forum_threads.findUnique({
      where: { id },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    return this.prisma.forum_threads.update({
      where: { id },
      data: {
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
        ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        isPinned: true,
        isLocked: true,
        updatedAt: true,
      },
    });
  }

  async deleteThread(id: string) {
    const thread = await this.prisma.forum_threads.findUnique({
      where: { id },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const posts = await tx.forum_posts.findMany({
        where: { threadId: id },
        select: { id: true },
      });
      const postIds = posts.map((p) => p.id);

      if (postIds.length) {
        const comments = await tx.forum_comments.findMany({
          where: { postId: { in: postIds } },
          select: { id: true },
        });
        const commentIds = comments.map((c) => c.id);

        if (commentIds.length) {
          await tx.forum_comment_likes.deleteMany({
            where: { commentId: { in: commentIds } },
          });
          // Clear self-referential parent links before delete
          await tx.forum_comments.updateMany({
            where: { id: { in: commentIds } },
            data: { parentId: null },
          });
          await tx.forum_comments.deleteMany({
            where: { id: { in: commentIds } },
          });
        }

        await tx.forum_posts.updateMany({
          where: { threadId: id },
          data: { parentId: null },
        });
        await tx.forum_posts.deleteMany({ where: { threadId: id } });
      }

      await tx.forum_threads.delete({ where: { id } });
    });

    return { id, deleted: true };
  }

  async getSubscriptionSummary() {
    const [byTier, premiumActive, trialActive] = await Promise.all([
      this.prisma.user_subscription.groupBy({
        by: ['tier'],
        _count: { _all: true },
      }),
      this.prisma.user_subscription.count({
        where: {
          tier: 'PREMIUM',
          OR: [
            { premiumUntil: null },
            { premiumUntil: { gt: new Date() } },
          ],
        },
      }),
      this.prisma.user_subscription.count({
        where: {
          tier: 'PREMIUM_TRIAL',
          trialEndsAt: { gt: new Date() },
        },
      }),
    ]);

    return {
      byTier: Object.fromEntries(
        byTier.map((row) => [row.tier, row._count._all]),
      ),
      premiumActive,
      trialActive,
    };
  }

  async getHealth() {
    const started = Date.now();
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? ('healthy' as const) : ('down' as const),
      database,
      latencyMs: Date.now() - started,
      uptimeSec: Math.floor(process.uptime()),
      checkedAt: new Date().toISOString(),
    };
  }
}
