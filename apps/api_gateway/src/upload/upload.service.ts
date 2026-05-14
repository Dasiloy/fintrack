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

/**
 * Service responsible for uploading and fetching files from Cloudinary
 *
 * @class UploadService
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

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
        resource_type: isPdf ? 'raw' : 'image',
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
}
