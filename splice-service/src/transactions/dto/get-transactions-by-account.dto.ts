import { GetTransactionsByAccountQuery } from '@splice/api';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetTransactionsByAccountDto implements GetTransactionsByAccountQuery {
  @IsString()
  @IsNotEmpty()
  declare accountName: string;

  @IsUUID()
  declare userUuid: string;
}
