import { SetMetadata } from '@nestjs/common';

import { TokenPayload } from '@fintrack/types/interfaces/token_payload';

export const TokenMetaKey = 'Token_Key';
export const TokenMeta = (value: TokenPayload['type']) =>
  SetMetadata(TokenMetaKey, value);
