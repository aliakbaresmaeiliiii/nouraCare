import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @IsString()
  @IsNotEmpty()
  slotKey!: string;

  @IsIn(['online', 'in-person'])
  consultationType!: 'online' | 'in-person';
}
