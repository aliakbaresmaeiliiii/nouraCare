import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateTrackDayDto, UpdateTrackDayDto } from './dto/track-day.dto';
import { PrismaService } from '../prisma/services/prisma.service';

@Injectable()
export class TrackDayService {
  constructor(private prisma: PrismaService) {}

  async createTrackDay(userId: number, createTrackDayDto: CreateTrackDayDto) {
    const { date, mood, energy, symptoms, notes } = createTrackDayDto;

    // Check if track day already exists for this user and date
    const existingTrackDay = await this.prisma.trackDay.findFirst({
      where: {
        userId,
        date: new Date(date),
      },
    });

    if (existingTrackDay) {
      throw new ConflictException('Track day already exists for this date');
    }

    return this.prisma.trackDay.create({
      data: {
        userId,
        date: new Date(date),
        mood: mood ? JSON.stringify(mood) : null,
        energy: energy ? JSON.stringify(energy) : null,
        symptoms: symptoms ? JSON.stringify(symptoms) : null,
        notes,
      },
    });
  }

  async updateTrackDay(userId: number, date: string, updateTrackDayDto: UpdateTrackDayDto) {
    const { mood, energy, symptoms, notes } = updateTrackDayDto;

    const trackDay = await this.prisma.trackDay.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
    });

    if (!trackDay) {
      throw new NotFoundException('Track day not found');
    }

    return this.prisma.trackDay.update({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
      data: {
        mood: mood ? JSON.stringify(mood) : trackDay.mood,
        energy: energy ? JSON.stringify(energy) : trackDay.energy,
        symptoms: symptoms ? JSON.stringify(symptoms) : trackDay.symptoms,
        notes: notes !== undefined ? notes : trackDay.notes,
      },
    });
  }

  async getTrackDay(userId: number, date: string) {
    const trackDay = await this.prisma.trackDay.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
    });

    if (!trackDay) {
      throw new NotFoundException('Track day not found');
    }

    return {
      ...trackDay,
      mood: trackDay.mood ? JSON.parse(trackDay.mood) : null,
      energy: trackDay.energy ? JSON.parse(trackDay.energy) : null,
      symptoms: trackDay.symptoms ? JSON.parse(trackDay.symptoms) : null,
    };
  }

  async getTrackDaysByUser(userId: number, startDate?: string, endDate?: string) {
    const whereClause: any = { userId };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const trackDays = await this.prisma.trackDay.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    return trackDays.map(trackDay => ({
      ...trackDay,
      mood: trackDay.mood ? JSON.parse(trackDay.mood) : null,
      energy: trackDay.energy ? JSON.parse(trackDay.energy) : null,
      symptoms: trackDay.symptoms ? JSON.parse(trackDay.symptoms) : null,
    }));
  }

  async deleteTrackDay(userId: number, date: string) {
    const trackDay = await this.prisma.trackDay.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
    });

    if (!trackDay) {
      throw new NotFoundException('Track day not found');
    }

    return this.prisma.trackDay.delete({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
    });
  }
}
