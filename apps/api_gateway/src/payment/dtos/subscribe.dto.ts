import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({
    type: 'string',
    example: '123',
    description: 'random id',
  })
  @IsString({
    message: 'id must be a string',
  })
  @IsNotEmpty({
    message: 'Id is required',
  })
  @MinLength(2, {
    message: 'id cant be less than 2 digits',
  })
  id: string;
}
