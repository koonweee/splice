import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { TransactionByIdParams } from 'splice-api';

export class TransactionByIdParamsDto implements TransactionByIdParams {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'The ID of the transaction' })
  @IsUUID()
  declare transactionId: string;
}
