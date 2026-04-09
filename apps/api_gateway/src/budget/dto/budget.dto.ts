import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BudgetPeriod } from '@fintrack/database/types';

export class CreateBudgetDto {
  @ApiProperty({
    type: 'string',
    required: true,
    description: 'The name of the budget',
    example: 'Food Budget',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100, { message: 'Name must be between 5 and 100 characters' })
  name: string;

  @ApiProperty({
    type: 'number',
    required: true,
    description: 'The amount of the budget',
    example: 100,
  })
  @Min(1, { message: 'Amount must be greater than 0' })
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The description of the budget',
    example: 'This is a budget for food',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'number',
    required: false,
    description: 'The alert threshold of the budget',
    example: 0.8,
  })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1, { message: 'Alert threshold must be greater than 0.1' })
  @Max(1, { message: 'Alert threshold must be less than or equal to 1' })
  @IsOptional()
  alertThreshold?: number = 0.8;

  @ApiProperty({
    type: 'string',
    required: true,
    description: 'The category slug of the budget',
    example: 'food-and-dining',
  })
  @IsString()
  @IsNotEmpty()
  categorySlug: string;

  @ApiPropertyOptional({
    type: 'integer',
    required: false,
    description:
      '0-indexed month for the budget start date (0 = January). Must be provided together with year.',
    example: 0,
  })
  @IsInt()
  @Min(0)
  @Max(11)
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({
    type: 'integer',
    required: false,
    description:
      'Full year for the budget start date. Must be provided together with month.',
    example: 2026,
  })
  @IsInt()
  @Min(2000)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    enum: BudgetPeriod,
    required: false,
    description: 'The budget period. Defaults to MONTHLY.',
    example: BudgetPeriod.MONTHLY,
  })
  @IsEnum(BudgetPeriod)
  @IsOptional()
  period?: BudgetPeriod;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The name of the budget',
    example: 'Food Budget',
  })
  @IsString()
  @IsOptional()
  @Length(5, 100, { message: 'Name must be between 5 and 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    type: 'number',
    required: false,
    description: 'The amount of the budget',
    example: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'Amount must be greater than 0' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'The description of the budget',
    example: 'This is a budget for food',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'number',
    required: false,
    description: 'The alert threshold of the budget',
    example: 0.8,
  })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1, { message: 'Alert threshold must be greater than 0.1' })
  @Max(1, { message: 'Alert threshold must be less than or equal to 1' })
  @IsOptional()
  alertThreshold?: number;
}
