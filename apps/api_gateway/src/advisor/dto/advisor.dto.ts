import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsIn,
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
import { ADVISOR_FILE_MIME_TYPES } from '@fintrack/types/constants/file.constants';

const ADVISOR_ATTACHMENT_KINDS = ['image', 'pdf', 'csv', 'excel'] as const;

class ResumeAdvisorDto {
  @ApiProperty({ description: 'Whether the user approved the pending action.' })
  @IsBoolean()
  approved: boolean;
}

class AdvisorAttachmentDto {
  @ApiPropertyOptional({
    description: 'Short-lived signed URL used only during model handoff.',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ description: 'Cloudinary public id for the uploaded file.' })
  @IsString()
  @IsNotEmpty()
  publicId: string;

  @ApiProperty({ description: 'Original display filename.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'MIME type accepted by advisor uploads.',
    enum: ADVISOR_FILE_MIME_TYPES,
  })
  @IsString()
  @IsIn(ADVISOR_FILE_MIME_TYPES)
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes.' })
  @IsInt()
  @Min(1)
  sizeBytes: number;

  @ApiProperty({ description: 'Cloudinary resource format/extension.' })
  @IsString()
  @IsNotEmpty()
  format: string;

  @ApiProperty({
    description: 'Advisor attachment category.',
    enum: ADVISOR_ATTACHMENT_KINDS,
  })
  @IsIn(ADVISOR_ATTACHMENT_KINDS)
  kind: (typeof ADVISOR_ATTACHMENT_KINDS)[number];

  @ApiPropertyOptional({
    description: 'Extracted attachment text retained after first model pass.',
  })
  @IsOptional()
  @IsString()
  extractedText?: string;
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
  @ValidateIf(
    (body: SendAdvisorMessageDto) =>
      !body.resume && (body.attachments?.length ?? 0) === 0,
  )
  @IsString()
  @IsNotEmpty()
  message?: string;

  @ApiPropertyOptional({
    description:
      'Advisor file attachments. A request may include attachments without message text.',
    type: AdvisorAttachmentDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdvisorAttachmentDto)
  attachments?: AdvisorAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Resume payload for approving/rejecting a pending action.',
    type: ResumeAdvisorDto,
  })
  @ValidateIf(
    (body: SendAdvisorMessageDto) =>
      !body.message && (body.attachments?.length ?? 0) === 0,
  )
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
