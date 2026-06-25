import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { AdvisorScope } from '@fintrack/database/types';

class ResumeAdvisorDto {
  @ApiProperty({ description: 'Whether the user approved the pending action.' })
  @IsBoolean()
  approved: boolean;
}

export class SendAdvisorMessageDto {
  @ApiProperty({
    description: 'Conversation thread id (maps to LangGraph thread_id).',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiPropertyOptional({
    description: 'The user message to send to the advisor.',
  })
  @ValidateIf((body: SendAdvisorMessageDto) => !body.resume)
  @IsString()
  @IsNotEmpty()
  message?: string;

  @ApiPropertyOptional({
    description: 'Resume payload for approving/rejecting a pending action.',
    type: ResumeAdvisorDto,
  })
  @ValidateIf((body: SendAdvisorMessageDto) => !body.message)
  @IsDefined()
  @ValidateNested()
  @Type(() => ResumeAdvisorDto)
  resume?: ResumeAdvisorDto;
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
