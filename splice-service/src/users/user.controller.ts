import { Body, Controller, ForbiddenException, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UserParamsDto } from './dto';
import type { User } from './user.entity';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<{ user: User; apiKey: string }> {
    return await this.userService.create(createUserDto.username, createUserDto.email);
  }

  @Post(':uuid/revoke-api-keys')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all API keys for a user' })
  @ApiResponse({ status: 200, description: 'API keys revoked successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async revokeApiKeys(@Param() params: UserParamsDto, @Request() req: { user: User }): Promise<{ message: string }> {
    if (req.user.uuid !== params.uuid) {
      throw new ForbiddenException('You can only revoke your own API keys');
    }

    await this.userService.revokeAllApiKeys(params.uuid);
    return { message: 'API keys revoked successfully' };
  }
}
