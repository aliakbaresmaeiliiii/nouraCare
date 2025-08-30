import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  listCities() {
    return this.prisma.city.findMany({ orderBy: { name: 'asc' } });
  }

  listDistricts(cityId: number) {
    return this.prisma.district.findMany({ where: { cityId }, orderBy: { name: 'asc' } });
  }

  listUserAddresses(userId: number) {
    return this.prisma.address.findMany({ where: { userId }, include: { city: true, district: true } });
  }

  createAddress(userId: number, dto: { cityId: number; districtId?: number; addressLine: string; latitude: number; longitude: number; }) {
    return this.prisma.address.create({ data: { userId, ...dto } });
  }
}


