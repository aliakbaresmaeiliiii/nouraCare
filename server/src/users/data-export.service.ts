import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import SendMail from '../helper/send_email';
import { EmailProvider } from '../auth/config/email';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function serializeDates(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeDates);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeDates(v);
    }
    return out;
  }
  return value;
}

@Injectable()
export class DataExportService {
  private readonly sendMail: SendMail;

  constructor(private readonly prisma: PrismaService) {
    this.sendMail = new SendMail(new EmailProvider());
  }

  async exportAndEmailUserData(userId: number): Promise<{ email: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_engagement: true,
        user_subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.prisma.user_profile.findUnique({
      where: { userId },
    });

    const email = String(user.email ?? '').trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      throw new BadRequestException(
        'A valid registered email is required to export your data',
      );
    }

    const [
      onboarding,
      periodLogs,
      trackDays,
      reproductiveState,
      pregnancy,
      cycleData,
      pregnancyPlanning,
      addresses,
      forumPosts,
      forumComments,
      forumThreads,
    ] = await Promise.all([
      this.prisma.onboarding_data.findUnique({ where: { userId } }),
      this.prisma.period_logs.findMany({
        where: { userId },
        orderBy: { lastPeriodDate: 'desc' },
      }),
      this.prisma.trackday.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.reproductive_state.findUnique({ where: { userId } }),
      this.prisma.pregnancy.findUnique({ where: { userId } }),
      this.prisma.cycle_data.findUnique({ where: { userId } }),
      this.prisma.pregnancy_planning.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.address.findMany({ where: { userId } }),
      this.prisma.forum_posts.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.forum_comments.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.forum_threads.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const {
      emailVerificationCode: _code,
      emailVerificationCodeExpires: _expires,
      ...safeUser
    } = user;

    const exportPayload = serializeDates({
      exportedAt: new Date().toISOString(),
      account: safeUser,
      profile,
      engagement: user.user_engagement,
      subscription: user.user_subscription,
      onboarding,
      reproductiveState,
      pregnancy,
      cycleData,
      periodLogs,
      pregnancyPlanning,
      trackDays,
      addresses,
      forum: {
        posts: forumPosts,
        comments: forumComments,
        threads: forumThreads,
      },
    });

    const json = JSON.stringify(exportPayload, null, 2);
    const filename = `dorehealth-data-export-${userId}-${Date.now()}.json`;

    await this.sendMail.sendDataExport(
      email,
      user.fullName || email.split('@')[0],
      json,
      filename,
    );

    return { email };
  }
}
