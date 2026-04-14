import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class SocialLoginDto {
  @IsIn(['google', 'apple'])
  provider: 'google' | 'apple';

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}
