import { BaseInterface } from '../common/base.types';

export enum ApiKeyType {
  BITWARDEN = 'BITWARDEN',
}

export interface ApiKeyStore extends BaseInterface {
  uuid: string;
  userUuid: string;
  keyType: ApiKeyType;
  encryptedKey: string;
}
