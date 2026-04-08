import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RecurringItemFrequency,
  TransactionType,
} from '@fintrack/database/types';
import { Transform } from 'class-transformer';

export class CreateRecurringDto {
  @ApiProperty({
    type: 'string',
    description: 'Name of the recurring item',
    example: 'Netflix Subscription',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @ApiProperty({
    type: 'number',
    description: 'Amount to record on each run',
    example: 15.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    enum: RecurringItemFrequency,
    description: 'How often this item recurs',
    example: RecurringItemFrequency.MONTHLY,
  })
  @IsEnum(RecurringItemFrequency)
  frequency: RecurringItemFrequency;

  @ApiProperty({
    enum: TransactionType,
    description: 'Whether this is an income or expense',
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    type: 'string',
    description: 'ISO 8601 date string for when the recurring item starts',
    example: '2026-05-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    type: 'string',
    description: 'Category slug to classify the generated transactions',
    example: 'subscriptions',
  })
  @IsString()
  @IsNotEmpty()
  categorySlug: string;

  @ApiPropertyOptional({
    type: 'string',
    description:
      'ISO 8601 date string for when the recurring item ends. Null means it runs indefinitely.',
    example: '2027-05-01',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Optional description',
    example: 'Streaming service subscription',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Optional merchant name',
    example: 'Netflix',
  })
  @IsString()
  @IsOptional()
  merchant?: string;
}

export class UpdateRecurringDto {
  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated name',
    example: 'Netflix Premium',
  })
  @IsString()
  @IsOptional()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Updated amount',
    example: 22.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    enum: RecurringItemFrequency,
    description: 'How often this item recurs',
    example: RecurringItemFrequency.MONTHLY,
  })
  @IsEnum(RecurringItemFrequency)
  @IsOptional()
  frequency: RecurringItemFrequency;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated end date. Pass null to remove the end date.',
    example: '2028-01-01',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated merchant',
  })
  @IsString()
  @IsOptional()
  merchant?: string;
}

export class GetRecurringsQueryDto {
  @ApiPropertyOptional({
    type: 'boolean',
    description: 'Filter by active status. Omit to return all.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    // If omitted → leave as undefined
    if (value === undefined || value === null) return undefined;

    // Accept string "true"/"false", boolean, 0/1, etc.
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
  })
  isActive?: boolean;
}
