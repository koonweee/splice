import { ApiKeyType, CreateApiKeyRequest } from '@splice/api';
import { IsEnum } from 'class-validator';

export class CreateApiKeyDto implements CreateApiKeyRequest {
  @IsEnum(ApiKeyType)
  declare keyType: ApiKeyType;
}
