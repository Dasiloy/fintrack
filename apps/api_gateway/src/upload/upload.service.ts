import * as cloudinary from 'cloudinary';

import { Readable } from 'stream';

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { type User } from '@fintrack/database/types';
import { PrismaService } from '@fintrack/database/service';

/**
 * Service responsible for uploading and fetching files from Cloudinary
 *
 * @class UploadService
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly prisma: PrismaService) {
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
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Failed to upload profile image');
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
      const streamPipieLine = cloudinary.v2.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error('Failed to upload file'));
        },
      );
      Readable.from(buffer).pipe(streamPipieLine);
    });
  }
}
