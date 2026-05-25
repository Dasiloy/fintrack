import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Analytics document kinds supported by the export center. */
export type ExportDocType =
  | 'transaction-history'
  | 'monthly-summary'
  | 'spending-breakdown'
  | 'budget-performance'
  | 'goal-progress'
  | 'net-worth';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'image';

export const EXPORT_DOC_TYPES: ExportDocType[] = [
  'transaction-history',
  'monthly-summary',
  'spending-breakdown',
  'budget-performance',
  'goal-progress',
  'net-worth',
];

export const EXPORT_FORMATS: ExportFormat[] = ['csv', 'xlsx', 'pdf', 'image'];

export const SUPPORTED_FORMATS: Record<ExportDocType, ExportFormat[]> = {
  'transaction-history': ['csv', 'xlsx'],
  'monthly-summary': ['pdf'],
  'spending-breakdown': ['image'],
  'budget-performance': ['pdf', 'xlsx'],
  'goal-progress': ['pdf', 'xlsx'],
  'net-worth': ['pdf', 'image'],
};

export const MIME_TYPES: Record<ExportFormat, string> = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
  image: 'image/png',
};

export const FILE_EXTENSIONS: Record<ExportFormat, string> = {
  csv: 'csv',
  xlsx: 'xlsx',
  pdf: 'pdf',
  image: 'png',
};

/**
 * Request body for POST /api/export/generate.
 *
 * @see SUPPORTED_FORMATS for valid type/format pairs.
 */
export class GenerateExportDto {
  @ApiProperty({
    enum: EXPORT_DOC_TYPES,
    description: 'Analytics document to export',
    example: 'transaction-history',
  })
  @IsIn(EXPORT_DOC_TYPES)
  type: ExportDocType;

  @ApiProperty({
    enum: EXPORT_FORMATS,
    description: 'Output format (must be supported for the chosen type)',
    example: 'xlsx',
  })
  @IsIn(EXPORT_FORMATS)
  format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Inclusive start date (ISO YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Inclusive end date (ISO YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: ['INCOME', 'EXPENSE'],
    description: 'Filter transaction-history exports by transaction type',
  })
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'])
  txType?: string;

  @ApiPropertyOptional({
    description:
      'Lookback months for spending-breakdown (1–12, default 6 in service)',
    minimum: 1,
    maximum: 12,
    example: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  months?: number;

  @ApiPropertyOptional({
    description: 'Bypass Redis cache and regenerate the file',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export interface PreviewSummaryItem {
  label: string;
  value: string;
  /** undefined = default text color */
  color?: 'green' | 'red' | 'primary';
}

/** Structured snapshot used to render a real-data preview in the FE sheet. */
export interface ExportPreviewData {
  summary: PreviewSummaryItem[];
  headers: string[];
  /** Each element is one row; cells match headers order. */
  rows: (string | null)[][];
}

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  generatedAt: string;
  cached: boolean;
  previewData: ExportPreviewData | null;
}

export interface CachedExport {
  bufferBase64: string;
  filename: string;
  mimeType: string;
  generatedAt: string;
  previewData: ExportPreviewData | null;
}
