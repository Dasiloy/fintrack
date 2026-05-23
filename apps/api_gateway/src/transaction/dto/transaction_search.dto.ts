import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { TransactionType } from '@fintrack/database/types';

export class TransactionSearchDto {
  @ApiProperty({
    type: 'string',
    description:
      'Partial text to search across description, merchant, notes, narration',
    example: 'coffee',
  })
  @IsString()
  @MinLength(1)
  q: string;

  @ApiPropertyOptional({
    enum: TransactionType,
    description: 'Filter by transaction type',
    example: 'EXPENSE',
  })
  @IsEnum(TransactionType, { message: 'Invalid transaction type' })
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Maximum number of results (default 20, max 50)',
    example: 20,
  })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}
