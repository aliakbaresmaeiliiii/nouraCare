import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  support_ticket_category,
  support_ticket_message_author_role,
  support_ticket_status,
} from '@prisma/client';
import { PrismaService } from '../prisma/services/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { ListMyTicketsQueryDto } from './dto/list-my-tickets.query.dto';

const MESSAGE_SELECT = {
  id: true,
  authorId: true,
  authorRole: true,
  body: true,
  createdAt: true,
} as const;

const TICKET_LIST_SELECT = {
  id: true,
  subject: true,
  category: true,
  status: true,
  priority: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { messages: true } },
} as const;

@Injectable()
export class SupportTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(userId: number, dto: CreateTicketDto) {
    const now = new Date();
    const ticketId = randomUUID();
    const subject = dto.subject.trim();
    const body = dto.message.trim();
    const category = dto.category ?? support_ticket_category.QUESTION;

    await this.prisma.$transaction([
      this.prisma.support_ticket.create({
        data: {
          id: ticketId,
          userId,
          subject,
          category,
          status: support_ticket_status.OPEN,
          appVersion: dto.appVersion?.trim() || null,
          deviceInfo: dto.deviceInfo?.trim() || null,
          pagePath: dto.pagePath?.trim() || null,
          lastMessageAt: now,
          updatedAt: now,
        },
      }),
      this.prisma.support_ticket_message.create({
        data: {
          id: randomUUID(),
          ticketId,
          authorId: userId,
          authorRole: support_ticket_message_author_role.USER,
          body,
        },
      }),
    ]);

    return this.getForUser(userId, ticketId);
  }

  async listForUser(userId: number, query: ListMyTicketsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.support_ticketWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.support_ticket.count({ where }),
      this.prisma.support_ticket.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...TICKET_LIST_SELECT,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { body: true, authorRole: true, createdAt: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((t) => {
        const last = t.messages[0] ?? null;
        return {
          id: t.id,
          subject: t.subject,
          category: t.category,
          status: t.status,
          priority: t.priority,
          lastMessageAt: t.lastMessageAt,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          messageCount: t._count.messages,
          preview: last
            ? {
                body: this.clip(last.body),
                authorRole: last.authorRole,
                createdAt: last.createdAt,
              }
            : null,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getForUser(userId: number, ticketId: string) {
    const ticket = await this.prisma.support_ticket.findUnique({
      where: { id: ticketId },
      select: {
        ...TICKET_LIST_SELECT,
        userId: true,
        appVersion: true,
        deviceInfo: true,
        pagePath: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: MESSAGE_SELECT,
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.userId !== userId) {
      throw new ForbiddenException('You cannot access this ticket');
    }

    return {
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      lastMessageAt: ticket.lastMessageAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      appVersion: ticket.appVersion,
      deviceInfo: ticket.deviceInfo,
      pagePath: ticket.pagePath,
      messageCount: ticket._count.messages,
      messages: ticket.messages,
      canReply: ticket.status !== support_ticket_status.CLOSED,
    };
  }

  async addMessageForUser(
    userId: number,
    ticketId: string,
    dto: AddTicketMessageDto,
  ) {
    const ticket = await this.prisma.support_ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.userId !== userId) {
      throw new ForbiddenException('You cannot access this ticket');
    }
    if (ticket.status === support_ticket_status.CLOSED) {
      throw new BadRequestException('This ticket is closed');
    }

    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Message cannot be empty');
    }

    const now = new Date();
    const reopenStatuses: support_ticket_status[] = [
      support_ticket_status.WAITING_ON_USER,
      support_ticket_status.RESOLVED,
    ];
    const nextStatus = reopenStatuses.includes(ticket.status)
      ? support_ticket_status.OPEN
      : ticket.status;

    await this.prisma.$transaction([
      this.prisma.support_ticket_message.create({
        data: {
          id: randomUUID(),
          ticketId,
          authorId: userId,
          authorRole: support_ticket_message_author_role.USER,
          body,
        },
      }),
      this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          lastMessageAt: now,
          status: nextStatus,
          updatedAt: now,
        },
      }),
    ]);

    return this.getForUser(userId, ticketId);
  }

  private clip(body: string): string {
    return body.length > 160 ? `${body.slice(0, 157)}…` : body;
  }
}
