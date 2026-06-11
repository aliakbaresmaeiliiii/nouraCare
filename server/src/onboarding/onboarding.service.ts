import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { OnboardingDataDto, CompleteOnboardingDto } from './dto/onboarding.dto';
import { InitializeOnboardingDto } from './dto/initialize-onboarding.dto';
import { ReproductiveStateService } from '../reproductive/reproductive-state.service';
import {
  normalizeIsoDateOnlyInput,
  parseDateOnlyUtc,
} from '../reproductive/utils/pregnancy-lmp.util';

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
    private readonly reproductiveStateService: ReproductiveStateService,
  ) {
    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  async initializeOnboarding(userId: number, dto: InitializeOnboardingDto) {
    const dashboard = await this.reproductiveStateService.initializeForUser(userId, dto);
    await this.persistOnboardingDataAfterReproductiveInit(userId, dto, dashboard);
    return dashboard;
  }

  /**
   * Keeps `onboarding_data` aligned with the reproductive domain after POST /onboarding
   * so GET journey (`lastPeriodDate`, `pregnancyWeek`) matches dashboard LMP/week.
   */
  private async persistOnboardingDataAfterReproductiveInit(
    userId: number,
    dto: InitializeOnboardingDto,
    dashboard: {
      state: string;
      week?: number | null;
      progress?: number | null;
      lastMenstrualPeriod?: string | null;
    },
  ): Promise<void> {
    try {
      const pregnancyStatus = this.mapInitStateToPregnancyStatus(dto.state);
      let lastPeriodIso: string | null = null;
      if (dto.state === 'pregnant') {
        lastPeriodIso =
          normalizeIsoDateOnlyInput(dto.pregnancyStartDate) ??
          normalizeIsoDateOnlyInput(dashboard.lastMenstrualPeriod);
      } else {
        lastPeriodIso = normalizeIsoDateOnlyInput(dto.lastPeriodDate);
      }

      let lastPeriodDate: Date | null = null;
      if (lastPeriodIso) {
        lastPeriodDate = parseDateOnlyUtc(lastPeriodIso);
      }

      const pregnancyWeek =
        dto.state === 'pregnant' && dashboard.week != null ? dashboard.week : undefined;
      const pregnancyProgress =
        dto.state === 'pregnant' && dashboard.progress != null
          ? String(Math.min(100, Math.round(Number(dashboard.progress) * 100)))
          : undefined;

      const existingRecord = await this.prisma.onboarding_data.findUnique({
        where: { userId },
      });

      const patch: Record<string, unknown> = {
        pregnancyStatus,
        updatedAt: new Date(),
        isCompleted: true,
      };
      if (lastPeriodDate !== null) {
        patch.lastPeriodDate = lastPeriodDate;
      }
      if (dto.cycleLength != null) {
        patch.cycleLength = dto.cycleLength;
      }
      if (pregnancyWeek !== undefined) {
        patch.pregnancyWeek = pregnancyWeek;
      }
      if (pregnancyProgress !== undefined) {
        patch.pregnancyProgress = pregnancyProgress;
      }

      if (existingRecord) {
        await this.prisma.onboarding_data.update({
          where: { userId },
          data: patch as any,
        });
      } else {
        await this.prisma.onboarding_data.create({
          data: {
            userId,
            updatedAt: new Date(),
            cycleLength: dto.cycleLength ?? 28,
            periodDuration: 5,
            notificationsEnabled: true,
            onboardingStep: 1,
            ...patch,
          } as any,
        });
      }
    } catch (e) {
      console.error(
        'Failed to persist onboarding_data after reproductive init:',
        (e as Error)?.message ?? e,
      );
    }
  }

  private mapInitStateToPregnancyStatus(state: string): string {
    const key = String(state ?? '').toLowerCase();
    const statusMap: Record<string, string> = {
      cycle: 'PLANNING_PREGNANCY',
      planning: 'PLANNING_PREGNANCY',
      pregnant: 'PREGNANT',
      postpartum: 'POSTPARTUM',
    };
    return statusMap[key] ?? key.toUpperCase();
  }

  async saveTemporaryOnboardingData(onboardingData: OnboardingDataDto) {
    try {
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const lmp =
        normalizeIsoDateOnlyInput(onboardingData.lmp_date) ??
        normalizeIsoDateOnlyInput(onboardingData.last_period);
      const status = String(onboardingData.pregnancy_status ?? '').toLowerCase();

      const data: OnboardingDataDto = {
        ...onboardingData,
        lmp_date: lmp ?? undefined,
        last_period: lmp ?? undefined,
      };
      // Single source of truth: gestational week is always derived from LMP on the server / dashboard for pregnant users.
      if (status === 'pregnant') {
        delete data.pregnancy_week;
      }

      // Allow partial progress (e.g. user chose "tracking" before the LMP step).
      // LMP is collected before finish; validate at completion if needed.

      this.temporaryData.set(sessionId, {
        sessionId,
        data,
        expiresAt,
      });
      
      return { 
        sessionId, 
        message: 'Onboarding progress saved successfully'
      };
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      throw new Error(`Failed to save your progress: ${error.message}. Please try again later.`);
    }
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

    const lmpForComplete =
      normalizeIsoDateOnlyInput(session.data.lmp_date) ??
      normalizeIsoDateOnlyInput(session.data.last_period);
    const completeStatus = String(session.data.pregnancy_status ?? '').toLowerCase();
    const needsLmpToFinish =
      completeStatus === 'tracking' ||
      completeStatus === 'trying' ||
      completeStatus === 'pregnant';
    if (needsLmpToFinish && !lmpForComplete) {
      throw new BadRequestException(
        'Last period start (LMP) is required to finish onboarding. Please enter the first day of your last period.',
      );
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
      await this.prisma.onboarding_data.update({
        where: { userId },
        data: {
          ...filteredData,
          updatedAt: new Date(),
        },
      });
    } else {
      const createData = {
        userId,
        updatedAt: new Date(),
        cycleLength: 28,
        periodDuration: 5,
        notificationsEnabled: true,
        onboardingStep: 1,
        ...filteredData,
      };

      await this.prisma.onboarding_data.create({
        data: createData as any,
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
      postpartum: 'POSTPARTUM',
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
