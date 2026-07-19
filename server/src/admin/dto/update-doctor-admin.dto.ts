import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDoctorAdminDto {
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
