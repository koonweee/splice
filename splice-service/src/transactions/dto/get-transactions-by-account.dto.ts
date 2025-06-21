import { ApiProperty } from '@nestjs/swagger';
import { GetTransactionsByAccountQuery } from '@splice/api';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetTransactionsByAccountDto implements GetTransactionsByAccountQuery {
  @ApiProperty({ example: 'DBS Savings Account', description: 'The name of the account to get transactions for' })
  @IsString()
  @IsNotEmpty()
  declare accountName: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The UUID of the user' })
  @IsUUID()
  declare userUuid: string;
}
