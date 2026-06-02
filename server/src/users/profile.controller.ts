import {
  Controller,
  Patch,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from './user.service';
import { UpdateReproductiveStatusDto, ReproductiveStatusResponseDto } from './dto/reproductive-status.dto';
import { PeriodTrackerResponseDto } from './dto/period-tracker.dto';
import { CreatePregnancyPlanningDto, UpdatePregnancyPlanningDto, PregnancyPlanningResponseDto } from './dto/pregnancy-planning.dto';
import { CreatePeriodLogDto, UpdatePeriodLogDto, PeriodLogResponseDto } from './dto/period-log.dto';
import { assertUserOwnership } from '../auth/utils/assert-user-ownership.util';

@Controller('profile')
export class ProfileController {
  constructor(private userService: UserService) {}

  @Get(':id/reproductive-status')
  async getReproductiveStatus(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ReproductiveStatusResponseDto> {
    assertUserOwnership(req, id);
    return this.userService.getReproductiveStatus(+id);
  }

  @Patch(':id/reproductive-status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateReproductiveStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateReproductiveStatusDto: UpdateReproductiveStatusDto,
  ) {
    assertUserOwnership(req, id);
    return this.userService.updateReproductiveStatus(+id, updateReproductiveStatusDto);
  }

  @Get(':id/period-tracker')
  async getPeriodTrackerData(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<PeriodTrackerResponseDto> {
    assertUserOwnership(req, id);
    return this.userService.getPeriodTrackerData(+id);
  }

  @Post(':id/pregnancy-planning')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPregnancyPlanning(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() createPregnancyPlanningDto: CreatePregnancyPlanningDto,
  ): Promise<PregnancyPlanningResponseDto> {
    assertUserOwnership(req, id);
    return this.userService.createPregnancyPlanning(+id, createPregnancyPlanningDto);
  }

  @Get(':id/pregnancy-planning')
  async getPregnancyPlanning(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<PregnancyPlanningResponseDto> {
    assertUserOwnership(req, id);
    return this.userService.getPregnancyPlanning(+id);
  }

  @Put(':id/update-pregnancy-planning')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePregnancyPlanning(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updatePregnancyPlanningDto: UpdatePregnancyPlanningDto,
  ): Promise<PregnancyPlanningResponseDto> {
    assertUserOwnership(req, id);
    return this.userService.updatePregnancyPlanning(+id, updatePregnancyPlanningDto);
  }

  @Delete(':id/pregnancy-planning')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePregnancyPlanning(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    assertUserOwnership(req, id);
    return this.userService.deletePregnancyPlanning(+id);
  }

  @Post(':id/period-logs')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPeriodLog(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() createPeriodLogDto: CreatePeriodLogDto,
  ): Promise<PeriodLogResponseDto> {
    assertUserOwnership(req, id);
    return this.userService.createPeriodLog(+id, createPeriodLogDto);
  }

  @Get(':id/period-logs')
  async getPeriodLogs(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<PeriodLogResponseDto[]> {
    assertUserOwnership(req, id);
    return this.userService.getPeriodLogs(+id);
  }

  @Get(':id/period-logs/:logId')
  async getPeriodLogById(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('logId') logId: string,
  ): Promise<PeriodLogResponseDto> {
    assertUserOwnership(req, id);
    return this.userService.getPeriodLogById(+id, +logId);
  }

  @Put(':id/period-logs/:logId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePeriodLog(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('logId') logId: string,
    @Body() updatePeriodLogDto: UpdatePeriodLogDto,
  ): Promise<PeriodLogResponseDto> {
    assertUserOwnership(req, id);
    return this.userService.updatePeriodLog(+id, +logId, updatePeriodLogDto);
  }

  @Delete(':id/period-logs/:logId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePeriodLog(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('logId') logId: string,
  ): Promise<void> {
    assertUserOwnership(req, id);
    return this.userService.deletePeriodLog(+id, +logId);
  }
}
