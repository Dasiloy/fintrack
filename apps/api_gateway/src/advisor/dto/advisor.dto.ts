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
import {
  ADVISOR_ATTACHMENT_KINDS,
  ADVISOR_WORKFLOW_IDS,
  ADVISOR_WORKFLOW_STATUSES,
  AdvisorAttachmentKind,
  AdvisorWorkflowId,
  AdvisorWorkflowOptions,
  AdvisorWorkflowStatus,
} from '@fintrack/types/interfaces/ai';

class ResumeAdvisorDto {
  @ApiProperty({ description: 'Whether the user approved the pending action.' })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({
    description: 'Assistant message id containing the pending action card.',
  })
  @IsString()
  @IsNotEmpty()
  actionMessageId: string;
}

class AdvisorWorkflowCandidateApprovalDto {
  @ApiProperty({
    description: 'Assistant message id containing the workflow response card.',
  })
  @IsString()
  @IsNotEmpty()
  responseMessageId: string;

  @ApiProperty({
    description: 'Workflow candidate ids selected by the user.',
    type: String,
    isArray: true,
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  selectedCandidateIds: string[];
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
  kind: AdvisorAttachmentKind;

  @ApiPropertyOptional({
    description: 'Extracted attachment text retained after first model pass.',
  })
  @IsOptional()
  @IsString()
  extractedText?: string;
}

class AdvisorWorkflowSummaryItemDto {
  @ApiProperty({ description: 'Short metric or option label.' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Short metric or option value.' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

class AdvisorWorkflowRunDto {
  @ApiProperty({ description: 'Unique workflow run id.' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Workflow type.',
    enum: ADVISOR_WORKFLOW_IDS,
  })
  @IsIn(ADVISOR_WORKFLOW_IDS)
  workflowId: AdvisorWorkflowId;

  @ApiProperty({ description: 'Display title for the workflow card.' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Display description for the workflow card.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Workflow option summary rows.',
    type: AdvisorWorkflowSummaryItemDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdvisorWorkflowSummaryItemDto)
  summaryItems: AdvisorWorkflowSummaryItemDto[];

  @ApiProperty({
    description: 'Workflow focus chips.',
    type: String,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  focusItems: string[];

  @ApiProperty({
    description: 'Workflow progress stage labels.',
    type: String,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  stages: string[];

  @ApiProperty({
    description: 'Current workflow lifecycle status.',
    enum: ADVISOR_WORKFLOW_STATUSES,
  })
  @IsIn(ADVISOR_WORKFLOW_STATUSES)
  status: AdvisorWorkflowStatus;

  @ApiProperty({ description: 'Zero-based active stage index.' })
  @IsInt()
  @Min(0)
  activeStageIndex: number;

  @ApiProperty({ description: 'Human-readable current workflow status.' })
  @IsString()
  @IsNotEmpty()
  statusLabel: string;

  @ApiPropertyOptional({ description: 'ISO timestamp for workflow start.' })
  @IsOptional()
  @IsString()
  startedAt?: string;

  @ApiPropertyOptional({
    description: 'ISO timestamp for workflow completion.',
  })
  @IsOptional()
  @IsString()
  completedAt?: string;
}

class AdvisorWorkflowOptionsDto implements AdvisorWorkflowOptions {
  @ApiPropertyOptional({ description: 'Forecast horizon in days.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  horizonDays?: number;

  @ApiPropertyOptional({
    description: 'Monthly review depth.',
    enum: ['quick', 'standard', 'deep'],
  })
  @IsOptional()
  @IsIn(['quick', 'standard', 'deep'])
  reviewDepth?: 'quick' | 'standard' | 'deep';

  @ApiPropertyOptional({ description: 'Month label for budget workflows.' })
  @IsOptional()
  @IsString()
  monthLabel?: string;

  @ApiPropertyOptional({
    description: 'Zero-based calendar month for month-scoped workflows.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(11)
  month?: number;

  @ApiPropertyOptional({
    description: 'Four-digit calendar year for month-scoped workflows.',
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    description: 'Budget rebalance strictness from 0-100.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  strictness?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeRecurring?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeSpending?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeBudgets?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeGoals?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeSplits?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  focusDuplicates?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  focusRisingCosts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  focusStaleBills?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  overspentOnly?: boolean;
}

class AdvisorWorkflowRequestDto {
  @ApiProperty({
    description: 'Workflow type.',
    enum: ADVISOR_WORKFLOW_IDS,
  })
  @IsIn(ADVISOR_WORKFLOW_IDS)
  workflowId: AdvisorWorkflowId;

  @ApiPropertyOptional({ description: 'Client-generated workflow run id.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  runId?: string;

  @ApiProperty({
    description: 'Workflow options selected by the user.',
    type: AdvisorWorkflowOptionsDto,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => AdvisorWorkflowOptionsDto)
  options: AdvisorWorkflowOptionsDto;
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
      !body.resume &&
      !body.workflow &&
      !body.workflowApproval &&
      (body.attachments?.length ?? 0) === 0,
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
    description:
      'Workflow metadata for rendering a durable workflow user card.',
    type: AdvisorWorkflowRunDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvisorWorkflowRunDto)
  workflowRun?: AdvisorWorkflowRunDto;

  @ApiPropertyOptional({
    description:
      'Structured workflow request. Gateway builds the advisor prompt.',
    type: AdvisorWorkflowRequestDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvisorWorkflowRequestDto)
  workflow?: AdvisorWorkflowRequestDto;

  @ApiPropertyOptional({
    description: 'Approval payload for selected workflow response candidates.',
    type: AdvisorWorkflowCandidateApprovalDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvisorWorkflowCandidateApprovalDto)
  workflowApproval?: AdvisorWorkflowCandidateApprovalDto;

  @ApiPropertyOptional({
    description: 'Resume payload for approving/rejecting a pending action.',
    type: ResumeAdvisorDto,
  })
  @ValidateIf(
    (body: SendAdvisorMessageDto) =>
      !body.message &&
      !body.workflow &&
      !body.workflowApproval &&
      (body.attachments?.length ?? 0) === 0,
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

export class GetAdvisorWorkflowRunsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by workflow type.',
    enum: ADVISOR_WORKFLOW_IDS,
  })
  @IsOptional()
  @IsIn(ADVISOR_WORKFLOW_IDS)
  workflowId?: AdvisorWorkflowId;

  @ApiPropertyOptional({
    description: 'Filter by workflow lifecycle status.',
    enum: ADVISOR_WORKFLOW_STATUSES,
  })
  @IsOptional()
  @IsIn(ADVISOR_WORKFLOW_STATUSES)
  status?: AdvisorWorkflowStatus;

  @ApiPropertyOptional({
    description:
      'Maximum number of workflow runs to return (default 20, max 50).',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
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
