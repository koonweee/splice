import { ApiProperty } from '@nestjs/swagger';
import { CreateApiKeyHeaders } from 'splice-api';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApiKeyHeadersDto implements CreateApiKeyHeaders {
  @ApiProperty({ example: 'bw_api_key_123456789', description: 'The API key to encrypt and store' })
  @IsString()
  @IsNotEmpty()
  declare 'X-Api-Key': string;
}
