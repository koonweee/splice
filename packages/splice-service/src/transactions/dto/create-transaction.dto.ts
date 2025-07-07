import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { CreateTransactionRequest } from 'splice-api';

class TransactionCategoryDto {
  @ApiProperty({ example: 'Food and Drink', description: 'Primary category' })
  @IsString()
  @IsNotEmpty()
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

export class CreateTransactionDto implements CreateTransactionRequest {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Account ID' })
  @IsUUID()
  declare accountId: string;

  @ApiProperty({ example: 'plaid_transaction_123', description: 'Provider transaction ID' })
  @IsString()
  @IsNotEmpty()
  declare providerTransactionId: string;

  @ApiProperty({ example: 'plaid_account_123', description: 'Provider account ID' })
  @IsString()
  @IsNotEmpty()
  declare providerAccountId: string;

  @ApiProperty({ example: 25.5, description: 'Transaction amount' })
  @IsNumber()
  declare amount: number;

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

  @ApiProperty({ example: '2023-01-01', description: 'Transaction date' })
  @IsString()
  @IsNotEmpty()
  declare date: string;

  @ApiProperty({ example: 'Starbucks Coffee', description: 'Transaction name' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiProperty({ example: false, description: 'Whether transaction is pending' })
  @IsBoolean()
  declare pending: boolean;

  @ApiProperty({ example: 'https://logo.url', description: 'Merchant logo URL', required: false })
  @IsOptional()
  @IsString()
  declare logoUrl?: string;

  @ApiProperty({ example: 'https://website.url', description: 'Merchant website URL', required: false })
  @IsOptional()
  @IsString()
  declare websiteUrl?: string;
}
