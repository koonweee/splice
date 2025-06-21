import { BankConnectionByIdParams, BankConnectionParams } from '@splice/api';
import { IsUUID } from 'class-validator';

export class BankConnectionParamsDto implements BankConnectionParams {
  @IsUUID()
  declare userId: string;
}

export class BankConnectionByIdParamsDto implements BankConnectionByIdParams {
  @IsUUID()
  declare userId: string;

  @IsUUID()
  declare connectionId: string;
}
