import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { UpdateAccountRequest } from 'splice-api';

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

export class UpdateAccountDto implements UpdateAccountRequest {
  @ApiProperty({ example: 'My Updated Account', description: 'Account name', required: false })
  @IsOptional()
  @IsString()
  declare name?: string;

  @ApiProperty({ type: AccountBalancesDto, description: 'Account balances', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccountBalancesDto)
  declare balances?: AccountBalancesDto;

  @ApiProperty({ example: '1234', description: 'Account mask', required: false })
  @IsOptional()
  @IsString()
  declare mask?: string;
}
