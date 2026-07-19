import { IsEnum, IsOptional } from 'class-validator';
import { user_role, user_status } from '@prisma/client';

export class UpdateUserAdminDto {
  @IsOptional()
  @IsEnum(user_status)
  status?: user_status;

  @IsOptional()
  @IsEnum(user_role)
  role?: user_role;
}
