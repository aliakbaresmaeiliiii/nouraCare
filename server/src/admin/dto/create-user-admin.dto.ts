import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { user_role, user_status } from '@prisma/client';

export class CreateUserAdminDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  @MaxLength(190)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  phoneNumber!: string;

  @IsOptional()
  @IsEnum(user_role)
  role?: user_role;

  @IsOptional()
  @IsEnum(user_status)
  status?: user_status;
}
