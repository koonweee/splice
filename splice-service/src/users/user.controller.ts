import { Body, Controller, Post } from '@nestjs/common';
import type { User } from './user.entity';
import type { UserService } from './user.service';

class CreateUserDto {
  username: string;
  email?: string;
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.userService.create(createUserDto.username, createUserDto.email);
  }
}
