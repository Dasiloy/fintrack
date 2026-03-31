import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

/**
 * CreateCategoryDto.
 */
export class CreateCategoryDto {
  @ApiProperty({
    type: 'string',
    required: true,
    description: 'Name of the category',
    example: 'Food',
  })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'Description of the category',
    example: 'Food category',
  })
  @IsOptional()
  @IsString()
  @Length(10, 255)
  description: string;

  @ApiProperty({
    type: 'string',
    required: true,
    description: 'Color of the category (6-digit hex with leading #)',
    example: '#F97316',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a 6-digit hex code with leading # (e.g. #F97316)',
  })
  color: string;
}

/**
 * UpdateCategoryDto.
 */
export class UpdateCategoryDto {
  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'Name of the category',
    example: 'Food',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'Description of the category',
    example: 'Food category',
  })
  @IsOptional()
  @IsString()
  @Length(10, 255)
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    required: false,
    description: 'Color of the category (6-digit hex with leading #)',
    example: '#F97316',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a 6-digit hex code with leading # (e.g. #F97316)',
  })
  color?: string;
}
