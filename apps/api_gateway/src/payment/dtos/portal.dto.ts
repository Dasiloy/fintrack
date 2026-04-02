import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * CreatePortalSessionDto.
 */
export class CreatePortalSessionDto {
  @ApiProperty({
    type: 'string',
    description: 'The URL to redirect to after the user completes the payment',
    example: 'https://www.example.com',
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  returnUrl?: string;
}
