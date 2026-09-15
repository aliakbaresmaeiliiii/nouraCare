import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  support_ticket_priority,
  support_ticket_status,
} from '@prisma/client';

export class UpdateTicketAdminDto {
  @IsOptional()
  @IsEnum(support_ticket_status)
  status?: support_ticket_status;

  @IsOptional()
  @IsEnum(support_ticket_priority)
  priority?: support_ticket_priority;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedAdminId?: number;
}
