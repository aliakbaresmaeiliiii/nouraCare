import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { OnboardingDataDto, CompleteOnboardingDto } from './dto/onboarding.dto';
import { AuthService } from '../auth/auth.service';
import { v4 as uuidv4 } from 'uuid';

interface TemporaryOnboardingData {
  sessionId: string;
  data: OnboardingDataDto;
  expiresAt: Date;
}

@Injectable()
export class OnboardingService {
  private temporaryData = new Map<string, TemporaryOnboardingData>();

  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {
    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  async saveTemporaryOnboardingData(onboardingData: OnboardingDataDto): Promise<{ sessionId: string; expiresAt: Date }> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    this.temporaryData.set(sessionId, {
      sessionId,
      data: onboardingData,
      expiresAt
    });

    return { sessionId, expiresAt };
  }

  async getTemporaryOnboardingData(sessionId: string): Promise<OnboardingDataDto> {
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

  async completeOnboardingWithRegistration(sessionId: string, email: string, phone: string) {
    const session = this.temporaryData.get(sessionId);
    
    if (!session) {
      throw new NotFoundException('Onboarding session not found or expired');
    }

    if (session.expiresAt < new Date()) {
      this.temporaryData.delete(sessionId);
      throw new NotFoundException('Onboarding session expired');
    }

    // Register user with auth service
    const registrationResult = await this.authService.register(email, phone);
    
    // Get the created user
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Save onboarding data to user
    await this.saveOnboardingDataToUser(user.id, session.data);

    // Clean up temporary data
    this.temporaryData.delete(sessionId);

    return {
      message: 'Onboarding completed successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified
      },
      onboardingData: session.data
    };
  }

  private async saveOnboardingDataToUser(userId: number, onboardingData: OnboardingDataDto) {
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

    await this.prisma.user.update({
      where: { id: userId },
      data: filteredData,
    });
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
