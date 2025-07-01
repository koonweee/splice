import type { ApiKeyType } from './types';

export interface CreateApiKeyRequest {
  keyType: ApiKeyType;
  organisationId: string;
}

export interface CreateApiKeyParams {
  userId: string;
}

export interface CreateApiKeyHeaders {
  'X-Api-Key': string;
}
