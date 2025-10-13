import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/user.dto';
import { PrismaService } from '../prisma/services/prisma.service';
import {
  UpdateReproductiveStatusDto,
  ReproductiveStatusResponseDto,
} from './dto/reproductive-status.dto';
import { PeriodTrackerResponseDto } from './dto/period-tracker.dto';
import {
  CreatePregnancyPlanningDto,
  UpdatePregnancyPlanningDto,
  PregnancyPlanningResponseDto,
} from './dto/pregnancy-planning.dto';
import {
  CreatePeriodLogDto,
  UpdatePeriodLogDto,
  PeriodLogResponseDto,
} from './dto/period-log.dto';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async getUserById(userId: number) {
    const user = await this.prismaService.user.findUnique({ 
      where: { id: userId } 
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async editUserInfo(userId: number, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Filter out undefined values and handle date conversions
    const updateData = Object.fromEntries(
      Object.entries(updateUserDto)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          // Convert date strings to Date objects
          if (['birthday'].includes(key) && value) {
            return [key, new Date(value as string)];
          }
          return [key, value];
        }),
    );

    return this.prismaService.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async getReproductiveStatus(
    userId: number,
  ): Promise<ReproductiveStatusResponseDto> {
    // Get user data from OnboardingData table since reproductive status fields are stored there
    const onboardingData = await this.prismaService.onboardingData.findUnique({
      where: { userId },
    });

    if (!onboardingData) {
      throw new NotFoundException('Reproductive status data not found');
    }

    return {
      isPregnant: onboardingData.pregnancyStatus === 'PREGNANT',
      pregnancyEndDate: null, // Not stored in current schema
      lastPeriodStartDate: onboardingData.lastPeriodDate,
      menstrualCycleLength: onboardingData.cycleLength,
      periodDuration: onboardingData.periodDuration,
      pregnancyWeek: onboardingData.pregnancyWeek,
      pregnancyProgress: onboardingData.pregnancyProgress,
    };
  }

  async updateReproductiveStatus(
    userId: number,
    dto: UpdateReproductiveStatusDto,
  ) {
    // Check if user exists
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update or create onboarding data
    const existingOnboarding = await this.prismaService.onboardingData.findUnique({
      where: { userId },
    });

    const updateData: any = {
      pregnancyStatus: dto.isPregnant ? 'PREGNANT' : 'PLANNING_PREGNANCY',
    };

    // Handle last period date
    if (dto.lastPeriodDate) {
      updateData.lastPeriodDate = new Date(dto.lastPeriodDate);
    }

    // Handle average cycle length
    if (dto.averageCycleLength) {
      updateData.cycleLength = dto.averageCycleLength;
    }

    // Handle average period duration
    if (dto.averagePeriodDuration) {
      updateData.periodDuration = dto.averagePeriodDuration;
    }

    if (existingOnboarding) {
      return this.prismaService.onboardingData.update({
        where: { userId },
        data: updateData,
      });
    } else {
      return this.prismaService.onboardingData.create({
        data: {
          userId,
          ...updateData,
        },
      });
    }
  }

  async getPeriodTrackerData(
    userId: number,
  ): Promise<PeriodTrackerResponseDto> {
    // Get data from OnboardingData table
    const onboardingData = await this.prismaService.onboardingData.findUnique({
      where: { userId },
    });

    if (!onboardingData) {
      throw new NotFoundException('Period tracking data not found');
    }

    if (!onboardingData.lastPeriodDate || !onboardingData.cycleLength) {
      throw new NotFoundException(
        'Period tracking data not available. Please provide last period date and cycle length.',
      );
    }

    const lastPeriodDate = onboardingData.lastPeriodDate;
    const cycleLength = onboardingData.cycleLength;
    const today = new Date();

    // Calculate current cycle day
    const daysSinceLastPeriod = Math.floor(
      (today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const currentCycleDay = (daysSinceLastPeriod % cycleLength) + 1;

    // Calculate next period date
    const nextPeriodDate = new Date(lastPeriodDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

    // Calculate ovulation date (typically around day 14 of a 28-day cycle)
    const ovulationDay = Math.floor(cycleLength * 0.5); // Approximately halfway through cycle
    const ovulationDate = new Date(lastPeriodDate);
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDay);

    // Calculate fertile window (typically 5 days before ovulation)
    const fertileWindowStart = new Date(ovulationDate);
    fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);

    const fertileWindowEnd = new Date(ovulationDate);
    fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

    return {
      nextPeriodDate,
      ovulationDate,
      fertileWindow: {
        start: fertileWindowStart,
        end: fertileWindowEnd,
      },
      currentCycleDay,
      cycleLength,
    };
  }

  // Pregnancy Planning Methods
  async createPregnancyPlanning(
    userId: number,
    createPregnancyPlanningDto: CreatePregnancyPlanningDto,
  ): Promise<PregnancyPlanningResponseDto> {
    // Check if user exists
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has pregnancy planning data
    const existingPlanning = await this.prismaService.pregnancyPlanning.findFirst({
      where: { userId },
    });

    if (existingPlanning) {
      throw new ConflictException(
        'Pregnancy planning data already exists for this user',
      );
    }

    // Create pregnancy planning record
    const pregnancyPlanning = await this.prismaService.pregnancyPlanning.create({
      data: {
        userId,
        lastPeriodDate: createPregnancyPlanningDto.lastPeriodDate,
        cycleLength: createPregnancyPlanningDto.cycleLength,
        averagePeriodDuration: createPregnancyPlanningDto.averagePeriodDuration,
        lifestyleGoals: createPregnancyPlanningDto.lifestyleGoals,
        notes: createPregnancyPlanningDto.notes,
      },
    });

    return this.enrichPregnancyPlanningData(pregnancyPlanning);
  }

  async getPregnancyPlanning(
    userId: number,
  ): Promise<PregnancyPlanningResponseDto> {
    const pregnancyPlanning = await this.prismaService.pregnancyPlanning.findFirst({
      where: { userId },
    });

    if (!pregnancyPlanning) {
      throw new NotFoundException('Pregnancy planning data not found');
    }

    return this.enrichPregnancyPlanningData(pregnancyPlanning);
  }

  async updatePregnancyPlanning(
    userId: number,
    updatePregnancyPlanningDto: UpdatePregnancyPlanningDto,
  ): Promise<PregnancyPlanningResponseDto> {
    // Check if pregnancy planning data exists
    const existingPlanning = await this.prismaService.pregnancyPlanning.findFirst({
      where: { userId },
    });

    if (!existingPlanning) {
      throw new NotFoundException('Pregnancy planning data not found');
    }

    // Prepare update data
    const updateData: any = {};

    if (updatePregnancyPlanningDto.lastPeriodDate) {
      updateData.lastPeriodDate = updatePregnancyPlanningDto.lastPeriodDate;
    }

    if (updatePregnancyPlanningDto.cycleLength) {
      updateData.cycleLength = updatePregnancyPlanningDto.cycleLength;
    }

    if (updatePregnancyPlanningDto.averagePeriodDuration !== undefined) {
      updateData.averagePeriodDuration = updatePregnancyPlanningDto.averagePeriodDuration;
    }

    if (updatePregnancyPlanningDto.lifestyleGoals !== undefined) {
      updateData.lifestyleGoals = updatePregnancyPlanningDto.lifestyleGoals;
    }

    if (updatePregnancyPlanningDto.notes !== undefined) {
      updateData.notes = updatePregnancyPlanningDto.notes;
    }

    const updatedPlanning = await this.prismaService.pregnancyPlanning.update({
      where: { id: existingPlanning.id },
      data: updateData,
    });

    return this.enrichPregnancyPlanningData(updatedPlanning);
  }

  async deletePregnancyPlanning(userId: number): Promise<void> {
    const existingPlanning = await this.prismaService.pregnancyPlanning.findFirst({
      where: { userId },
    });

    if (!existingPlanning) {
      throw new NotFoundException('Pregnancy planning data not found');
    }

    await this.prismaService.pregnancyPlanning.delete({
      where: { id: existingPlanning.id },
    });
  }

  private enrichPregnancyPlanningData(
    pregnancyPlanning: any,
  ): PregnancyPlanningResponseDto {
    const lastPeriodDate = pregnancyPlanning.lastPeriodDate;
    const cycleLength = pregnancyPlanning.cycleLength;
    const today = new Date();

    // Calculate ovulation date (typically around day 14 of a 28-day cycle)
    const ovulationDay = Math.floor(cycleLength * 0.5);
    const ovulationDate = new Date(lastPeriodDate);
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDay);

    // Calculate fertile window (typically 5 days before ovulation)
    const fertileWindowStart = new Date(ovulationDate);
    fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);

    const fertileWindowEnd = new Date(ovulationDate);
    fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

    // Calculate next period date
    const nextPeriodDate = new Date(lastPeriodDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

    // Calculate pregnancy probability based on cycle day
    const daysSinceLastPeriod = Math.floor(
      (today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const currentCycleDay = (daysSinceLastPeriod % cycleLength) + 1;

    let pregnancyProbability = 0;
    if (
      currentCycleDay >= ovulationDay - 5 &&
      currentCycleDay <= ovulationDay + 1
    ) {
      pregnancyProbability = 20 + (currentCycleDay - (ovulationDay - 5)) * 10;
      pregnancyProbability = Math.min(pregnancyProbability, 80);
    }

    return {
      id: pregnancyPlanning.id,
      userId: pregnancyPlanning.userId,
      lastPeriodDate: pregnancyPlanning.lastPeriodDate,
      cycleLength: pregnancyPlanning.cycleLength,
      averagePeriodDuration: pregnancyPlanning.averagePeriodDuration,
      lifestyleGoals: pregnancyPlanning.lifestyleGoals,
      notes: pregnancyPlanning.notes,
      createdAt: pregnancyPlanning.createdAt,
      updatedAt: pregnancyPlanning.updatedAt,
      
      ovulationDate,
      fertileWindow: {
        start: fertileWindowStart,
        end: fertileWindowEnd,
      },
      nextPeriodDate,
      pregnancyProbability,
    };
  }

  // Period Log Methods
  async createPeriodLog(
    userId: number,
    createPeriodLogDto: CreatePeriodLogDto,
  ): Promise<PeriodLogResponseDto> {
    // Check if user exists
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create period log record
    const periodLog = await this.prismaService.periodLog.create({
      data: {
        userId,
        lastPeriodDate: createPeriodLogDto.lastPeriodDate,
        mood: createPeriodLogDto.mood,
        notes: createPeriodLogDto.notes,
        averagePeriodDuration: createPeriodLogDto.averagePeriodDuration,
      },
    });

    return this.mapToPeriodLogResponseDto(periodLog);
  }

  async getPeriodLogs(userId: number): Promise<PeriodLogResponseDto[]> {
    // Check if user exists
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const periodLogs = await this.prismaService.periodLog.findMany({
      where: { userId },
      orderBy: { lastPeriodDate: 'desc' },
    });

    return periodLogs.map((log) => this.mapToPeriodLogResponseDto(log));
  }

  async getPeriodLogById(
    userId: number,
    periodLogId: number,
  ): Promise<PeriodLogResponseDto> {
    const periodLog = await this.prismaService.periodLog.findFirst({
      where: {
        id: periodLogId,
        userId,
      },
    });

    if (!periodLog) {
      throw new NotFoundException('Period log not found');
    }

    return this.mapToPeriodLogResponseDto(periodLog);
  }

  async updatePeriodLog(
    userId: number,
    periodLogId: number,
    updatePeriodLogDto: UpdatePeriodLogDto,
  ): Promise<PeriodLogResponseDto> {
    // Check if period log exists and belongs to user
    const existingLog = await this.prismaService.periodLog.findFirst({
      where: {
        id: periodLogId,
        userId,
      },
    });

    if (!existingLog) {
      throw new NotFoundException('Period log not found');
    }

    // Prepare update data
    const updateData: any = {};

    if (updatePeriodLogDto.lastPeriodDate) {
      updateData.lastPeriodDate = updatePeriodLogDto.lastPeriodDate;
    }

    if (updatePeriodLogDto.mood !== undefined) {
      updateData.mood = updatePeriodLogDto.mood;
    }

    if (updatePeriodLogDto.notes !== undefined) {
      updateData.notes = updatePeriodLogDto.notes;
    }

    if (updatePeriodLogDto.averagePeriodDuration !== undefined) {
      updateData.averagePeriodDuration = updatePeriodLogDto.averagePeriodDuration;
    }

    const updatedLog = await this.prismaService.periodLog.update({
      where: { id: periodLogId },
      data: updateData,
    });

    return this.mapToPeriodLogResponseDto(updatedLog);
  }

  async deletePeriodLog(userId: number, periodLogId: number): Promise<void> {
    // Check if period log exists and belongs to user
    const existingLog = await this.prismaService.periodLog.findFirst({
      where: {
        id: periodLogId,
        userId,
      },
    });

    if (!existingLog) {
      throw new NotFoundException('Period log not found');
    }

    await this.prismaService.periodLog.delete({
      where: { id: periodLogId },
    });
  }

  private mapToPeriodLogResponseDto(periodLog: any): PeriodLogResponseDto {
    return {
      id: periodLog.id,
      userId: periodLog.userId,
      lastPeriodDate: periodLog.lastPeriodDate,
      mood: periodLog.mood,
      notes: periodLog.notes,
      averagePeriodDuration: periodLog.averagePeriodDuration,
      createdAt: periodLog.createdAt,
      updatedAt: periodLog.updatedAt,
    };
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use a transaction to ensure all operations succeed or fail together
    await this.prismaService.$transaction(async (tx) => {
      // 1. Revoke all refresh tokens for the user
      await tx.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });

      // 2. Delete user and all related data (cascade delete will handle related records)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    console.log(`✅ User ${userId} deleted successfully with token invalidation`);
  }
}
