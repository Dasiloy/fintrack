import { AdvisorAttachmentKind } from '@fintrack/types/interfaces/ai';
import { IsEmpty, IsIn, IsNotEmpty, IsString } from 'class-validator';

/**
 * Response returned by `POST /upload/receipt`.
 *
 * The client uses `draftId` to open the SSE stream
 * (`GET /transaction/draft/:draftId/stream`) and later as `sourceId` when
 * confirming the transaction (`POST /transaction` with `source: "OCR"`).
 */
export interface UploadReceiptResponse {
  /** Server-generated `cuid()` that identifies the OCRDraft row. */
  draftId: string;
  /**
   * `true`  — first time this receipt has been uploaded; a new OCRDraft was created
   *            and an extraction job has been enqueued.
   * `false` — the same image was uploaded before and a resolved (non-PENDING) draft
   *            already exists; no new job was enqueued.
   */
  isNew: boolean;
}

export class GetAdvisorFileUrlDto {
  @IsString()
  @IsNotEmpty()
  publicId: string;

  @IsString()
  @IsNotEmpty()
  format: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['image', 'pdf', 'csv', 'excel'])
  kind: AdvisorAttachmentKind;
}

export class DeleteAdvisorFileDto {
  @IsString()
  @IsNotEmpty()
  publicId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['image', 'pdf', 'csv', 'excel'])
  kind: AdvisorAttachmentKind;
}
