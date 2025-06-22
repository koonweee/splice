import { ApiProperty } from '@nestjs/swagger';
import { GetTransactionsByAccountQuery } from '@splice/api';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetTransactionsByAccountDto implements Omit<GetTransactionsByAccountQuery, 'userId'> {
  @ApiProperty({ example: 'DBS Savings Account', description: 'The name of the account to get transactions for' })
  @IsString()
  @IsNotEmpty()
  declare accountName: string;
}
