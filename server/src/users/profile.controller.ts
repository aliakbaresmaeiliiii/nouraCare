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

  @Put(':id/pregnancy-planning')
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
}
