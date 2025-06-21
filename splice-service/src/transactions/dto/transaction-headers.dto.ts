import { TransactionHeaders } from '@splice/api';
import { IsNotEmpty, IsString } from 'class-validator';

export class TransactionHeadersDto implements TransactionHeaders {
  @IsString()
  @IsNotEmpty()
  declare 'X-Secret': string;
}
