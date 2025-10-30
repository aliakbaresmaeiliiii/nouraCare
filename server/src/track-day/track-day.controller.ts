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
    @Param('userId') userId: number,
    @Body() createTrackDayDto: CreateTrackDayDto,
  ) {
    const userIdNumber = userId;
    if (userIdNumber) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.trackDayService.createTrackDay(userIdNumber, createTrackDayDto);
  }

  @Get(':userId/:date')
  async getTrackDay(
    @Param('userId') userId: number,
    @Param('date') date: string,
  ) {
    const userIdNumber =userId;
    if (userIdNumber) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.trackDayService.getTrackDay(userIdNumber, date);
  }

  @Put(':userId/:trackDayId')
  async updateTrackDay(
    @Param('userId') userId: number,
    @Param('trackDayId') trackDayId: string,
    @Body() updateTrackDayDto: UpdateTrackDayDto,
  ) {
    const userIdNumber = userId;
    if (userIdNumber) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.trackDayService.updateTrackDay(
      userIdNumber,
      trackDayId,
      updateTrackDayDto,
    );
  }

  // @Delete(':userId/range')
  // async deleteTrackDay(
  //   @Param('userId') userId: number,
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  // ) {
  //   const userIdNumber = parseInt(userId);
  //   if (isNaN(userIdNumber)) {
  //     throw new BadRequestException('Invalid user ID');
  //   }

  //   return this.trackDayService.deleteTrackDay(userIdNumber, startDate, endDate);
  // }

  @Get(':userId/track-days')
  async getTrackDaysByUser(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const userIdNumber = parseInt(userId);
    if (isNaN(userIdNumber)) {
      throw new BadRequestException('Invalid user ID');
    }

    // return this.trackDayService.getSymptomsRange(userIdNumber, startDate, endDate);
  }
}
