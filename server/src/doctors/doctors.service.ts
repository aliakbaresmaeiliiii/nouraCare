import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/services/prisma.service';
import { doctors, doctors_consultationType } from '@prisma/client';

export type DoctorPublicDto = {
  id: string;
  fullName: string;
  specialty: string;
  experienceYears: number;
  about: string;
  rating: number;
  profileImageUrl: string | null;
  clinicName: string | null;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  consultationType: doctors_consultationType;
  fee: number | null;
  licenseNumber: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedDoctorsDto = {
  items: DoctorPublicDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
};

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapDoctor(row: doctors): DoctorPublicDto {
    return {
      id: row.id,
      fullName: row.fullName,
      specialty: row.specialty,
      experienceYears: row.experienceYears,
      about: row.about,
      rating: row.rating,
      profileImageUrl: row.profileImageUrl,
      clinicName: row.clinicName,
      location: row.location,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      consultationType: row.consultationType,
      fee: row.fee,
      licenseNumber: row.licenseNumber,
      isVerified: row.isVerified,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private buildWhere(params: {
    search?: string;
    specialty?: string;
    consultationType?: string;
  }): Prisma.doctorsWhereInput {
    const clauses: Prisma.doctorsWhereInput[] = [];

    const q = params.search?.trim();
    if (q) {
      clauses.push({
        OR: [
          { fullName: { contains: q } },
          { specialty: { contains: q } },
          { location: { contains: q } },
          { clinicName: { contains: q } },
          { licenseNumber: { contains: q } },
        ],
      });
    }

    const spec = params.specialty?.trim();
    if (spec && spec !== 'all') {
      clauses.push({
        specialty: { contains: spec },
      });
    }

    const ct = params.consultationType?.trim();
    if (ct && ct !== 'all') {
      if (ct === 'BOTH') {
        clauses.push({ consultationType: 'BOTH' });
      } else if (ct === 'ONLINE') {
        clauses.push({
          OR: [{ consultationType: 'ONLINE' }, { consultationType: 'BOTH' }],
        });
      } else if (ct === 'IN_PERSON') {
        clauses.push({
          OR: [{ consultationType: 'IN_PERSON' }, { consultationType: 'BOTH' }],
        });
      }
    }

    if (clauses.length === 0) {
      return {};
    }
    return { AND: clauses };
  }

  async findPage(params: {
    page: number;
    limit: number;
    search?: string;
    specialty?: string;
    consultationType?: string;
  }): Promise<PaginatedDoctorsDto> {
    const page = Math.max(1, params.page);
    const limit = Math.min(50, Math.max(1, params.limit));
    const skip = (page - 1) * limit;

    const where = this.buildWhere({
      search: params.search,
      specialty: params.specialty,
      consultationType: params.consultationType,
    });

    const [rows, total] = await Promise.all([
      this.prisma.doctors.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { fullName: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.doctors.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasMore = page < totalPages;

    return {
      items: rows.map((r) => this.mapDoctor(r)),
      total,
      page,
      limit,
      totalPages,
      hasMore,
    };
  }

  async findOne(id: string): Promise<DoctorPublicDto> {
    const doctor = await this.prisma.doctors.findUnique({
      where: { id },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }
    return this.mapDoctor(doctor);
  }
}
