import { Body, Controller, ForbiddenException, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import type { User } from './user.entity';
import { UserService } from './user.service';

class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<{ user: User; apiKey: string }> {
    return await this.userService.create(createUserDto.username, createUserDto.email);
  }

  @Post(':uuid/revoke-api-keys')
  @UseGuards(AuthGuard('jwt'))
  async revokeApiKeys(@Param('uuid') uuid: string, @Request() req: { user: User }): Promise<{ message: string }> {
    if (req.user.uuid !== uuid) {
      throw new ForbiddenException('You can only revoke your own API keys');
    }

    await this.userService.revokeAllApiKeys(uuid);
    return { message: 'API keys revoked successfully' };
  }
}
