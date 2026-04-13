import { TransactionSource, TransactionType } from '@fintrack/database/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

/**
 * CreateTransactionDto.
 */
export class CreateTransactionDto {
  @ApiProperty({
    type: 'number',
    required: true,
    description: 'The amount of the transaction',
    example: 100,
  })
  @Min(0, { message: 'Amount must be greater than 0' })
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @ApiProperty({
    type: 'string',
    required: true,
    description: 'The date of the transaction',
    example: '2026-01-01',
  })
  @IsDateString({ strict: false })
  date: string;

  @ApiProperty({
    type: 'string',
    required: true,
    description: 'The description of the transaction',
    example: 'INCOME',
  })
  @IsEnum(TransactionType, { message: 'Invalid transaction type' })
  type: TransactionType;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The description of the transaction',
    example: 'Lunch',
  })
  @Length(1, 255, {
    message: 'Description must be between 1 and 255 characters',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The merchant of the transaction',
    example: 'Starbucks',
  })
  @Length(1, 255, { message: 'Merchant must be between 1 and 255 characters' })
  @IsString()
  @IsOptional()
  merchant?: string;

  @ApiProperty({
    type: 'string',
    required: true,
    description: 'The category slug of the transaction',
    example: 'food-and-dining',
  })
  @IsString()
  @IsNotEmpty()
  categorySlug: string;

  @ApiProperty({
    type: 'string',
    required: true,
    description: 'The source of the transaction',
    example: 'MANUAL',
  })
  @IsIn([TransactionSource.MANUAL, TransactionSource.OCR], {
    message: 'Invalid transaction source',
  })
  source: TransactionSource;

  @ApiProperty({
    type: 'string',
    required: true,
    description: 'The source id of the transaction',
    example: 'ocr-job-123',
  })
  @IsString()
  @IsNotEmpty()
  sourceId: string;
}

/**
 * UpdateTransactionDto.
 */
export class UpdateTransactionDto {
  @ApiPropertyOptional({
    type: 'number',
    required: false,
    description: 'The amount of the transaction',
    example: 100,
  })
  @Min(0, { message: 'Amount must be greater than 0' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The date of the transaction',
    example: '2026-01-01',
  })
  @IsDateString({ strict: false })
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The type of the transaction',
    example: 'INCOME',
  })
  @IsEnum(TransactionType, { message: 'Invalid transaction type' })
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The description of the transaction',
    example: 'Lunch',
  })
  @Length(1, 255, {
    message: 'Description must be between 1 and 255 characters',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The merchant of the transaction',
    example: 'Starbucks',
  })
  @Length(1, 255, { message: 'Merchant must be between 1 and 255 characters' })
  @IsString()
  @IsOptional()
  merchant?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The category slug of the transaction',
    example: 'food-and-dining',
  })
  @IsString()
  @IsOptional()
  categorySlug?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'Notes about the transaction',
    example: 'Paid with card',
  })
  @Length(1, 1000, { message: 'Notes must be between 1 and 1000 characters' })
  @IsString()
  @IsOptional()
  notes?: string;
}
