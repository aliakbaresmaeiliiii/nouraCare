import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TrackDayService } from './track-day.service';
import { CreateTrackDayDto, UpdateTrackDayDto } from './dto/track-day.dto';
import { assertUserOwnership } from '../auth/utils/assert-user-ownership.util';

@Controller('track-day')
export class TrackDayController {
  constructor(private trackDayService: TrackDayService) {}

  @Post(':userId')
  async createTrackDay(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body() createTrackDayDto: CreateTrackDayDto,
  ) {
    const userIdNumber = assertUserOwnership(req, userId);
    return this.trackDayService.createTrackDay(userIdNumber, createTrackDayDto);
  }

  @Get(':userId/track-days')
  async getTrackDaysByUser(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userIdNumber = assertUserOwnership(req, userId);
    return this.trackDayService.getTrackDaysByUser(
      userIdNumber,
      startDate,
      endDate,
    );
  }

  @Get(':userId/:date')
  async getTrackDay(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Param('date') date: string,
  ) {
    const userIdNumber = assertUserOwnership(req, userId);
    return this.trackDayService.getTrackDay(userIdNumber, date);
  }

  @Put(':userId/:trackDayId')
  async updateTrackDay(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Param('trackDayId') trackDayId: string,
    @Body() updateTrackDayDto: UpdateTrackDayDto,
  ) {
    const userIdNumber = assertUserOwnership(req, userId);
    return this.trackDayService.updateTrackDay(
      userIdNumber,
      trackDayId,
      updateTrackDayDto,
    );
  }
}
