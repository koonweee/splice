import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UpdateTransactionRequest } from 'splice-api';

class TransactionCategoryDto {
  @ApiProperty({ example: 'Food and Drink', description: 'Primary category' })
  @IsString()
  declare primary: string;

  @ApiProperty({ example: 'Restaurants', description: 'Detailed category', required: false })
  @IsOptional()
  @IsString()
  declare detailed?: string;

  @ApiProperty({ example: 'VERY_HIGH', description: 'Confidence level', required: false })
  @IsOptional()
  @IsString()
  declare confidenceLevel?: string;
}

export class UpdateTransactionDto implements UpdateTransactionRequest {
  @ApiProperty({ example: 25.5, description: 'Transaction amount', required: false })
  @IsOptional()
  @IsNumber()
  declare amount?: number;

  @ApiProperty({ example: 'USD', description: 'ISO currency code', required: false })
  @IsOptional()
  @IsString()
  declare isoCurrencyCode?: string;

  @ApiProperty({ example: 'BTC', description: 'Unofficial currency code', required: false })
  @IsOptional()
  @IsString()
  declare unofficialCurrencyCode?: string;

  @ApiProperty({ type: TransactionCategoryDto, description: 'Transaction category', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionCategoryDto)
  declare category?: TransactionCategoryDto;

  @ApiProperty({ example: '2023-01-01', description: 'Transaction date', required: false })
  @IsOptional()
  @IsString()
  declare date?: string;

  @ApiProperty({ example: 'Starbucks Coffee', description: 'Transaction name', required: false })
  @IsOptional()
  @IsString()
  declare name?: string;

  @ApiProperty({ example: false, description: 'Whether transaction is pending', required: false })
  @IsOptional()
  @IsBoolean()
  declare pending?: boolean;

  @ApiProperty({ example: 'https://logo.url', description: 'Merchant logo URL', required: false })
  @IsOptional()
  @IsString()
  declare logoUrl?: string;

  @ApiProperty({ example: 'https://website.url', description: 'Merchant website URL', required: false })
  @IsOptional()
  @IsString()
  declare websiteUrl?: string;
}
