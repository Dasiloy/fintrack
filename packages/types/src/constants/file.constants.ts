export const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB
export const IMAGE_FILE_TYPE = /^(image\/(png|jpe?g|gif|webp|bmp))$/i;
export const IMAGE_PDF_FILE_TYPE = /^(image\/(png|jpe?g|gif|webp|bmp)|application\/pdf)$/i;
export const ADVISOR_FILE_MAX_SIZE = 1024 * 1024; // 1MB
export const ADVISOR_FILES_MAX_COUNT = 10;
export const ADVISOR_FILES_MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB
export const ADVISOR_FILE_TYPE =
  /^(image\/(png|jpe?g|gif|webp|bmp)|application\/pdf|text\/csv|application\/csv|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/i;
export const ADVISOR_FILE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'application/pdf',
  'text/csv',
  'application/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;
