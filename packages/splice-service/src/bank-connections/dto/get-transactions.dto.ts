import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { GetTransactionsQuery } from 'splice-api';

export class GetTransactionsDto implements GetTransactionsQuery {
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

  @ApiProperty({
    example: '1234567890',
    description: 'Account ID for transaction filtering',
    required: false,
  })
  @IsOptional()
  declare accountId?: string;
}
