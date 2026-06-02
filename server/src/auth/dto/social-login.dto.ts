import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SocialLoginDto {
  @IsIn(['google', 'apple'])
  provider: 'google' | 'apple';

  /** Verified server-side when provided; required for Apple. */
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  inviteCode?: string;
}
