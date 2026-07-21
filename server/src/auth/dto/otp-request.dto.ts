import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === null) {
    return undefined;
  }
  return value;
}

/** Request an OTP for email or phone (unified sign-in / sign-up). */
export class OtpRequestDto {
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return typeof value === 'string' ? value.trim().toLowerCase() : value;
  })
  @ValidateIf((o: OtpRequestDto) => !o.phoneNumber)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf((o: OtpRequestDto) => !o.email)
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;
}
