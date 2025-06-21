import { CreateBankConnectionRequest } from '@splice/api';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBankConnectionDto implements CreateBankConnectionRequest {
  @IsString()
  @IsNotEmpty()
  declare bankId: string;

  @IsString()
  @IsOptional()
  declare alias?: string;

  @IsUUID()
  declare authDetailsUuid: string;
}
