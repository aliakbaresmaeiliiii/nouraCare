import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { userIdFromRequest } from '../auth/utils/assert-user-ownership.util';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Public()
  @Get('doctors/:doctorId/schedule')
  getDoctorSchedule(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.getDoctorSchedule(doctorId);
  }

  @Post('appointments')
  createAppointment(
    @Req() req: Request,
    @Body() dto: CreateAppointmentDto,
  ) {
    const userId = userIdFromRequest(req);
    return this.appointmentsService.createAppointment(userId, dto);
  }

  @Patch('appointments/:id/cancel')
  cancelAppointment(@Req() req: Request, @Param('id') id: string) {
    const userId = userIdFromRequest(req);
    return this.appointmentsService.cancelAppointment(userId, id);
  }

  @Patch('appointments/:id/confirm')
  confirmAppointment(@Req() req: Request, @Param('id') id: string) {
    const userId = userIdFromRequest(req);
    return this.appointmentsService.confirmAppointment(userId, id);
  }
}
