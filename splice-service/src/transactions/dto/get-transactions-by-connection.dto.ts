import { GetTransactionsByConnectionQuery } from '@splice/api';
import { IsUUID } from 'class-validator';

export class GetTransactionsByConnectionDto implements GetTransactionsByConnectionQuery {
  @IsUUID()
  declare userId: string;

  @IsUUID()
  declare connectionId: string;
}
