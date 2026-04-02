import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginateQuery } from '@fintrack/types/interfaces/server_response';

import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransactionSource, TransactionType } from '@fintrack/database/types';
import { Transform } from 'class-transformer';

/**
 * TransactionQueryDto.
 */
export class TransactionQueryDto implements PaginateQuery {
  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The start date of the transactions',
    example: '2026-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The end date of the transactions',
    example: '2026-01-01',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The page number',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @ApiPropertyOptional({
    type: 'number',
    required: false,
    description: 'The number of records per page',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit: number = 10;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The category slug',
    example: 'food',
  })
  @IsString({
    each: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((slug) => slug.trim())
      : value,
  )
  categorySlug?: string[];

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The transaction type',
    example: 'expense',
  })
  @IsEnum(TransactionType, {
    each: true,
    message: 'Invalid transaction type',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((type) => type.trim())
      : value,
  )
  type?: TransactionType[];

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The transaction source',
    example: 'MANUAL',
  })
  @IsEnum(TransactionSource, {
    each: true,
    message: 'Invalid transaction source',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((source) => source.trim())
      : value,
  )
  source?: TransactionSource[];

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The transaction source id',
    example: 'ocr-job-123',
  })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The bank transaction id',
    example: 'bank-transaction-123',
  })
  @IsString()
  @IsOptional()
  bankTransactionId?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The bank account id',
    example: 'bank-account-123',
  })
  @IsString()
  @IsOptional()
  bankAccountId?: string;
}
