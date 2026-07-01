import { Writable } from 'stream';

import * as cloudinary from 'cloudinary';

import { UploadService } from './upload.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    utils: {
      private_download_url: jest.fn(),
    },
  },
}));

jest.mock('@fintrack/database/types', () => ({
  OCRDraftStatus: {
    PENDING: 'PENDING',
  },
}));

jest.mock('@fintrack/database/service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../user/user.service', () => ({
  UserService: class UserService {},
}));

jest.mock('../transaction/transaction.service', () => ({
  TransactionService: class TransactionService {},
}));

jest.mock('../usage/usage.service', () => ({
  UsageService: class UsageService {},
}));

jest.mock('@fintrack/types/constants/file.constants', () => ({
  ADVISOR_FILE_MAX_SIZE: 1024 * 1024,
  ADVISOR_FILE_MIME_TYPES: [
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
  ],
}));

jest.mock('@fintrack/types/constants/upload.constants', () => ({
  PRIVATEUPLOAD_EXPIRY: 3600,
}));

describe('UploadService advisor Cloudinary uploads', () => {
  const uploadStream = cloudinary.v2.uploader
    .upload_stream as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    uploadStream.mockImplementation((options, callback) => {
      const chunks: Buffer[] = [];
      return new Writable({
        write(chunk, _encoding, done) {
          chunks.push(Buffer.from(chunk));
          done();
        },
        final(done) {
          callback(null, {
            public_id: options.public_id,
            secure_url: 'https://res.cloudinary.com/demo/raw/private/file.csv',
            bytes: Buffer.concat(chunks).length,
          });
          done();
        },
      });
    });
  });

  it('uploads CSV advisor files as raw resources without using raw as a format', async () => {
    const service = new UploadService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.uploadAdvisorFile(
      { id: 'user-1' } as never,
      {
        buffer: Buffer.from('date,amount\n2026-06-29,100'),
        mimetype: 'text/csv',
        originalname: 'statement.csv',
        size: 29,
      } as Express.Multer.File,
    );

    expect(result.format).toBe('csv');
    expect(uploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        resource_type: 'raw',
        type: 'private',
        public_id: 'fintrack/advisor/user-1/statement.csv',
      }),
      expect.any(Function),
    );
    expect(uploadStream.mock.calls[0][0]).not.toHaveProperty('format', 'raw');
  });
});
