import {
  Controller,
  Patch,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateReproductiveStatusDto, ReproductiveStatusResponseDto } from './dto/reproductive-status.dto';
import { PeriodTrackerResponseDto } from './dto/period-tracker.dto';
import { CreatePregnancyPlanningDto, UpdatePregnancyPlanningDto, PregnancyPlanningResponseDto } from './dto/pregnancy-planning.dto';
import { CreatePeriodLogDto, UpdatePeriodLogDto, PeriodLogResponseDto } from './dto/period-log.dto';

@Controller('api/v1/profile')
export class ProfileController {
  constructor(private userService: UserService) {}

  @Get(':id/reproductive-status')
  async getReproductiveStatus(
    @Param('id') id: string,
  ): Promise<ReproductiveStatusResponseDto> {
    return this.userService.getReproductiveStatus(+id);
  }

  @Patch(':id/reproductive-status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateReproductiveStatus(
    @Param('id') id: string,
    @Body() updateReproductiveStatusDto: UpdateReproductiveStatusDto,
  ) {
    return this.userService.updateReproductiveStatus(+id, updateReproductiveStatusDto);
  }

  @Get(':id/period-tracker')
  async getPeriodTrackerData(
    @Param('id') id: string,
  ): Promise<PeriodTrackerResponseDto> {
    return this.userService.getPeriodTrackerData(+id);
  }

  // Pregnancy Planning Endpoints
  @Post(':id/pregnancy-planning')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPregnancyPlanning(
    @Param('id') id: number,
    @Body() createPregnancyPlanningDto: CreatePregnancyPlanningDto,
  ): Promise<PregnancyPlanningResponseDto> {
    return this.userService.createPregnancyPlanning(id, createPregnancyPlanningDto);
  }

  @Get(':id/pregnancy-planning')
  async getPregnancyPlanning(
    @Param('id') id: string,
  ): Promise<PregnancyPlanningResponseDto> {
    return this.userService.getPregnancyPlanning(+id);
  }

  @Put(':id/update-pregnancy-planning')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePregnancyPlanning(
    @Param('id') id: string,
    @Body() updatePregnancyPlanningDto: UpdatePregnancyPlanningDto,
  ): Promise<PregnancyPlanningResponseDto> {
    return this.userService.updatePregnancyPlanning(+id, updatePregnancyPlanningDto);
  }

  @Delete(':id/pregnancy-planning')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePregnancyPlanning(
    @Param('id') id: string,
  ): Promise<void> {
    return this.userService.deletePregnancyPlanning(+id);
  }

  // Period Log Endpoints
  @Post(':id/period-logs')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPeriodLog(
    @Param('id') id: string,
    @Body() createPeriodLogDto: CreatePeriodLogDto,
  ): Promise<PeriodLogResponseDto> {
    return this.userService.createPeriodLog(+id, createPeriodLogDto);
  }

  @Get(':id/period-logs')
  async getPeriodLogs(
    @Param('id') id: string,
  ): Promise<PeriodLogResponseDto[]> {
    return this.userService.getPeriodLogs(+id);
  }

  @Get(':id/period-logs/:logId')
  async getPeriodLogById(
    @Param('id') id: string,
    @Param('logId') logId: string,
  ): Promise<PeriodLogResponseDto> {
    return this.userService.getPeriodLogById(+id, +logId);
  }

  @Put(':id/period-logs/:logId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePeriodLog(
    @Param('id') id: string,
    @Param('logId') logId: string,
    @Body() updatePeriodLogDto: UpdatePeriodLogDto,
  ): Promise<PeriodLogResponseDto> {
    return this.userService.updatePeriodLog(+id, +logId, updatePeriodLogDto);
  }

  @Delete(':id/period-logs/:logId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePeriodLog(
    @Param('id') id: string,
    @Param('logId') logId: string,
  ): Promise<void> {
    return this.userService.deletePeriodLog(+id, +logId);
  }
}
