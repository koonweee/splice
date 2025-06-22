import { ApiProperty } from '@nestjs/swagger';
import { CreateBankConnectionRequest } from '@splice/api';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBankConnectionDto implements CreateBankConnectionRequest {
  @ApiProperty({ example: 'dbs', description: 'The ID of the bank to connect to' })
  @IsString()
  @IsNotEmpty()
  declare bankId: string;

  @ApiProperty({ example: 'My DBS Account', description: 'Optional alias for the bank connection', required: false })
  @IsString()
  @IsOptional()
  declare alias?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the stored authentication details',
  })
  @IsUUID()
  declare authDetailsUuid: string;
}
