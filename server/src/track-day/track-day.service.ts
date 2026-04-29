import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateTrackDayDto, UpdateTrackDayDto } from './dto/track-day.dto';
import { PrismaService } from '../prisma/services/prisma.service';
import { EngagementService } from '../health-engagement/engagement.service';

/** Inclusive YYYY-MM-DD range in server local time (matches createTrackDay day anchoring). */
function parseYmdRangeInclusive(startYmd: string, endYmd: string): { gte: Date; lte: Date } | null {
  const start = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startYmd.trim());
  const end = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endYmd.trim());
  if (!start || !end) {
    return null;
  }
  const sy = Number(start[1]);
  const sm = Number(start[2]) - 1;
  const sd = Number(start[3]);
  const ey = Number(end[1]);
  const em = Number(end[2]) - 1;
  const ed = Number(end[3]);
  const gte = new Date(sy, sm, sd, 0, 0, 0, 0);
  const lte = new Date(ey, em, ed, 23, 59, 59, 999);
  if (Number.isNaN(gte.getTime()) || Number.isNaN(lte.getTime())) {
    return null;
  }
  return { gte, lte };
}

@Injectable()
export class TrackDayService {
  constructor(
    private prisma: PrismaService,
    private readonly engagement: EngagementService,
  ) {}

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

    const row = await this.prisma.trackday.create({
      data: {
        userId,
        date: dayStart,
        mood: mood ? JSON.stringify(mood) : null,
        energy: energy ? JSON.stringify(energy) : null,
        symptoms: symptoms ? JSON.stringify(symptoms) : null,
        notes,
      },
    });
    void this.engagement.refreshEngagementMetrics(userId).catch(() => undefined);
    return row;
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
      const range = parseYmdRangeInclusive(startDate, endDate);
      if (range) {
        whereClause.date = {
          gte: range.gte,
          lte: range.lte,
        };
      }
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
