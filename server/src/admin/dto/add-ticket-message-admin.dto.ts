import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AddTicketMessageAdminDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}