import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyType, CreateApiKeyRequest } from '@splice/api';
import { IsEnum } from 'class-validator';

export class CreateApiKeyDto implements CreateApiKeyRequest {
  @ApiProperty({ enum: ApiKeyType, example: ApiKeyType.BITWARDEN, description: 'The type of API key to store' })
  @IsEnum(ApiKeyType)
  declare keyType: ApiKeyType;
}
