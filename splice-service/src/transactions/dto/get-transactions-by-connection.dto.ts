import { ApiProperty } from '@nestjs/swagger';
import { GetTransactionsByConnectionQuery } from '@splice/api';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetTransactionsByConnectionDto implements Omit<GetTransactionsByConnectionQuery, 'userId'> {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'The ID of the bank connection' })
  @IsUUID()
  declare connectionId: string;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Start date for transaction filtering (ISO 8601 date string)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  declare startDate?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'End date for transaction filtering (ISO 8601 date string)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  declare endDate?: string;
}
