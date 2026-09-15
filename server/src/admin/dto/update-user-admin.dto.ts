import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { user_role, user_status } from '@prisma/client';

export class UpdateUserAdminDto {
  @IsOptional()
  @IsEnum(user_status)
  status?: user_status;

  @IsOptional()
  @IsEnum(user_role)
  role?: user_role;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
