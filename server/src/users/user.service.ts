import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/user.dto';
import { PrismaService } from '../prisma/services/prisma.service';

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
