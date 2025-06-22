import type { ApiKeyType } from './types';

export interface CreateApiKeyRequest {
  keyType: ApiKeyType;
}

export interface CreateApiKeyParams {
  userId: string;
}

export interface CreateApiKeyHeaders {
  'X-Api-Key': string;
}
