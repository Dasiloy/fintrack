import * as cloudinary from 'cloudinary';
import { Readable } from 'stream';

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { OCRDraftStatus, type User } from '@fintrack/database/types';
import { PrismaService } from '@fintrack/database/service';

import { UserService } from '../user/user.service';
import { TransactionService } from '../transaction/transaction.service';
import { UsageService } from '../usage/usage.service';
import { UploadReceiptResponse } from './dto/upload_receipt.dto';
import type {
  AdvisorAttachment,
  AdvisorAttachmentKind,
  AdvisorAttachmentUploadFailure,
  AdvisorAttachmentUploadResult,
} from '@fintrack/types/interfaces/ai';
import {
  ADVISOR_FILE_MAX_SIZE,
  ADVISOR_FILE_MIME_TYPES,
} from '@fintrack/types/constants/file.constants';
import { PRIVATEUPLOAD_EXPIRY } from '@fintrack/types/constants/upload.constants';

/**
 * Service responsible for uploading and fetching files from Cloudinary
 *
 * @class UploadService
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private static readonly ADVISOR_TEXT_PREVIEW_LIMIT = 20_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly transactionService: TransactionService,
    private readonly usageService: UsageService,
  ) {
    cloudinary.v2.config({
      secure: true,
      sign_url: true,
    });
  }

  /**
   * @description Uploads a profile image to Cloudinary and updates the user's avatar in the database
   *
   * @async
   * @public
   * @param user - The user to upload the profile image for
   * @param file - The file to upload
   * @returns void
   */
  async uploadProfileImage(
    user: User,
    file: Express.Multer.File,
  ): Promise<void> {
    try {
      const result = await this.uploadStream(file.buffer, {
        overwrite: true,
        resource_type: 'image',
        use_filename: true,
        unique_filename: false,
        type: 'upload',
        public_id: `fintrack/profile-images/${user.id}/${file.originalname}`,
        tags: ['fintrack', 'profile-image'],
        context: {
          user_id: user.id,
        },
        eager: [{ width: 128, height: 128, crop: 'scale' }],
      });
      await this.prisma.user.update({
        where: { id: user.id },
        data: { avatar: result.secure_url },
      });
      void this.userService.invalidateUserProfileCache(user.id);
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Failed to upload profile image');
    }
  }

  /**
   * @description Uploads a receipt image or PDF to Cloudinary, then upserts an OCRDraft
   * row and enqueues an OCR extraction job for it.
   *
   * Cloudinary deduplication: the `public_id` is scoped to `{userId}/{originalname}` with
   * `overwrite: true`, so the same file from the same user always resolves to the same
   * `secure_url`. The OCRDraft upsert on `imageKey` is then a no-op for duplicates, and the
   * enqueue guard (`status === PENDING`) prevents re-processing an already running job.
   *
   * On any failure for a first-time upload (`!resolvedOcrDraft`), the Cloudinary object is
   * destroyed to keep storage consistent with the database.
   *
   * @async
   * @public
   * @param {User} user - Authenticated user performing the upload
   * @param {Express.Multer.File} file - Validated multipart file (image or PDF, max 5 MB)
   * @returns {Promise<UploadReceiptResponse>} `{ draftId, isNew }` where `isNew` is false
   *   when the same receipt was uploaded before and a resolved draft already exists
   */
  async uploadReceipt(
    user: User,
    file: Express.Multer.File,
  ): Promise<UploadReceiptResponse> {
    const isPdf = file.mimetype === 'application/pdf';
    let receipt: cloudinary.UploadApiResponse;
    try {
      receipt = await this.uploadStream(file.buffer, {
        overwrite: true,
        use_filename: true,
        unique_filename: false,
        type: 'upload',
        public_id: `fintrack/receipts/${user.id}/${file.originalname}`,
        tags: ['fintrack', 'transactions', 'receipts'],
        context: {
          user_id: user.id,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Failed to upload receipt');
    }

    if (!receipt) {
      throw new InternalServerErrorException('Failed to upload receipt');
    }

    // check for existing ressolved ocr draft
    const ressolvedOcrDraft = await this.prisma.oCRDraft.findFirst({
      where: {
        imageKey: receipt.secure_url,
        status: { not: OCRDraftStatus.PENDING },
      },
    });

    try {
      // we use upsert to skip duplicate keys issues
      // the importamnt thing is once status goes to processing, no need to enqueue
      // so no dupliacet or waste of resources
      const ocrDraft = await this.transactionService.createOcrDraft(
        user,
        receipt.secure_url,
      );

      await this.transactionService.enqueueOcrDraft(ocrDraft, isPdf);

      void this.usageService.incrementUsage(user.id, 'RECEIPT_UPLOADS');
      return {
        draftId: ocrDraft.id,
        isNew: !ressolvedOcrDraft,
      };
    } catch (error) {
      if (!ressolvedOcrDraft) {
        await cloudinary.v2.uploader.destroy(receipt.public_id); // destroy first time upload if ocr fails
      }
      this.logger.error(JSON.stringify(error));
      throw new InternalServerErrorException('Receipt Extraction failed');
    }
  }

  /**
   * Uploads a validated advisor attachment to Cloudinary and returns metadata
   * that can be persisted with the chat turn and forwarded to the AI service.
   *
   * CSV and XLSX uploads are parsed immediately into a bounded text preview so
   * the advisor can reason over tabular data without downloading the object
   * from Cloudinary during graph execution. Images and PDFs keep their hosted
   * URL only and are consumed by the AI service as model-facing file parts.
   *
   * @param user - Authenticated user who owns the uploaded advisor attachment.
   * @param file - Multer file already validated by the upload controller.
   * @returns Cloudinary metadata plus optional extracted text for tabular files.
   * @throws InternalServerErrorException when Cloudinary upload fails.
   */
  async uploadAdvisorFile(
    user: User,
    file: Express.Multer.File,
  ): Promise<AdvisorAttachment> {
    const kind = this.advisorAttachmentKind(file.mimetype);
    const safeName = file.originalname.replace(/[^\w.\-]+/g, '_');

    let upload: cloudinary.UploadApiResponse;
    try {
      upload = await this.uploadStream(file.buffer, {
        overwrite: true,
        use_filename: true,
        unique_filename: false,
        resource_type: this.advisorCloudinaryResourceType(kind),
        type: 'private', // crucial so that users docs stays private
        public_id: `fintrack/advisor/${user.id}/${safeName}`,
        tags: ['fintrack', 'advisor', kind],
        context: {
          user_id: user.id,
          original_name: file.originalname,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Failed to upload advisor file');
    }

    return {
      format: upload.format ?? this.advisorAttachmentFormat(file.originalname, kind),
      publicId: upload.public_id,
      name: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      kind,
      ...(await this.extractAdvisorText(file, kind)),
    };
  }

  /**
   * Uploads a batch of advisor attachments in one request while preserving the
   * same per-file Cloudinary metadata and text extraction behavior used by
   * {@link uploadAdvisorFile}.
   *
   * Files are processed concurrently because each item is independent. Failed
   * items are returned alongside successful uploads so the client can append
   * successful files immediately and retry only the failed local files.
   *
   * @param user - Authenticated user who owns every uploaded attachment.
   * @param files - Multer files received from the advisor upload controller.
   * @returns Successful uploads plus per-file failures for retry UI.
   */
  async uploadAdvisorFiles(
    user: User,
    files: Express.Multer.File[],
  ): Promise<AdvisorAttachmentUploadResult> {
    const results = await Promise.allSettled(
      files.map(async (file, index) => {
        const validationFailure = this.validateAdvisorUploadFile(file, index);
        if (validationFailure) return validationFailure;
        return this.uploadAdvisorFile(user, file);
      }),
    );

    const uploaded: AdvisorAttachment[] = [];
    const failed: AdvisorAttachmentUploadFailure[] = [];

    for (const [index, result] of results.entries()) {
      const file = files[index];
      if (result.status === 'rejected') {
        failed.push(this.toAdvisorUploadFailure(file, index, result.reason));
        continue;
      }
      if ('reason' in result.value) {
        failed.push(result.value);
        continue;
      }
      uploaded.push(result.value);
    }

    return { uploaded, failed };
  }

  /**
   * Best-effort cleanup for an advisor attachment that the user removed before
   * sending the chat turn.
   *
   * The public id must stay inside the authenticated user's advisor upload
   * folder. Cloudinary deletion failures are logged and swallowed because this
   * endpoint is storage hygiene, not user-visible state.
   *
   * @param user - Authenticated owner of the advisor upload.
   * @param publicId - Cloudinary public id returned by {@link uploadAdvisorFile}.
   * @param kind - Attachment kind used to select Cloudinary resource type.
   * @returns True when Cloudinary reports deletion, otherwise false.
   */
  async deleteAdvisorFile(
    user: User,
    publicId: string,
    kind: AdvisorAttachmentKind,
  ): Promise<boolean> {
    return this.deleteAdvisorFileForUser(user.id, publicId, kind);
  }

  /**
   * Deletes an advisor attachment for a known owner id.
   *
   * Used by background cleanup jobs after advisor conversations are deleted.
   * Ownership is still enforced through the Cloudinary folder prefix so one
   * user's queued cleanup cannot delete another user's upload.
   *
   * @param userId - Owner id embedded in the advisor Cloudinary public id.
   * @param publicId - Cloudinary public id returned by {@link uploadAdvisorFile}.
   * @param kind - Attachment kind used to select Cloudinary resource type.
   * @returns True when Cloudinary reports deletion, otherwise false.
   */
  async deleteAdvisorFileForUser(
    userId: string,
    publicId: string,
    kind: AdvisorAttachmentKind,
  ): Promise<boolean> {
    const prefix = `fintrack/advisor/${userId}/`;
    if (!publicId.startsWith(prefix)) {
      return false;
    }

    try {
      const result = await cloudinary.v2.uploader.destroy(publicId, {
        resource_type: this.advisorCloudinaryResourceType(kind),
        type: 'private',
      });
      return result.result === 'ok';
    } catch (error) {
      this.logger.warn(
        `Could not delete advisor upload ${publicId}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Generates a short-lived signed URL for an advisor attachment.
   *
   * Advisor uploads are stored as Cloudinary private assets. The database keeps
   * only the public id and format; callers mint a fresh URL for either model
   * ingestion or user viewing after validating the public id belongs to the
   * authenticated owner.
   *
   * @param userId - Owner id embedded in the Cloudinary public id.
   * @param publicId - Cloudinary public id returned by {@link uploadAdvisorFile}.
   * @param format - Cloudinary asset format needed by private download URLs.
   * @param mode - `model` opens inline for model fetches, `view` opens inline for users.
   * @returns One-hour signed URL, or null when the public id is not owned by the user.
   */
  getAdvisorFileUrlForUser(
    userId: string,
    publicId: string,
    format: string,
    mode: 'model' | 'view' = 'view',
  ): string | null {
    const prefix = `fintrack/advisor/${userId}/`;
    if (!publicId.startsWith(prefix)) {
      return null;
    }

    return this.getPrivateSecureUrl(
      publicId,
      format,
      mode,
      this.advisorCloudinaryResourceType(
        this.advisorAttachmentKindFromFormat(format),
      ),
    );
  }

  /**
   * Validates one advisor upload without rejecting the whole batch.
   *
   * @param file - Uploaded file to validate.
   * @returns A retryable file-level failure when invalid, otherwise null.
   */
  private validateAdvisorUploadFile(
    file: Express.Multer.File,
    index: number,
  ): AdvisorAttachmentUploadFailure | null {
    if (!ADVISOR_FILE_MIME_TYPES.includes(file.mimetype as never)) {
      return {
        index,
        name: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        reason: 'Only images, PDF, CSV, and XLSX files are supported.',
      };
    }

    if (file.size > ADVISOR_FILE_MAX_SIZE) {
      return {
        index,
        name: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        reason: 'Each advisor file must be 1 MB or less.',
      };
    }

    return null;
  }

  /**
   * Converts an upload exception into a file-level failure that the frontend can
   * display beside the original local file.
   *
   * @param file - File whose Cloudinary upload or text extraction failed.
   * @param reason - Rejection reason thrown by the per-file upload path.
   * @returns Retryable advisor upload failure metadata.
   */
  private toAdvisorUploadFailure(
    file: Express.Multer.File,
    index: number,
    reason: unknown,
  ): AdvisorAttachmentUploadFailure {
    return {
      index,
      name: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      reason:
        reason instanceof Error
          ? reason.message
          : 'Could not upload this file. Please try again.',
    };
  }

  /**
   * Maps an accepted MIME type to the advisor attachment kind used by storage,
   * chat metadata, and model prompt construction.
   *
   * @param mimeType - MIME type accepted by the advisor upload validator.
   * @returns The normalized advisor attachment kind.
   */
  private advisorAttachmentKind(mimeType: string): AdvisorAttachmentKind {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'text/csv' || mimeType === 'application/csv') return 'csv';
    return 'excel';
  }

  private advisorAttachmentFormat(
    filename: string,
    kind: AdvisorAttachmentKind,
  ): string {
    const extension = filename.split('.').pop()?.trim().toLowerCase();
    if (extension) return extension === 'jpeg' ? 'jpg' : extension;

    switch (kind) {
      case 'csv':
        return 'csv';
      case 'excel':
        return 'xlsx';
      case 'pdf':
        return 'pdf';
      case 'image':
        return 'jpg';
    }
  }

  /**
   * Maps persisted advisor metadata back to the Cloudinary resource type needed
   * for private URL signing and deletion.
   *
   * @param format - Cloudinary asset format returned at upload time.
   * @returns Advisor attachment kind inferred from the format.
   */
  private advisorAttachmentKindFromFormat(
    format: string,
  ): AdvisorAttachmentKind {
    if (format === 'csv') return 'csv';
    if (format === 'xlsx') return 'excel';
    if (format === 'pdf') return 'pdf';
    return 'image';
  }

  /**
   * Cloudinary stores CSV and XLSX as raw assets. `raw` is a resource type, not
   * a file format; passing it as `format` causes "Invalid extension in transformation: raw".
   *
   * @param kind - Normalized advisor attachment kind.
   * @returns Cloudinary resource type for upload, deletion, and signed URLs.
   */
  private advisorCloudinaryResourceType(
    kind: AdvisorAttachmentKind,
  ): cloudinary.UploadApiOptions['resource_type'] {
    return kind === 'csv' || kind === 'excel' ? 'raw' : 'auto';
  }

  /**
   * Extracts a bounded text preview for tabular advisor files.
   *
   * CSV files are decoded as UTF-8. XLSX files are read sheet-by-sheet and each
   * non-empty row is flattened into comma-separated cell text. Non-tabular file
   * kinds intentionally return no preview because they are passed to the model
   * through their hosted URL.
   *
   * @param file - Original uploaded file buffer.
   * @param kind - Normalized advisor attachment kind.
   * @returns An object containing `extractedText` when text extraction succeeds.
   */
  private async extractAdvisorText(
    file: Express.Multer.File,
    kind: AdvisorAttachmentKind,
  ): Promise<Pick<AdvisorAttachment, 'extractedText'>> {
    if (kind === 'csv') {
      return {
        extractedText: this.truncateAdvisorText(file.buffer.toString('utf8')),
      };
    }

    if (kind !== 'excel') return {};

    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(
        file.buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
      );
      const lines: string[] = [];
      workbook.eachSheet((sheet) => {
        lines.push(`# Sheet: ${sheet.name}`);
        sheet.eachRow((row, rowNumber) => {
          const values = row.values;
          if (!Array.isArray(values)) return;
          const cells = values
            .slice(1)
            .map((cell) =>
              typeof cell === 'object' && cell !== null
                ? JSON.stringify(cell)
                : String(cell ?? ''),
            )
            .join(', ');
          if (cells.trim()) lines.push(`${rowNumber}: ${cells}`);
        });
      });
      return {
        extractedText: this.truncateAdvisorText(lines.join('\n')),
      };
    } catch (error) {
      this.logger.warn(
        `Could not extract advisor spreadsheet text: ${(error as Error).message}`,
      );
      return {};
    }
  }

  /**
   * Caps extracted advisor text so a single upload cannot overwhelm the staged
   * chat payload or the downstream model prompt.
   *
   * @param text - Extracted CSV/XLSX text.
   * @returns Original text when under the limit, otherwise a truncated preview.
   */
  private truncateAdvisorText(text: string): string {
    return text.length > UploadService.ADVISOR_TEXT_PREVIEW_LIMIT
      ? `${text.slice(0, UploadService.ADVISOR_TEXT_PREVIEW_LIMIT)}\n[truncated]`
      : text;
  }

  /**
   * @description Uploads a file to Cloudinary
   *
   * @async
   * @private
   * @param {Buffer} buffer - The buffer to upload
   * @param {cloudinary.UploadApiOptions} options - The options to upload the file with
   * @returns {Promise<cloudinary.UploadApiResponse>} The response from Cloudinary
   */
  private async uploadStream(
    buffer: Buffer,
    options: cloudinary.UploadApiOptions,
  ): Promise<cloudinary.UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const writeableStream = cloudinary.v2.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error('Failed to upload file'));
        },
      );
      const readable = Readable.from(buffer);
      readable.pipe(writeableStream);
    });
  }

  /**
   *  Returns an hour safe public url to download private files
   *
   * @param publicId The public id of the uploads to get
   * @param format The file format it was
   * @param mode Can be "view" or "download"
   * @returns {string} The 1-hour public url for viewing the file
   */
  private getPrivateSecureUrl(
    publicId: string,
    format: string,
    mode: 'download' | 'view' | 'model' = 'view',
    resourceType: cloudinary.UploadApiOptions['resource_type'] = 'auto',
  ): string {
    return cloudinary.v2.utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: 'private',
      attachment: mode === 'download' ? true : false,
      expires_at: Math.floor(Date.now()) / 1000 + PRIVATEUPLOAD_EXPIRY,
    });
  }
}
