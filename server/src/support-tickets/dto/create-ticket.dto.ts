import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { support_ticket_category } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsEnum(support_ticket_category)
  category?: support_ticket_category;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  deviceInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  pagePath?: string;
}
