import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { RegisterReq } from '@fintrack/types/protos/auth/auth';

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
