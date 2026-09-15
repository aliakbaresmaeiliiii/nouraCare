import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponseHelper } from '../core/helpers/api-response.helper';
import { SupportTicketsService } from './support-tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { ListMyTicketsQueryDto } from './dto/list-my-tickets.query.dto';

@Controller('me/tickets')
@UseGuards(JwtAuthGuard)
export class SupportTicketsController {
  constructor(private readonly tickets: SupportTicketsService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateTicketDto) {
    const user = req.user as { id: number };
    const data = await this.tickets.createForUser(user.id, dto);
    return ApiResponseHelper.created(data, 'Support ticket created');
  }

  @Get()
  async list(@Req() req: Request, @Query() query: ListMyTicketsQueryDto) {
    const user = req.user as { id: number };
    const data = await this.tickets.listForUser(user.id, query);
    return ApiResponseHelper.success(data, 'Support tickets listed');
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: number };
    const data = await this.tickets.getForUser(user.id, id);
    return ApiResponseHelper.success(data, 'Support ticket details');
  }

  @Post(':id/messages')
  async addMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
  ) {
    const user = req.user as { id: number };
    const data = await this.tickets.addMessageForUser(user.id, id, dto);
    return ApiResponseHelper.created(data, 'Message added');
  }
}
