import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetTransactionsDto {
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
