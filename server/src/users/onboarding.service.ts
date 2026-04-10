import { Injectable, NotFoundException } from '@nestjs/common';
import { onboarding_data } from '@prisma/client';
import { PrismaService } from '../prisma/services/prisma.service';
import { OnboardingDataDto, UserInfoResponseDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns journey defaults when no onboarding row exists yet.
   * Returns null only when the user id does not exist.
   */
  async getUserOnboardingData(
    userId: number,
  ): Promise<UserInfoResponseDto | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }
    const row = await this.prisma.onboarding_data.findUnique({
      where: { userId },
    });
    return this.mapRowToDto(userId, row, user.createdAt);
  }

  async saveOnboardingData(
    userId: number,
    dto: OnboardingDataDto,
  ): Promise<UserInfoResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.onboarding_data.findUnique({
      where: { userId },
    });
    const patch = this.buildPatchFromDto(dto);

    if (!existing) {
      await this.prisma.onboarding_data.create({
        data: {
          userId,
          updatedAt: new Date(),
          cycleLength: dto.cycleLength ?? 28,
          periodDuration: dto.periodLength ?? 5,
          notificationsEnabled: dto.notificationsEnabled ?? true,
          onboardingStep: dto.onboardingStep ?? 1,
          isCompleted: dto.isCompleted ?? false,
          pregnancyStatus: dto.pregnancyStatus ?? null,
          lastPeriodDate: dto.lastPeriodDate ?? null,
          pregnancyWeek: dto.pregnancyWeek ?? null,
          pregnancyProgress: dto.pregnancyProgress ?? null,
          healthGoals:
            dto.healthGoals !== undefined
              ? JSON.stringify(dto.healthGoals)
              : null,
          ...patch,
        },
      });
    } else if (Object.keys(patch).length > 0) {
      await this.prisma.onboarding_data.update({
        where: { userId },
        data: { ...patch, updatedAt: new Date() },
      });
    }

    const row = await this.prisma.onboarding_data.findUnique({
      where: { userId },
    });
    return this.mapRowToDto(userId, row!, user.createdAt);
  }

  private buildPatchFromDto(
    dto: OnboardingDataDto,
  ): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};
    if (dto.pregnancyStatus !== undefined) {
      mapped.pregnancyStatus = dto.pregnancyStatus;
    }
    if (dto.lastPeriodDate !== undefined) {
      mapped.lastPeriodDate = dto.lastPeriodDate;
    }
    if (dto.cycleLength !== undefined) {
      mapped.cycleLength = dto.cycleLength;
    }
    if (dto.periodLength !== undefined) {
      mapped.periodDuration = dto.periodLength;
    }
    if (dto.pregnancyWeek !== undefined) {
      mapped.pregnancyWeek = dto.pregnancyWeek;
    }
    if (dto.pregnancyProgress !== undefined) {
      mapped.pregnancyProgress = dto.pregnancyProgress;
    }
    if (dto.healthGoals !== undefined) {
      mapped.healthGoals = JSON.stringify(dto.healthGoals);
    }
    if (dto.notificationsEnabled !== undefined) {
      mapped.notificationsEnabled = dto.notificationsEnabled;
    }
    if (dto.onboardingStep !== undefined) {
      mapped.onboardingStep = dto.onboardingStep;
    }
    if (dto.isCompleted !== undefined) {
      mapped.isCompleted = dto.isCompleted;
    }
    return mapped;
  }

  private parseHealthGoals(raw: string | null): string[] {
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private mapRowToDto(
    userId: number,
    row: onboarding_data | null,
    userCreatedAt: Date,
  ): UserInfoResponseDto {
    if (!row) {
      return {
        id: userId,
        userId,
        pregnancyStatus: 'PLANNING_PREGNANCY',
        lastPeriodDate: null,
        cycleLength: 28,
        periodLength: 5,
        pregnancyWeek: null,
        pregnancyProgress: null,
        healthGoals: [],
        notificationsEnabled: true,
        isCompleted: false,
        onboardingStep: 1,
        createdAt: userCreatedAt,
        updatedAt: userCreatedAt,
      };
    }

    return {
      id: userId,
      userId,
      pregnancyStatus: row.pregnancyStatus ?? 'PLANNING_PREGNANCY',
      lastPeriodDate: row.lastPeriodDate,
      cycleLength: row.cycleLength ?? 28,
      periodLength: row.periodDuration ?? 5,
      pregnancyWeek: row.pregnancyWeek,
      pregnancyProgress: row.pregnancyProgress,
      healthGoals: this.parseHealthGoals(row.healthGoals),
      notificationsEnabled: row.notificationsEnabled ?? true,
      isCompleted: row.isCompleted,
      onboardingStep: row.onboardingStep ?? 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
