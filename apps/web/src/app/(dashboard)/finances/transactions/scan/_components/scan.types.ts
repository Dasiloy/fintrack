export type Phase = 'idle' | 'uploading' | 'scanning' | 'done';

export interface OcrPayload {
  status: string;
  amount?: number;
  date?: string;
  merchant?: string;
  description?: string;
  categorySlug?: string;
  failureReason?: string;
}

export const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'application/pdf',
]);

export const MAX_BYTES = 1 * 1024 * 1024;
