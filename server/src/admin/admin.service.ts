import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  doctor_appointment_status,
  Prisma,
  support_ticket_message_author_role,
  support_ticket_status,
  user_role,
  user_status,
} from '@prisma/client';
import { PrismaService } from '../prisma/services/prisma.service';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ListDoctorsQueryDto } from './dto/list-doctors.query.dto';
import { CreateDoctorAdminDto } from './dto/create-doctor-admin.dto';
import { UpdateDoctorAdminDto } from './dto/update-doctor-admin.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query.dto';
import { UpdateAppointmentAdminDto } from './dto/update-appointment-admin.dto';
import { ListThreadsQueryDto } from './dto/list-threads.query.dto';
import { UpdateThreadAdminDto } from './dto/update-thread-admin.dto';
import { ListTicketsQueryDto } from './dto/list-tickets.query.dto';
import { UpdateTicketAdminDto } from './dto/update-ticket-admin.dto';
import { AddTicketMessageAdminDto } from './dto/add-ticket-message-admin.dto';

const DOCTOR_ADMIN_SELECT = {
  id: true,
  fullName: true,
  specialty: true,
  experienceYears: true,
  about: true,
  rating: true,
  profileImageUrl: true,
  clinicName: true,
  location: true,
  contactEmail: true,
  contactPhone: true,
  consultationType: true,
  fee: true,
  licenseNumber: true,
  licenseDocument: true,
  isVerified: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { doctor_appointments: true } },
} as const;

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

  async createUser(dto: CreateUserAdminDto) {
    const email = dto.email.trim().toLowerCase();
    const phoneNumber = dto.phoneNumber.trim();
    const fullName = dto.fullName.trim();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
      select: { id: true, email: true, phoneNumber: true },
    });
    if (existing) {
      throw new BadRequestException(
        existing.email === email
          ? 'Email already in use'
          : 'Phone number already in use',
      );
    }

    const now = new Date();
    return this.prisma.user.create({
      data: {
        email,
        phoneNumber,
        fullName,
        role: dto.role ?? user_role.USER,
        status: dto.status ?? user_status.ACTIVE,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      select: USER_ADMIN_SELECT,
    });
  }

  async updateUser(
    id: number,
    dto: UpdateUserAdminDto,
    actorId: number,
  ) {
    const hasChange =
      dto.status !== undefined ||
      dto.role !== undefined ||
      dto.fullName !== undefined ||
      dto.email !== undefined ||
      dto.phoneNumber !== undefined ||
      dto.isVerified !== undefined;

    if (!hasChange) {
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

    const email =
      dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
    const phoneNumber =
      dto.phoneNumber !== undefined ? dto.phoneNumber.trim() : undefined;
    const fullName =
      dto.fullName !== undefined ? dto.fullName.trim() : undefined;

    if (email || phoneNumber) {
      const clash = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(email ? [{ email }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : []),
          ],
        },
        select: { id: true, email: true, phoneNumber: true },
      });
      if (clash) {
        throw new BadRequestException(
          clash.email === email
            ? 'Email already in use'
            : 'Phone number already in use',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(dto.isVerified !== undefined && { isVerified: dto.isVerified }),
        updatedAt: new Date(),
      },
      select: USER_ADMIN_SELECT,
    });
  }

  async deleteUser(id: number, actorId: number) {
    if (id === actorId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === user_role.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.user.count({
        where: { role: user_role.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last super admin');
      }
    }

    if (user.role === user_role.ADMIN || user.role === user_role.SUPER_ADMIN) {
      const privilegedCount = await this.prisma.user.count({
        where: {
          role: { in: [user_role.ADMIN, user_role.SUPER_ADMIN] },
        },
      });
      if (privilegedCount <= 1) {
        throw new ForbiddenException('Cannot delete the last admin');
      }
    }

    await this.prisma.user.delete({ where: { id } });
    return { id };
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
        { clinicName: { contains: q } },
        { location: { contains: q } },
      ];
    }

    const [items, total, verifiedCount, unverifiedCount] = await Promise.all([
      this.prisma.doctors.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: DOCTOR_ADMIN_SELECT,
      }),
      this.prisma.doctors.count({ where }),
      this.prisma.doctors.count({ where: { isVerified: true } }),
      this.prisma.doctors.count({ where: { isVerified: false } }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      verifiedCount,
      unverifiedCount,
    };
  }

  async getDoctor(id: string) {
    const doctor = await this.prisma.doctors.findUnique({
      where: { id },
      select: DOCTOR_ADMIN_SELECT,
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const recentAppointments = await this.prisma.doctor_appointment.findMany({
      where: { doctorId: id },
      orderBy: { scheduledAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        consultationType: true,
        scheduledAt: true,
        feeTomans: true,
        createdAt: true,
        cancelledAt: true,
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    const [pendingCount, confirmedCount, cancelledCount] = await Promise.all([
      this.prisma.doctor_appointment.count({
        where: { doctorId: id, status: doctor_appointment_status.PENDING },
      }),
      this.prisma.doctor_appointment.count({
        where: { doctorId: id, status: doctor_appointment_status.CONFIRMED },
      }),
      this.prisma.doctor_appointment.count({
        where: { doctorId: id, status: doctor_appointment_status.CANCELLED },
      }),
    ]);

    return {
      ...doctor,
      appointmentStats: {
        pending: pendingCount,
        confirmed: confirmedCount,
        cancelled: cancelledCount,
      },
      recentAppointments,
    };
  }

  async createDoctor(dto: CreateDoctorAdminDto) {
    const now = new Date();
    const isVerified = dto.isVerified ?? false;

    return this.prisma.doctors.create({
      data: {
        id: randomUUID(),
        fullName: dto.fullName.trim(),
        specialty: dto.specialty.trim(),
        experienceYears: dto.experienceYears,
        about: dto.about.trim(),
        rating: dto.rating ?? 0,
        profileImageUrl: dto.profileImageUrl?.trim() || null,
        clinicName: dto.clinicName?.trim() || null,
        location: dto.location?.trim() || null,
        contactEmail: dto.contactEmail?.trim().toLowerCase() || null,
        contactPhone: dto.contactPhone?.trim() || null,
        consultationType: dto.consultationType,
        fee: dto.fee ?? null,
        licenseNumber: dto.licenseNumber?.trim() || null,
        isVerified,
        verifiedAt: isVerified ? now : null,
        createdAt: now,
        updatedAt: now,
      },
      select: DOCTOR_ADMIN_SELECT,
    });
  }

  async updateDoctor(id: string, dto: UpdateDoctorAdminDto) {
    const doctor = await this.prisma.doctors.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const hasChange =
      dto.fullName !== undefined ||
      dto.specialty !== undefined ||
      dto.experienceYears !== undefined ||
      dto.about !== undefined ||
      dto.rating !== undefined ||
      dto.profileImageUrl !== undefined ||
      dto.clinicName !== undefined ||
      dto.location !== undefined ||
      dto.contactEmail !== undefined ||
      dto.contactPhone !== undefined ||
      dto.consultationType !== undefined ||
      dto.fee !== undefined ||
      dto.licenseNumber !== undefined ||
      dto.isVerified !== undefined;

    if (!hasChange) {
      throw new BadRequestException('No changes provided');
    }

    const data: Prisma.doctorsUpdateInput = {
      updatedAt: new Date(),
    };

    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.specialty !== undefined) data.specialty = dto.specialty.trim();
    if (dto.experienceYears !== undefined) {
      data.experienceYears = dto.experienceYears;
    }
    if (dto.about !== undefined) data.about = dto.about.trim();
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.profileImageUrl !== undefined) {
      data.profileImageUrl = dto.profileImageUrl?.trim() || null;
    }
    if (dto.clinicName !== undefined) {
      data.clinicName = dto.clinicName?.trim() || null;
    }
    if (dto.location !== undefined) {
      data.location = dto.location?.trim() || null;
    }
    if (dto.contactEmail !== undefined) {
      data.contactEmail = dto.contactEmail?.trim().toLowerCase() || null;
    }
    if (dto.contactPhone !== undefined) {
      data.contactPhone = dto.contactPhone?.trim() || null;
    }
    if (dto.consultationType !== undefined) {
      data.consultationType = dto.consultationType;
    }
    if (dto.fee !== undefined) data.fee = dto.fee;
    if (dto.licenseNumber !== undefined) {
      data.licenseNumber = dto.licenseNumber?.trim() || null;
    }
    if (dto.isVerified !== undefined) {
      data.isVerified = dto.isVerified;
      data.verifiedAt = dto.isVerified
        ? doctor.verifiedAt ?? new Date()
        : null;
    }

    return this.prisma.doctors.update({
      where: { id },
      data,
      select: DOCTOR_ADMIN_SELECT,
    });
  }

  async deleteDoctor(id: string) {
    const doctor = await this.prisma.doctors.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { doctor_appointments: true } },
      },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    if (doctor._count.doctor_appointments > 0) {
      throw new BadRequestException(
        'Cannot delete a doctor with existing appointments. Cancel appointments first or keep the profile.',
      );
    }

    await this.prisma.doctors.delete({ where: { id } });
    return { id };
  }

  async listAppointments(query: ListAppointmentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.doctor_appointmentWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.consultationType) where.consultationType = query.consultationType;
    if (query.doctorId?.trim()) where.doctorId = query.doctorId.trim();
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { doctor: { fullName: { contains: q } } },
        { doctor: { specialty: { contains: q } } },
        { user: { fullName: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    const [items, total, pendingCount, confirmedCount, cancelledCount] =
      await Promise.all([
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
            slotKey: true,
            feeTomans: true,
            createdAt: true,
            cancelledAt: true,
            doctor: {
              select: { id: true, fullName: true, specialty: true },
            },
            user: {
              select: { id: true, fullName: true, email: true, phoneNumber: true },
            },
          },
        }),
        this.prisma.doctor_appointment.count({ where }),
        this.prisma.doctor_appointment.count({
          where: { status: doctor_appointment_status.PENDING },
        }),
        this.prisma.doctor_appointment.count({
          where: { status: doctor_appointment_status.CONFIRMED },
        }),
        this.prisma.doctor_appointment.count({
          where: { status: doctor_appointment_status.CANCELLED },
        }),
      ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      pendingCount,
      confirmedCount,
      cancelledCount,
    };
  }

  async updateAppointment(id: string, dto: UpdateAppointmentAdminDto) {
    const row = await this.prisma.doctor_appointment.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException('Appointment not found');
    }

    if (row.status === dto.status) {
      return this.getAppointment(id);
    }

    if (
      row.status === doctor_appointment_status.CANCELLED &&
      dto.status !== doctor_appointment_status.CANCELLED
    ) {
      throw new BadRequestException('Cancelled appointments cannot be reopened');
    }

    const data: Prisma.doctor_appointmentUpdateInput = {
      status: dto.status,
      updatedAt: new Date(),
    };

    if (dto.status === doctor_appointment_status.CANCELLED) {
      data.cancelledAt = new Date();
    }

    await this.prisma.doctor_appointment.update({
      where: { id },
      data,
    });

    return this.getAppointment(id);
  }

  private async getAppointment(id: string) {
    const item = await this.prisma.doctor_appointment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        consultationType: true,
        scheduledAt: true,
        slotKey: true,
        feeTomans: true,
        createdAt: true,
        cancelledAt: true,
        doctor: {
          select: { id: true, fullName: true, specialty: true },
        },
        user: {
          select: { id: true, fullName: true, email: true, phoneNumber: true },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Appointment not found');
    }
    return item;
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

  async listTickets(query: ListTicketsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const where: Prisma.support_ticketWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search } },
              { user: { fullName: { contains: search } } },
              { user: { email: { contains: search } } },
              { user: { phoneNumber: { contains: search } } },
            ],
          }
        : {}),
    };

    const [total, openCount, items] = await this.prisma.$transaction([
      this.prisma.support_ticket.count({ where }),
      this.prisma.support_ticket.count({
        where: {
          status: {
            in: [
              support_ticket_status.OPEN,
              support_ticket_status.IN_PROGRESS,
              support_ticket_status.WAITING_ON_USER,
            ],
          },
        },
      }),
      this.prisma.support_ticket.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          subject: true,
          category: true,
          status: true,
          priority: true,
          lastMessageAt: true,
          createdAt: true,
          updatedAt: true,
          assignedAdminId: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { body: true, authorRole: true, createdAt: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((t) => {
        const last = t.messages[0] ?? null;
        return {
          id: t.id,
          subject: t.subject,
          category: t.category,
          status: t.status,
          priority: t.priority,
          lastMessageAt: t.lastMessageAt,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          assignedAdminId: t.assignedAdminId,
          messageCount: t._count.messages,
          user: t.user,
          preview: last
            ? {
                body:
                  last.body.length > 160
                    ? `${last.body.slice(0, 157)}…`
                    : last.body,
                authorRole: last.authorRole,
                createdAt: last.createdAt,
              }
            : null,
        };
      }),
      total,
      openCount,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.support_ticket.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        category: true,
        status: true,
        priority: true,
        appVersion: true,
        deviceInfo: true,
        pagePath: true,
        assignedAdminId: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            status: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            authorId: true,
            authorRole: true,
            body: true,
            createdAt: true,
          },
        },
        _count: { select: { messages: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const { _count, ...rest } = ticket;
    return {
      ...rest,
      messageCount: _count.messages,
    };
  }

  async updateTicket(id: string, dto: UpdateTicketAdminDto, actorId: number) {
    const existing = await this.prisma.support_ticket.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }

    if (dto.assignedAdminId != null) {
      const admin = await this.prisma.user.findUnique({
        where: { id: dto.assignedAdminId },
        select: { id: true, role: true },
      });
      if (
        !admin ||
        (admin.role !== user_role.ADMIN && admin.role !== user_role.SUPER_ADMIN)
      ) {
        throw new BadRequestException('assignedAdminId must be an admin user');
      }
    }

    await this.prisma.support_ticket.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.assignedAdminId !== undefined
          ? { assignedAdminId: dto.assignedAdminId }
          : {}),
        updatedAt: new Date(),
      },
    });

    // Touch actor for future audit hooks without unused-arg lint.
    void actorId;
    return this.getTicket(id);
  }

  async addTicketMessage(
    id: string,
    dto: AddTicketMessageAdminDto,
    actorId: number,
  ) {
    const ticket = await this.prisma.support_ticket.findUnique({
      where: { id },
      select: { id: true, status: true, assignedAdminId: true },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.status === support_ticket_status.CLOSED) {
      throw new BadRequestException('This ticket is closed');
    }

    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Message cannot be empty');
    }

    const now = new Date();
    let nextStatus = ticket.status;
    if (
      ticket.status === support_ticket_status.OPEN ||
      ticket.status === support_ticket_status.IN_PROGRESS ||
      ticket.status === support_ticket_status.RESOLVED
    ) {
      nextStatus = support_ticket_status.WAITING_ON_USER;
    }

    await this.prisma.$transaction([
      this.prisma.support_ticket_message.create({
        data: {
          id: randomUUID(),
          ticketId: id,
          authorId: actorId,
          authorRole: support_ticket_message_author_role.ADMIN,
          body,
        },
      }),
      this.prisma.support_ticket.update({
        where: { id },
        data: {
          lastMessageAt: now,
          status: nextStatus,
          assignedAdminId: ticket.assignedAdminId ?? actorId,
          updatedAt: now,
        },
      }),
    ]);

    return this.getTicket(id);
  }
}
