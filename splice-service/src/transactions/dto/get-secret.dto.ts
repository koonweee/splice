import { GetSecretQuery } from '@splice/api';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetSecretDto implements GetSecretQuery {
  @IsString()
  @IsNotEmpty()
  declare secretId: string;
}
