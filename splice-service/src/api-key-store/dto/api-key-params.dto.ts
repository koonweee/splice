import { ApiProperty } from '@nestjs/swagger';
import { CreateApiKeyParams } from '@splice/api';
import { IsUUID } from 'class-validator';

export class ApiKeyParamsDto implements CreateApiKeyParams {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The ID of the user' })
  @IsUUID()
  declare userId: string;
}
