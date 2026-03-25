import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/user.dto';
import { PrismaService } from '../prisma/services/prisma.service';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async getUserById(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { user_profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { user_profile, ...rest } = user;
    const profile = user_profile as any;
    return {
      ...rest,
      profileImage: profile?.profileImage ?? profile?.avatarUrl ?? '',
    };
  }

  async editUserInfo(userId: number, updateUserDto: UpdateUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const dto = updateUserDto as UpdateUserDto;
    let profileImage =
      dto.profileImage !== undefined ? dto.profileImage : undefined;
    if (
      typeof profileImage === 'string' &&
      (profileImage.startsWith('blob:') || profileImage.startsWith('data:'))
    ) {
      profileImage = undefined;
    }

    const now = new Date();
    const userData = {
      updatedAt: now,
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phoneNumber: dto.phone }),
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.fullName === undefined &&
        dto.name !== undefined && { fullName: dto.name }),
      ...(dto.dateOfBirth !== undefined && {
        dateOfBirth: dto.dateOfBirth
          ? new Date(dto.dateOfBirth as unknown as string)
          : null,
      }),
    };

    await this.prismaService.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: userData,
      });

      if (profileImage !== undefined) {
        const imageUrl =
          typeof profileImage === 'string' && profileImage.trim() === ''
            ? null
            : profileImage;
        await tx.user_profile.upsert({
          where: { userId },
          create: {
            userId,
            avatarUrl: imageUrl,
            profileImage: imageUrl,
            createdAt: now,
            updatedAt: now,
          } as any,
          update: {
            avatarUrl: imageUrl,
            profileImage: imageUrl,
            updatedAt: now,
          } as any,
        });
      }
    });

    return this.getUserById(userId);
  }

  // Health tracking features have been replaced with HealthRecord model
  async getReproductiveStatus(userId: number): Promise<any> {
    throw new NotFoundException('Reproductive status feature has been replaced with HealthRecord system');
  }

  async updateReproductiveStatus(userId: number, dto: any): Promise<any> {
    throw new NotFoundException('Reproductive status feature has been replaced with HealthRecord system');
  }

  async getPeriodTrackerData(userId: number): Promise<any> {
    throw new NotFoundException('Period tracking feature has been replaced with HealthRecord system');
  }

  // Pregnancy Planning Methods - REMOVED (use HealthRecord model instead)
  async createPregnancyPlanning(userId: number, dto: any): Promise<any> {
    throw new NotFoundException('Pregnancy planning feature has been replaced with HealthRecord system');
  }

  async getPregnancyPlanning(userId: number): Promise<any> {
    throw new NotFoundException('Pregnancy planning feature has been replaced with HealthRecord system');
  }

  async updatePregnancyPlanning(userId: number, dto: any): Promise<any> {
    throw new NotFoundException('Pregnancy planning feature has been replaced with HealthRecord system');
  }

  async deletePregnancyPlanning(userId: number): Promise<void> {
    throw new NotFoundException('Pregnancy planning feature has been replaced with HealthRecord system');
  }

  // Period Log Methods - REMOVED (use HealthRecord model instead)
  async createPeriodLog(userId: number, dto: any): Promise<any> {
    throw new NotFoundException('Period log feature has been replaced with HealthRecord system');
  }

  async getPeriodLogs(userId: number): Promise<any[]> {
    throw new NotFoundException('Period log feature has been replaced with HealthRecord system');
  }

  async getPeriodLogById(userId: number, periodLogId: number): Promise<any> {
    throw new NotFoundException('Period log feature has been replaced with HealthRecord system');
  }

  async updatePeriodLog(userId: number, periodLogId: number, dto: any): Promise<any> {
    throw new NotFoundException('Period log feature has been replaced with HealthRecord system');
  }

  async deletePeriodLog(userId: number, periodLogId: number): Promise<void> {
    throw new NotFoundException('Period log feature has been replaced with HealthRecord system');
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
      await tx.refresh_tokens.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });

      // 2. Delete user and all related data (cascade delete will handle related records)
      await tx.user.delete({
        where: { id: userId },
      });
    });

  }
}
