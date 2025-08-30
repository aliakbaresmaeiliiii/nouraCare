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
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        name: updateUserDto.name,
        email: updateUserDto.email,
        birthday: updateUserDto.birthday
          ? new Date(updateUserDto.birthday)
          : undefined,
        city: updateUserDto.city,
        profileImage: updateUserDto.profileImage,
        menstrualCycleLength: updateUserDto.menstrualCycleLength,
        periodDuration: updateUserDto.periodDuration,
        lastPeriodStartDate: updateUserDto.lastPeriodStartDate
          ? new Date(updateUserDto.lastPeriodStartDate)
          : undefined,
      },
    });
  }
}
