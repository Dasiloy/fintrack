import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LinkMonoAccountDto {
  @ApiProperty({
    type: 'string',
    required: true,
    description: 'One-time code returned by the Mono Connect widget',
    example: '536odnofi940404j4o',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ReLinkMonoAccountDto {
  @ApiProperty({
    type: 'string',
    required: true,
    description: 'One-time reauth code returned by the Mono Connect widget',
    example: '536odnofi940404j4o',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    type: 'string',
    required: true,
    description:
      'Permanent Mono accountId of the account being re-authenticated',
    example: '64b2f3a1e4b0a43d1c8e9f12',
  })
  @IsString()
  @IsNotEmpty()
  accountId: string;
}
