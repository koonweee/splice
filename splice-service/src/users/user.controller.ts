import { Body, Controller, ForbiddenException, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto, UserParamsDto } from './dto';
import type { User } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<{ user: User; apiKey: string }> {
    return await this.userService.create(createUserDto.username, createUserDto.email);
  }

  @Post(':uuid/revoke-api-keys')
  @UseGuards(AuthGuard('jwt'))
  async revokeApiKeys(@Param() params: UserParamsDto, @Request() req: { user: User }): Promise<{ message: string }> {
    if (req.user.uuid !== params.uuid) {
      throw new ForbiddenException('You can only revoke your own API keys');
    }

    await this.userService.revokeAllApiKeys(params.uuid);
    return { message: 'API keys revoked successfully' };
  }
}
