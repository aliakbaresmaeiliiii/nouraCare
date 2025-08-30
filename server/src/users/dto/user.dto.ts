import { IsEmail, IsOptional, IsString, IsBoolean, IsDate, IsEnum, IsInt, Min, Max, IsUrl } from 'class-validator'
import { Type } from 'class-transformer'

enum Status {
  PLANNING_PREGNANCY = 'PLANNING_PREGNANCY',
  PREGNANT = 'PREGNANT',
  HAS_CHILD = 'HAS_CHILD',
}

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  phone: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  verificationCode?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  verificationCodeExpiresAt?: Date

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean

  @IsOptional()
  // @IsUrl()
  profileImage?: string

  @IsOptional()
  @IsEnum(Status)
  status?: Status

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  menstrualCycleLength?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  periodDuration?: number

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastPeriodStartDate?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthday?: Date

  @IsOptional()
  @IsString()
  city?: string   // 🏙️ added city
}

export class UpdateUserDto extends CreateUserDto {}
