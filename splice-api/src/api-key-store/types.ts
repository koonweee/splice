import type { BaseInterface } from '../common/base.types';

export enum ApiKeyType {
  BITWARDEN = 'BITWARDEN',
}

export interface ApiKeyStore extends BaseInterface {
  userId: string;
  keyType: ApiKeyType;
  encryptedKey: string;
}
