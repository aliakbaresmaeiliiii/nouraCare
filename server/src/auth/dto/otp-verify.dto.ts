import { IsEmail, IsNotEmpty, IsString, Length, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === null) {
    return undefined;
  }
  return value;
}

/** Verify OTP for email or phone and issue tokens. */
export class OtpVerifyDto {
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return typeof value === 'string' ? value.trim().toLowerCase() : value;
  })
  @ValidateIf((o: OtpVerifyDto) => !o.phoneNumber)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf((o: OtpVerifyDto) => !o.email)
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  otp: string;
}
