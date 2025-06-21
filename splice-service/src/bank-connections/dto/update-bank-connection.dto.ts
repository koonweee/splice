import { BankConnectionStatus, UpdateBankConnectionRequest } from '@splice/api';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateBankConnectionDto implements UpdateBankConnectionRequest {
  @IsString()
  @IsOptional()
  declare alias?: string;

  @IsEnum(BankConnectionStatus)
  @IsOptional()
  declare status?: BankConnectionStatus;
}
