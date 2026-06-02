import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TrackDayService } from './track-day.service';
import { CreateTrackDayDto, UpdateTrackDayDto } from './dto/track-day.dto';

@Controller('track-day')
export class TrackDayController {
  constructor(private trackDayService: TrackDayService) {}

  @Post(':userId')
  async createTrackDay(
    @Param('userId') userId: string,
    @Body() createTrackDayDto: CreateTrackDayDto,
  ) {
    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.trackDayService.createTrackDay(userIdNumber, createTrackDayDto);
  }

  /**
   * Must be registered before `GET :userId/:date` so `track-days` is not parsed as a calendar date.
   */
  @Get(':userId/track-days')
  async getTrackDaysByUser(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.trackDayService.getTrackDaysByUser(
      userIdNumber,
      startDate,
      endDate,
    );
  }

  @Get(':userId/:date')
  async getTrackDay(
    @Param('userId') userId: string,
    @Param('date') date: string,
  ) {
    console.log('GET /track-day', { userIdRaw: userId, dateRaw: date });

    const userIdNumber = parseInt(userId, 10);
    console.log('userIdNumber', userIdNumber);
    if (isNaN(userIdNumber)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.trackDayService.getTrackDay(userIdNumber, date);
  }

  @Put(':userId/:trackDayId')
  async updateTrackDay(
    @Param('userId') userId: string,
    @Param('trackDayId') trackDayId: string,
    @Body() updateTrackDayDto: UpdateTrackDayDto,
  ) {
    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.trackDayService.updateTrackDay(
      userIdNumber,
      trackDayId,
      updateTrackDayDto,
    );
  }
}
