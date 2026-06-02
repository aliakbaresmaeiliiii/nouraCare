import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** One-time sign-in code sent to the user's email. */
  @IsOptional()
  @IsString()
  @Length(4, 8)
  otp?: string;
}
