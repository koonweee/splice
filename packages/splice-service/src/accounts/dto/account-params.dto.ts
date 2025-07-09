import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { AccountByIdParams } from 'splice-api';

export class AccountByIdParamsDto implements AccountByIdParams {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'The ID of the account' })
  @IsUUID()
  declare accountId: string;
}
