// analytics job
export interface AnalyticsNotificationPayload {
  userId: string;
  event: string;
  entityId: string;
  data: Record<string, string>;
}

export interface JoinAnalyticsRoomPayload {
  path: 'dashboard' | 'analytics';
}

// fcm job
export interface FcmNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// classification correction job
export interface ClassificationCorrectionJobPayload {
  userId: string;
  narration: string;
  correctedSlug: string;
}

// budget check job
export interface BudgetCheckJobPayload {
  userId: string;
  transactions: {
    categoryId: string;
    referenceDate: string;
  }[];
}

/**
 * Payload for an `OCR_QUEUE_JOB` enqueued by the API gateway after a receipt upload.
 * The AI service processor reads this to fetch the file, call the vision model,
 * and write the result back to the `OCRDraft` row.
 */
export interface OcrToTransactionJob {
  /** `OCRDraft.id` — the server-generated cuid that identifies this extraction run. */
  id: string;
  /** Owning user — used to scope the DB write and Redis Pub/Sub channel. */
  userId: string;
  /** Cloudinary `secure_url` stored in `OCRDraft.imageKey` — the processor fetches from here. */
  imageUrl: string;
  /**
   * Derived from `file.mimetype === 'application/pdf'` at upload time.
   * Tells the processor whether to send the file as a PDF document or an image to the model.
   */
  isPdf: boolean;
}
