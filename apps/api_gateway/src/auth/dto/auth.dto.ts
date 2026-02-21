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
  LoginReq,
  RefreshTokenReq,
  RegisterReq,
  ResendForgotPasswordTokenReq,
  ResendVerifyEmailTokenReq,
  ResetPasswordReq,
  VerifyEmailReq,
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

export class VerifyEmailDto implements VerifyEmailReq {
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
    message: 'Token Invalid',
  })
  @MaxLength(6, {
    message: 'Token Invalid',
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

export class LoginDto implements LoginReq {
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

export class ResetPasswordDto implements ResetPasswordReq {
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

export class RefreshTokenDto implements RefreshTokenReq {
  @ApiProperty({
    type: 'string',
    description: 'Refresh token',
  })
  @IsString()
  refreshToken: string;
}
