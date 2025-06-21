import { ApiProperty } from '@nestjs/swagger';
import { BankConnectionStatus, UpdateBankConnectionRequest } from '@splice/api';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateBankConnectionDto implements UpdateBankConnectionRequest {
  @ApiProperty({
    example: 'My Updated DBS Account',
    description: 'Optional alias for the bank connection',
    required: false,
  })
  @IsString()
  @IsOptional()
  declare alias?: string;

  @ApiProperty({
    enum: BankConnectionStatus,
    example: BankConnectionStatus.ACTIVE,
    description: 'The status of the bank connection',
    required: false,
  })
  @IsEnum(BankConnectionStatus)
  @IsOptional()
  declare status?: BankConnectionStatus;
}
