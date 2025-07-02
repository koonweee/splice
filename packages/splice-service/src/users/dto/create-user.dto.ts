import { ApiProperty } from '@nestjs/swagger';
import { CreateUserRequest } from '@splice/api';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto implements CreateUserRequest {
  @ApiProperty({ example: 'testuser', description: 'The username of the user' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  declare username: string;

  @ApiProperty({ example: 'user@example.com', description: 'The email of the user', required: false })
  @IsEmail()
  @IsOptional()
  declare email?: string;
}
