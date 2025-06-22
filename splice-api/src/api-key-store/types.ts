export enum ApiKeyType {
  BITWARDEN = 'BITWARDEN',
}

export interface ApiKeyStore {
  uuid: string;
  userUuid: string;
  keyType: ApiKeyType;
  encryptedKey: string;
  createdAt: Date;
  updatedAt: Date;
}
