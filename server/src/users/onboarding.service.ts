import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { OnboardingDataDto, UserInfoResponseDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async saveOnboardingData(userId: number, onboardingData: OnboardingDataDto): Promise<UserInfoResponseDto> {
    // Transform healthGoals array to JSON string for storage
    const healthGoalsJson = onboardingData.healthGoals ? JSON.stringify(onboardingData.healthGoals) : null;

    const updateData = {
      status: onboardingData.pregnancyStatus,
      lastPeriodStartDate: onboardingData.lastPeriodDate,
      menstrualCycleLength: onboardingData.cycleLength,
      periodDuration: onboardingData.periodLength,
      pregnancyWeek: onboardingData.pregnancyWeek,
      pregnancyProgress: onboardingData.pregnancyProgress,
      healthGoals: healthGoalsJson,
      notificationsEnabled: onboardingData.notificationsEnabled,
    };

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: filteredData,
    });

    return this.transformToUserInfoResponse(updatedUser);
  }

  async getUserOnboardingData(userId: number): Promise<UserInfoResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return this.transformToUserInfoResponse(user);
  }

  private transformToUserInfoResponse(user: any): UserInfoResponseDto {
    return {
      id: user.id,
      userId: user.id,
      pregnancyStatus: user.status || 'PLANNING_PREGNANCY',
      lastPeriodDate: user.lastPeriodStartDate,
      cycleLength: user.menstrualCycleLength || 28,
      periodLength: user.periodDuration || 5,
      pregnancyWeek: user.pregnancyWeek,
      pregnancyProgress: user.pregnancyProgress,
      healthGoals: user.healthGoals ? JSON.parse(user.healthGoals) : [],
      notificationsEnabled: user.notificationsEnabled ?? true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
