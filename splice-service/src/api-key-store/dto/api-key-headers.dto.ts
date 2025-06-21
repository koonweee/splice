import { CreateApiKeyHeaders } from '@splice/api';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApiKeyHeadersDto implements CreateApiKeyHeaders {
  @IsString()
  @IsNotEmpty()
  declare 'X-Api-Key': string;
}
