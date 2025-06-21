import { CreateApiKeyParams } from '@splice/api';
import { IsUUID } from 'class-validator';

export class ApiKeyParamsDto implements CreateApiKeyParams {
  @IsUUID()
  declare userUuid: string;
}
