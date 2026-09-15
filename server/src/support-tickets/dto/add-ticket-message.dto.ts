import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AddTicketMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
