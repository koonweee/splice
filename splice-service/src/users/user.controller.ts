import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';

class CreateUserDto {
  username: string;
  email?: string;
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.userService.create(
      createUserDto.username,
      createUserDto.email,
    );
  }
}
