import {
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
import { Transform } from 'class-transformer';

import { GoalPriority } from '@fintrack/database/types';

export class CreateGoalDto {
  @ApiProperty({
    type: 'string',
    description: 'Name of the savings goal',
    example: 'Emergency Fund',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @ApiProperty({
    type: 'string',
    description:
      'ISO 8601 date string for the target completion date (must be in the future)',
    example: '2027-01-01',
  })
  @IsDateString()
  targetDate: string;

  @ApiProperty({
    type: 'number',
    description: 'Target amount to save',
    example: 5000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Target amount must be greater than 0' })
  targetAmount: number;

  @ApiProperty({
    enum: GoalPriority,
    description: 'Priority level of the goal',
    example: GoalPriority.HIGH,
  })
  @IsEnum(GoalPriority)
  priority: GoalPriority;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Optional description of the goal',
    example: 'Three months of living expenses as a safety net',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateGoalDto {
  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated name for the goal',
    example: 'Emergency Fund — 6 months',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated target completion date (ISO 8601)',
    example: '2027-06-01',
  })
  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Updated target amount',
    example: 10000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Target amount must be greater than 0' })
  @IsOptional()
  targetAmount?: number;

  @ApiPropertyOptional({
    enum: GoalPriority,
    description: 'Updated priority level',
    example: GoalPriority.MEDIUM,
  })
  @IsEnum(GoalPriority)
  @IsOptional()
  priority?: GoalPriority;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated description',
    example: 'Revised goal to cover six months of expenses',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class GetGoalsQueryDto {
  @ApiPropertyOptional({
    type: 'string',
    description: 'Comma-separated list of statuses to filter by',
    example: 'IN_PROGRESS,COMPLETED',
  })
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((s) => s.trim()) : value,
  )
  status?: string[];

  @ApiPropertyOptional({
    type: 'string',
    description: 'Comma-separated list of priorities to filter by',
    example: 'HIGH,MEDIUM',
  })
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((p) => p.trim()) : value,
  )
  priority?: string[];

  @ApiPropertyOptional({
    type: 'number',
    description: 'Amount threshold used with the operator filter',
    example: 1000,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  amount?: number;

  @ApiPropertyOptional({
    type: 'string',
    description:
      'Comparison operator applied to the amount filter. ' +
      'Accepted values: `gt` (>), `gte` (>=), `lt` (<), `lte` (<=), `eq` (=), `ne` (!=). ' +
      'Example: `operator=gte&amount=1000` returns goals with targetAmount >= 1000.',
    example: 'gte',
    enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'ne'],
  })
  @IsString()
  @IsOptional()
  operator?: string;
}

export class CreateContributionDto {
  @ApiProperty({
    type: 'number',
    description: 'Amount being contributed to the goal',
    example: 250,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Contribution amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    type: 'string',
    description:
      'Date of the contribution (ISO 8601). Ignored when transactionId is provided — the transaction date is used instead.',
    example: '2026-04-01',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Optional description for the contribution',
    example: 'Monthly savings deposit',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    description:
      'ID of an existing transaction to link to this contribution. When provided, the transaction date is used instead of the date field.',
    example: 'txn_abc123',
  })
  @IsString()
  @IsOptional()
  transactionId?: string;
}

export class UpdateContributionDto {
  @ApiPropertyOptional({
    type: 'number',
    description: 'Updated contribution amount',
    example: 500,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Contribution amount must be greater than 0' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated contribution date (ISO 8601)',
    example: '2026-05-01',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated description',
    example: 'Bonus savings deposit',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated linked transaction ID',
    example: 'txn_xyz789',
  })
  @IsString()
  @IsOptional()
  transactionId?: string;
}
