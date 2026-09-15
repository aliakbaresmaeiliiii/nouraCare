import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { user_role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseHelper } from '../core/helpers/api-response.helper';
import { AdminService } from './admin.service';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ListDoctorsQueryDto } from './dto/list-doctors.query.dto';
import { CreateDoctorAdminDto } from './dto/create-doctor-admin.dto';
import { UpdateDoctorAdminDto } from './dto/update-doctor-admin.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query.dto';
import { UpdateAppointmentAdminDto } from './dto/update-appointment-admin.dto';
import { ListThreadsQueryDto } from './dto/list-threads.query.dto';
import { UpdateThreadAdminDto } from './dto/update-thread-admin.dto';
import { ListTicketsQueryDto } from './dto/list-tickets.query.dto';
import { UpdateTicketAdminDto } from './dto/update-ticket-admin.dto';
import { AddTicketMessageAdminDto } from './dto/add-ticket-message-admin.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(user_role.SUPER_ADMIN, user_role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/overview')
  async overview() {
    const data = await this.adminService.getOverview();
    return ApiResponseHelper.success(data, 'Admin dashboard overview');
  }

  @Get('users')
  async listUsers(@Query() query: ListUsersQueryDto) {
    const data = await this.adminService.listUsers(query);
    return ApiResponseHelper.success(data, 'Users listed');
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserAdminDto) {
    const data = await this.adminService.createUser(dto);
    return ApiResponseHelper.created(data, 'User created');
  }

  @Get('users/:id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.getUser(id);
    return ApiResponseHelper.success(data, 'User details');
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAdminDto,
    @CurrentUser() actor: { id: number },
  ) {
    const data = await this.adminService.updateUser(id, dto, actor.id);
    return ApiResponseHelper.updated(data, 'User updated');
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: { id: number },
  ) {
    await this.adminService.deleteUser(id, actor.id);
    return ApiResponseHelper.deleted('User deleted');
  }

  @Get('doctors')
  async listDoctors(@Query() query: ListDoctorsQueryDto) {
    const data = await this.adminService.listDoctors(query);
    return ApiResponseHelper.success(data, 'Doctors listed');
  }

  @Post('doctors')
  async createDoctor(@Body() dto: CreateDoctorAdminDto) {
    const data = await this.adminService.createDoctor(dto);
    return ApiResponseHelper.created(data, 'Doctor created');
  }

  @Get('doctors/:id')
  async getDoctor(@Param('id') id: string) {
    const data = await this.adminService.getDoctor(id);
    return ApiResponseHelper.success(data, 'Doctor details');
  }

  @Patch('doctors/:id')
  async updateDoctor(
    @Param('id') id: string,
    @Body() dto: UpdateDoctorAdminDto,
  ) {
    const data = await this.adminService.updateDoctor(id, dto);
    return ApiResponseHelper.updated(data, 'Doctor updated');
  }

  @Delete('doctors/:id')
  async deleteDoctor(@Param('id') id: string) {
    await this.adminService.deleteDoctor(id);
    return ApiResponseHelper.deleted('Doctor deleted');
  }

  @Get('appointments')
  async listAppointments(@Query() query: ListAppointmentsQueryDto) {
    const data = await this.adminService.listAppointments(query);
    return ApiResponseHelper.success(data, 'Appointments listed');
  }

  @Patch('appointments/:id')
  async updateAppointment(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentAdminDto,
  ) {
    const data = await this.adminService.updateAppointment(id, dto);
    return ApiResponseHelper.updated(data, 'Appointment updated');
  }

  @Get('forums/threads')
  async listThreads(@Query() query: ListThreadsQueryDto) {
    const data = await this.adminService.listThreads(query);
    return ApiResponseHelper.success(data, 'Threads listed');
  }

  @Patch('forums/threads/:id')
  async updateThread(
    @Param('id') id: string,
    @Body() dto: UpdateThreadAdminDto,
  ) {
    const data = await this.adminService.updateThread(id, dto);
    return ApiResponseHelper.updated(data, 'Thread updated');
  }

  @Delete('forums/threads/:id')
  async deleteThread(@Param('id') id: string) {
    const data = await this.adminService.deleteThread(id);
    return ApiResponseHelper.deleted('Thread deleted');
  }

  @Get('subscriptions/summary')
  async subscriptionSummary() {
    const data = await this.adminService.getSubscriptionSummary();
    return ApiResponseHelper.success(data, 'Subscription summary');
  }

  @Get('health')
  async health() {
    const data = await this.adminService.getHealth();
    return ApiResponseHelper.success(data, 'Admin health');
  }

  @Get('tickets')
  async listTickets(@Query() query: ListTicketsQueryDto) {
    const data = await this.adminService.listTickets(query);
    return ApiResponseHelper.success(data, 'Support tickets listed');
  }

  @Get('tickets/:id')
  async getTicket(@Param('id') id: string) {
    const data = await this.adminService.getTicket(id);
    return ApiResponseHelper.success(data, 'Support ticket details');
  }

  @Patch('tickets/:id')
  async updateTicket(
    @Param('id') id: string,
    @Body() dto: UpdateTicketAdminDto,
    @CurrentUser() actor: { id: number },
  ) {
    const data = await this.adminService.updateTicket(id, dto, actor.id);
    return ApiResponseHelper.updated(data, 'Support ticket updated');
  }

  @Post('tickets/:id/messages')
  async addTicketMessage(
    @Param('id') id: string,
    @Body() dto: AddTicketMessageAdminDto,
    @CurrentUser() actor: { id: number },
  ) {
    const data = await this.adminService.addTicketMessage(id, dto, actor.id);
    return ApiResponseHelper.created(data, 'Reply sent');
  }
}
