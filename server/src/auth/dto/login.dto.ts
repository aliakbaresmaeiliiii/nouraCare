import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === null) {
    return undefined;
  }
  return value;
}

export class LoginDto {
  /**
   * Email sign-in. Required when phoneNumber is not provided.
   */
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return typeof value === 'string' ? value.trim().toLowerCase() : value;
  })
  @ValidateIf((o: LoginDto) => !o.phoneNumber)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  /** One-time sign-in code sent by email or SMS. */
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

  /**
   * Phone sign-in (Iranian mobile). Required when email is not provided.
   */
  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf((o: LoginDto) => !o.email)
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;

  /** Client onboarding payload — used when sign-in auto-registers a new account. */
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
