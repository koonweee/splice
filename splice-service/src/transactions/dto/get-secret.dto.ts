import { ApiProperty } from '@nestjs/swagger';
import { GetSecretQuery } from '@splice/api';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetSecretDto implements GetSecretQuery {
  @ApiProperty({ example: 'secret_123', description: 'The ID of the secret to retrieve' })
  @IsString()
  @IsNotEmpty()
  declare secretId: string;
}
