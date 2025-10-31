import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { OnboardingDataDto, CompleteOnboardingDto } from './dto/onboarding.dto';

interface TemporaryOnboardingData {
  sessionId: string;
  data: OnboardingDataDto;
  expiresAt: Date;
}

@Injectable()
export class OnboardingService {
  private temporaryData = new Map<string, TemporaryOnboardingData>();

  constructor(private prisma: PrismaService) {
    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  async saveTemporaryOnboardingData(onboardingData: OnboardingDataDto) {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('Saving onboarding data (debug mode)', onboardingData);
    this.temporaryData.set(sessionId, {
      sessionId,
      data: onboardingData,
      expiresAt,
    });
    return { sessionId, expiresAt };
  }

  async getTemporaryOnboardingData(
    sessionId: string,
  ): Promise<OnboardingDataDto> {
    const session = this.temporaryData.get(sessionId);

    if (!session) {
      throw new NotFoundException('Onboarding session not found or expired');
    }

    if (session.expiresAt < new Date()) {
      this.temporaryData.delete(sessionId);
      throw new NotFoundException('Onboarding session expired');
    }

    return session.data;
  }

  async deleteTemporaryOnboardingData(sessionId: string) {
    this.temporaryData.delete(sessionId);
  }

  async completeOnboardingWithRegistration(
    sessionId: string,
    email: string,
    phoneNumber: string,
  ) {
    const session = this.temporaryData.get(sessionId);

    if (!session) {
      throw new NotFoundException('Onboarding session not found or expired');
    }

    if (session.expiresAt < new Date()) {
      this.temporaryData.delete(sessionId);
      throw new NotFoundException('Onboarding session expired');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create user directly
    const user = await this.prisma.user.create({
      data: {
        email: email,
        fullName: '',
        phoneNumber: phoneNumber,
        isVerified: false,
        updatedAt: new Date(),
      },
    });

    // Save onboarding data to user
    await this.saveOnboardingDataToUser(user.id, session.data);

    // Clean up temporary data
    this.temporaryData.delete(sessionId);

    return {
      message: 'Onboarding completed successfully',
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified,
      },
      onboardingData: session.data,
    };
  }

  private async saveOnboardingDataToUser(
    userId: number,
    onboardingData: OnboardingDataDto,
  ) {
    // Map client field names to database field names and transform data
    const onboardingDataToSave = {
      pregnancyStatus: this.mapPregnancyStatus(onboardingData.pregnancy_status),
      lastPeriodDate: onboardingData.last_period,
      cycleLength: onboardingData.cycle_length,
      periodDuration: onboardingData.period_length,
      pregnancyWeek: onboardingData.pregnancy_week,
      pregnancyProgress: onboardingData.pregnancy_progress,
      healthGoals: onboardingData.health_goals, // Already JSON string from client
      notificationsEnabled: this.mapNotifications(onboardingData.notifications),
      isCompleted: true,
    };

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(onboardingDataToSave).filter(
        ([_, value]) => value !== undefined,
      ),
    );

    // Save to onboarding_data table using raw SQL approach
    // First check if record exists
    const existingRecord = await this.prisma.onboarding_data.findUnique({
      where: { userId },
    });

    if (existingRecord) {
      // Update existing record
      await this.prisma.onboarding_data.update({
        where: { userId },
        data: filteredData,
      });
    } else {
      // Use explicit typing to avoid TypeScript issues
      const createData: any = {
        userId: userId,
        ...filteredData,
      };

      await this.prisma.onboarding_data.create({
        data: createData,
      });
    }

    // Also update critical user fields for backward compatibility
    const userUpdateData = {
      status: this.mapPregnancyStatus(onboardingData.pregnancy_status),
      lastPeriodStartDate: onboardingData.last_period,
      menstrualCycleLength: onboardingData.cycle_length,
      periodDuration: onboardingData.period_length,
      pregnancyWeek: onboardingData.pregnancy_week,
      pregnancyProgress: onboardingData.pregnancy_progress,
      healthGoals: onboardingData.health_goals,
      notificationsEnabled: this.mapNotifications(onboardingData.notifications),
    };

    const filteredUserData = Object.fromEntries(
      Object.entries(userUpdateData).filter(
        ([_, value]) => value !== undefined,
      ),
    );

    if (Object.keys(filteredUserData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: filteredUserData,
      });
    }
  }

  private mapPregnancyStatus(status: string): string | undefined {
    if (!status) return undefined;

    const statusMap: { [key: string]: string } = {
      tracking: 'PLANNING_PREGNANCY',
      pregnant: 'PREGNANT',
      has_child: 'HAS_CHILD',
      planning: 'PLANNING_PREGNANCY',
    };

    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }

  private mapNotifications(
    notifications: boolean | string,
  ): boolean | undefined {
    if (typeof notifications === 'boolean') return notifications;
    if (typeof notifications === 'string') {
      return (
        notifications.toLowerCase() === 'yes' ||
        notifications.toLowerCase() === 'true'
      );
    }
    return undefined;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.temporaryData.entries()) {
      if (session.expiresAt < now) {
        this.temporaryData.delete(sessionId);
      }
    }
  }
}
