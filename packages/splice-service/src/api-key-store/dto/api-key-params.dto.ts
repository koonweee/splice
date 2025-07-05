import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateApiKeyParams } from 'splice-api';

export class ApiKeyParamsDto implements CreateApiKeyParams {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The ID of the user' })
  @IsUUID()
  declare userId: string;
}
