import {
  IsEmail,
  IsString,
  IsStrongPassword,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import {
  ForgotPasswordReq,
  RegisterReq,
  ResendForgotPasswordTokenReq,
  ResendVerifyEmailTokenReq,
  ResetPasswordReq,
  VerifyPasswordTokenReq,
} from '@fintrack/types/protos/auth/auth';

export class RegisterUserDto implements RegisterReq {
  /** email of new user */
  @ApiProperty({
    type: 'string',
    description: 'Email of new user',
    example: 'dasiloy@dasy.com',
  })
  @IsEmail()
  @Transform(({ value }) => (value as string).toLocaleLowerCase())
  email: string;

  /** first name of new user */
  @ApiProperty({
    type: 'string',
    description: 'First Name of new user',
    example: 'dasiloy',
  })
  @IsString({
    message: 'First Name must be a string',
  })
  @MinLength(2, {
    message: 'First Name must be at least 2 characters',
  })
  @Transform(({ value }) => (value as string).toLocaleLowerCase())
  firstName: string;

  /** last name of new user */
  @ApiProperty({
    type: 'string',
    description: 'Last Name of new user',
    example: 'dasy',
  })
  @IsString({
    message: 'Last Name must be a string',
  })
  @MinLength(2, {
    message: 'Last Name must be at least 2 characters',
  })
  @Transform(({ value }) => (value as string).toLocaleLowerCase())
  lastName: string;

  /** last name of new user */
  @ApiProperty({
    type: 'string',
    description: 'Password of the new user',
    example: '&45367tDewgbck',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;
}

export class VerifyEmailDto {
  /** otp token  */
  @ApiProperty({
    type: 'string',
    description: 'Otp token for email verification',
    example: '064321',
  })
  @IsString({
    message: 'Otp token is required',
  })
  @MinLength(6, {
    message: 'Otp token Invalid',
  })
  @MaxLength(6, {
    message: 'Otp token Invalid',
  })
  otp: string;
}

export class ResendVerifyEmailDto implements ResendVerifyEmailTokenReq {
  @ApiProperty({
    type: 'string',
    description: 'Email of user',
    example: 'dasiloy@dasy.com',
  })
  @IsEmail()
  @Transform(({ value }) => (value as string).toLocaleLowerCase())
  email: string;
}

export class LoginDto {
  @ApiProperty({
    type: 'string',
    description: 'Email of user',
    example: 'dasiloy@dasy.com',
  })
  @IsEmail()
  @Transform(({ value }) => (value as string).toLocaleLowerCase())
  email: string;

  @ApiProperty({
    type: 'string',
    description: 'Password of user',
    example: '&45367tDewgbck',
  })
  @IsString()
  @MinLength(8)
  password: string;
}

export class ForgotPasswordDto implements ForgotPasswordReq {
  @ApiProperty({
    type: 'string',
    description: 'Email of user',
    example: 'dasiloy@dasy.com',
  })
  @IsEmail()
  @Transform(({ value }) => (value as string).toLocaleLowerCase())
  email: string;
}

export class ResendForgotPasswordDto implements ResendForgotPasswordTokenReq {
  @ApiProperty({
    type: 'string',
    description: 'Email of user',
    example: 'dasiloy@dasy.com',
  })
  @IsEmail()
  @Transform(({ value }) => (value as string).toLocaleLowerCase())
  email: string;
}

export class VerifyPasswordTokenReqDto implements VerifyPasswordTokenReq {
  @ApiProperty({
    type: 'string',
    description: 'OTP token sent to email',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({
    type: 'string',
    description: 'Email of user',
    example: 'dasiloy@dasy.com',
  })
  @IsEmail()
  @Transform(({ value }) => (value as string).toLocaleLowerCase())
  email: string;
}
export class ResetPasswordDto implements ResetPasswordReq {
  @ApiProperty({
    type: 'string',
    description: 'New password',
    example: '&45367tDewgbckNew',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    type: 'string',
    description: 'Refresh token',
  })
  @IsString()
  refreshToken: string;
}

export class GoogleOAuthDto {
  @ApiProperty({
    type: 'string',
    description:
      'Google id_token obtained from the OAuth sign-in flow. Verified server-side.',
  })
  @IsString()
  idToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    type: 'string',
    description: 'Current account password',
    example: '&45367tDewgbck',
  })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({
    type: 'string',
    description: 'New password — must be strong and differ from current',
    example: '&45367tDewgbckNew',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  newPassword: string;
}

export class ChangeEmailDto {
  @ApiProperty({
    type: 'string',
    description: 'New email address to change to',
    example: 'newemail@example.com',
  })
  @IsEmail()
  @Transform(({ value }) => (value as string).toLocaleLowerCase())
  newEmail: string;

  @ApiProperty({
    type: 'string',
    description: 'Current account password — verifies ownership',
    example: '&45367tDewgbck',
  })
  @IsString()
  @MinLength(8)
  currentPassword: string;
}

export class VerifyEmailChangeDto {
  @ApiProperty({
    type: 'string',
    description: '6-digit OTP sent to the new email address',
    example: '482910',
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class Disable2faDto {
  @ApiProperty({
    type: 'string',
    description: 'Current 6-digit TOTP code from the authenticator app',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class Confirm2faDto {
  @ApiProperty({
    type: 'string',
    description: '6-digit TOTP code from the authenticator app after scanning the QR code',
    example: '482910',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty({
    type: 'string',
    description: 'Short-lived 2FA challenge JWT returned by login when 2FA is required',
  })
  @IsString()
  twoFactorToken: string;

  @ApiProperty({
    type: 'string',
    description: '6-digit TOTP code or 8-character backup code',
    example: '482910',
  })
  @IsString()
  @MinLength(6)
  code: string;
}
