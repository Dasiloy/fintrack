import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { AdvisorScope } from '@fintrack/database/types';

export class SendAdvisorMessageDto {
  @ApiProperty({
    description: 'Conversation thread id (maps to LangGraph thread_id).',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ description: 'The user message to send to the advisor.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class RenameConversationDto {
  @ApiProperty({ description: 'The new conversation title.' })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class GetInsightsQueryDto {
  @ApiPropertyOptional({
    description: 'Number of recent insights to return (default 1, max 20)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 1;
}

export class UpdateAdvisorScopesDto {
  @ApiPropertyOptional({
    description: 'The full set of data scopes the advisor may use.',
    enum: AdvisorScope,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(AdvisorScope, { each: true })
  grantedScopes?: AdvisorScope[];

  @ApiPropertyOptional({
    description: 'Whether the advisor is enabled at all.',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
