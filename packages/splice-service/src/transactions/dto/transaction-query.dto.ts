import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransactionQueryParams } from 'splice-api';

export class TransactionQueryDto implements TransactionQueryParams {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Filter by account ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  declare accountId?: string;

  @ApiProperty({ example: '2023-01-01', description: 'Start date for filtering', required: false })
  @IsOptional()
  @IsString()
  declare startDate?: string;

  @ApiProperty({ example: '2023-12-31', description: 'End date for filtering', required: false })
  @IsOptional()
  @IsString()
  declare endDate?: string;

  @ApiProperty({ example: false, description: 'Filter by pending status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  declare pending?: boolean;

  @ApiProperty({ example: 50, description: 'Number of results to return', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  declare limit?: number;

  @ApiProperty({ example: 0, description: 'Number of results to skip', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  declare offset?: number;
}
