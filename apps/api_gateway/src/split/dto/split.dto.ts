import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

import { SplitStatus } from '@fintrack/database/types';
import { PaginateQuery } from '@fintrack/types/interfaces/server_response';

export class CreateSplitDto {
  @ApiProperty({
    type: 'string',
    required: true,
    description: 'Name of the split expense',
    example: 'Friday Night Out',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @ApiProperty({
    type: 'number',
    required: true,
    description: 'Total amount of the split',
    example: 20000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'Optional expense transaction ID to link to this split',
    example: 'txn_abc123',
  })
  @IsString()
  @IsOptional()
  transactionId?: string;
}

export class UpdateSplitDto {
  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'Updated split name',
    example: 'Friday Night Out (Updated)',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    type: 'number',
    required: false,
    description: 'Updated split amount',
    example: 25000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @IsOptional()
  amount?: number;
}

export class GetSplitsQueryDto implements PaginateQuery {
  @ApiPropertyOptional({
    type: 'string',
    description:
      'Comma-separated split statuses to filter by. Omit to return all.',
    example: 'OPEN,PARTIALLY_SETTLED',
  })
  @IsEnum(SplitStatus, { each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((s) => s.trim()) : value,
  )
  status?: SplitStatus[];

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
}

export class AddParticipantDto {
  @ApiProperty({
    type: 'string',
    description: 'Participant name',
    example: 'Ada Benita',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @ApiProperty({
    type: 'string',
    required: true,
    description: 'Participant email',
    example: 'ada@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: 'number',
    required: true,
    description: 'Amount this participant owes',
    example: 8000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;
}

export class UpdateParticipantDto {
  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated participant name',
    example: 'Ada Lovelace',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated participant email',
    example: 'adalovelace@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Updated participant owed amount',
    example: 9000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @IsOptional()
  amount?: number;
}

export class PaySettlementDto {
  @ApiProperty({
    type: 'number',
    description: 'Amount paid in this settlement',
    example: 5000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Paid amount must be greater than 0' })
  paidAmount: number;

  @ApiProperty({
    type: 'string',
    description: 'Settlement payment date (ISO 8601)',
    example: '2026-04-05T21:00:00.000Z',
  })
  @IsDateString()
  paidAt: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Optional income transaction ID to link to this settlement',
    example: 'txn_income_abc123',
  })
  @IsString()
  @IsOptional()
  transactionId?: string;
}
