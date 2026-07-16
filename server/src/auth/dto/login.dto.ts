import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === null) {
    return undefined;
  }
  return value;
}

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** One-time sign-in code sent to the user's email. */
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return String(value).trim();
  })
  @IsOptional()
  @IsString()
  @Length(4, 8)
  otp?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  /** Client onboarding payload — used when sign-in auto-registers a new email. */
  @IsOptional()
  @IsObject()
  onboardingData?: Record<string, unknown>;

  /** Friend's referral code from invite link (optional). */
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(24)
  inviteCode?: string;
}
