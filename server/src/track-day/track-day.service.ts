import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateTrackDayDto, UpdateTrackDayDto } from './dto/track-day.dto';
import { PrismaService } from '../prisma/services/prisma.service';

@Injectable()
export class TrackDayService {
  constructor(private prisma: PrismaService) {}

  async createTrackDay(userId: number, createTrackDayDto: CreateTrackDayDto) {
    const { date, mood, energy, symptoms, notes } = createTrackDayDto;

    // Normalize to start of day to avoid time-component mismatches
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    // Check if track day already exists for this user and date
    const existingTrackDay = await this.prisma.trackday.findFirst({
      where: {
        userId,
        date: dayStart,
      },
    });

    if (existingTrackDay) {
      throw new ConflictException('Track day already exists for this date');
    }

    return this.prisma.trackday.create({
      data: {
        userId,
        date: dayStart,
        mood: mood ? JSON.stringify(mood) : null,
        energy: energy ? JSON.stringify(energy) : null,
        symptoms: symptoms ? JSON.stringify(symptoms) : null,
        notes,
      },
    });
  }

  async updateTrackDay(
    userId: number,
    date: string,
    updateTrackDayDto: UpdateTrackDayDto,
  ) {
    const { mood, energy, symptoms, notes } = updateTrackDayDto;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const trackDay = await this.prisma.trackday.findFirst({
      where: {
        userId,
        date: dayStart,
      },
    });

    if (!trackDay) {
      throw new NotFoundException('Track day not found');
    }

    return this.prisma.trackday.update({
      where: {
        id: trackDay.id,
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
    
    console.log('getTrackDay', { userId, date });
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const trackDay = await this.prisma.trackday.findFirst({
      where: {
        userId,
        date: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    if (!trackDay) {
      throw new NotFoundException('Track day not found');
    }

    console.log('trackDay', trackDay);
    return {
      ...trackDay,
      mood: trackDay.mood ? JSON.parse(trackDay.mood) : null,
      energy: trackDay.energy ? JSON.parse(trackDay.energy) : null,
      symptoms: trackDay.symptoms ? JSON.parse(trackDay.symptoms) : null,
    };
  }

  async getTrackDaysByUser(
    userId: number,
    startDate?: string,
    endDate?: string,
  ) {
    const whereClause: any = { userId };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const trackDays = await this.prisma.trackday.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    return trackDays.map((trackDay) => ({
      ...trackDay,
      mood: trackDay.mood ? JSON.parse(trackDay.mood) : null,
      energy: trackDay.energy ? JSON.parse(trackDay.energy) : null,
      symptoms: trackDay.symptoms ? JSON.parse(trackDay.symptoms) : null,
    }));
  }

  async deleteTrackDay(userId: number, date: string) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const trackDay = await this.prisma.trackday.findFirst({
      where: {
        userId,
        date: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    if (!trackDay) {
      throw new NotFoundException('Track day not found');
    }

    return this.prisma.trackday.delete({
      where: { id: trackDay.id },
    });
  }
}
