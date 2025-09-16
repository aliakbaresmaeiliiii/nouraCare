import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  // async create(createDoctorDto: CreateDoctorDto) {
  //   return this.prisma.doctor.create({
  //     data: createDoctorDto,
  //   });
  // }

  async findAll() {
    return this.prisma.doctors.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctors.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    const doctor = await this.findOne(id);

    return this.prisma.doctors.update({
      where: { id },
      data: updateDoctorDto,
    });
  }

  async remove(id: string) {
    const doctor = await this.findOne(id);

    return this.prisma.doctors.delete({
      where: { id },
    });
  }

  async findBySpecialty(specialty: string) {
    return this.prisma.doctors.findMany({
      where: {
        specialty: {
          contains: specialty,
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  async findByLocation(location: string) {
    return this.prisma.doctors.findMany({
      where: {
        location: {
          contains: location,
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  async findByConsultationType(consultationType: string) {
    return this.prisma.doctors.findMany({
      where: {
        consultationType: consultationType as any,
      },
      orderBy: { rating: 'desc' },
    });
  }
}
