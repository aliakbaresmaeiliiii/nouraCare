import { IsString, IsOptional, IsEmail, IsObject, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  /** Client onboarding payload (snake_case), persisted to `onboarding_data` after signup */
  @IsOptional()
  @IsObject()
  onboardingData?: Record<string, unknown>;

  /** Friend's referral code from invite link (optional). */
  @IsOptional()
  @IsString()
  @MaxLength(24)
  inviteCode?: string;
}
