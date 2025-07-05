import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyType, CreateApiKeyRequest } from 'splice-api';
import { IsEnum, IsUUID } from 'class-validator';

export class CreateApiKeyDto implements CreateApiKeyRequest {
  @ApiProperty({ enum: ApiKeyType, example: ApiKeyType.BITWARDEN, description: 'The type of API key to store' })
  @IsEnum(ApiKeyType)
  declare keyType: ApiKeyType;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The organisation ID (UUID)',
  })
  @IsUUID()
  declare organisationId: string;
}
