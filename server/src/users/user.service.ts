import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/user.dto';
import { PrismaService } from '../prisma/services/prisma.service';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}
  async getUserById(userId: number) {
    return this.prismaService.user.findUnique({ where: { id: userId } });
  }
  async editUserInfo(userId: number, updateUserDto: UpdateUserDto) {
    // Filter out undefined values and handle date conversions
    const updateData = Object.fromEntries(
      Object.entries(updateUserDto)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          // Convert date strings to Date objects
          if (['birthday', 'lastPeriodStartDate'].includes(key) && value) {
            return [key, new Date(value as string)];
          }
          return [key, value];
        })
    );
    
    return this.prismaService.user.update({
      where: { id: userId },
      data: updateData,
    });
  }
}
