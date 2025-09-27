import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  listCities() {
    return this.prisma.city.findMany({ orderBy: { name: 'asc' } });
  }

  listDistricts(cityId: number) {
    return this.prisma.district.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    });
  }

  listUserAddresses(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      include: { city: true, district: true },
    });
  }

  createAddress(userId: number, dto: CreateAddressDto) {
    return this.prisma.address.create({
      data: { userId, ...dto },
      include: { city: true, district: true },
    });
  }
}
