import { ApiProperty } from '@nestjs/swagger';
import { TransactionHeaders } from '@splice/api';
import { IsNotEmpty, IsString } from 'class-validator';

export class TransactionHeadersDto implements TransactionHeaders {
  @ApiProperty({ example: 'secret_abc123xyz789', description: 'The secret returned when storing the API key' })
  @IsString()
  @IsNotEmpty()
  declare 'X-Secret': string;
}
