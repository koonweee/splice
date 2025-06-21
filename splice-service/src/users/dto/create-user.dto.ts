import { CreateUserRequest } from '@splice/api';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto implements CreateUserRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  declare username: string;

  @IsEmail()
  @IsOptional()
  declare email?: string;
}
