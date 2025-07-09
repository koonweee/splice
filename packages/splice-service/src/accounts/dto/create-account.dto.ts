import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { CreateAccountRequest } from 'splice-api';

class AccountBalancesDto {
  @ApiProperty({ example: 1500.5, description: 'Current balance', required: false })
  @IsOptional()
  current?: number;

  @ApiProperty({ example: 1400.25, description: 'Available balance', required: false })
  @IsOptional()
  available?: number;

  @ApiProperty({ example: 'USD', description: 'ISO currency code', required: false })
  @IsOptional()
  @IsString()
  isoCurrencyCode?: string;

  @ApiProperty({ example: 'BTC', description: 'Unofficial currency code', required: false })
  @IsOptional()
  @IsString()
  unofficialCurrencyCode?: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Last updated timestamp', required: false })
  @IsOptional()
  @IsString()
  lastUpdated?: string;
}

class AccountTypeDto {
  @ApiProperty({ example: 'DEPOSITORY', description: 'Account type' })
  @IsString()
  @IsNotEmpty()
  declare type: string;

  @ApiProperty({ example: 'CHECKING', description: 'Account subtype', required: false })
  @IsOptional()
  @IsString()
  declare subtype?: string;
}

export class CreateAccountDto implements CreateAccountRequest {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Bank connection ID' })
  @IsUUID()
  declare bankConnectionId: string;

  @ApiProperty({ example: 'plaid_account_123', description: 'Provider account ID' })
  @IsString()
  @IsNotEmpty()
  declare providerAccountId: string;

  @ApiProperty({ example: 'My Checking Account', description: 'Account name' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiProperty({ type: AccountTypeDto, description: 'Account type information' })
  @ValidateNested()
  @Type(() => AccountTypeDto)
  declare type: AccountTypeDto;

  @ApiProperty({ type: AccountBalancesDto, description: 'Account balances' })
  @ValidateNested()
  @Type(() => AccountBalancesDto)
  declare balances: AccountBalancesDto;

  @ApiProperty({ example: '1234', description: 'Account mask', required: false })
  @IsOptional()
  @IsString()
  declare mask?: string;
}
