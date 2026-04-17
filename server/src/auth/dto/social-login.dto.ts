import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SocialLoginDto {
  @IsIn(['google', 'apple'])
  provider: 'google' | 'apple';

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  inviteCode?: string;
}
