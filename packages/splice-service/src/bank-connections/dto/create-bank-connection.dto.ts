import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateBankConnectionRequest } from 'splice-api';

export class CreateBankConnectionDto implements CreateBankConnectionRequest {
  @ApiProperty({ example: 'dbs', description: 'The ID of the bank to connect to' })
  @IsString()
  @IsNotEmpty()
  declare bankId: string;

  @ApiProperty({ example: 'My DBS Account', description: 'Optional alias for the bank connection', required: false })
  @IsString()
  @IsOptional()
  declare alias?: string;
}
