import { ApiProperty } from '@nestjs/swagger';
import { GetTransactionsByConnectionQuery } from '@splice/api';
import { IsUUID } from 'class-validator';

export class GetTransactionsByConnectionDto implements Omit<GetTransactionsByConnectionQuery, 'userId'> {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'The ID of the bank connection' })
  @IsUUID()
  declare connectionId: string;
}
