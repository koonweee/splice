import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { User } from 'splice-api';
import { AuthenticatedUser } from '../common/decorators';
import { CreateUserDto } from './dto';
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

  @Post('revoke-api-keys')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all API keys for authenticated user' })
  @ApiResponse({ status: 200, description: 'API keys revoked successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async revokeApiKeys(@AuthenticatedUser() user: User): Promise<{ message: string }> {
    await this.userService.revokeAllApiKeys(user.id);
    return { message: 'API keys revoked successfully' };
  }
}
