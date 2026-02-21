import { SetMetadata } from '@nestjs/common';

export const PublicMetaKey = 'isPublic';
export const PublicMeta = () => SetMetadata(PublicMetaKey, true);
