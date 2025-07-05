import { Body, Controller, Headers, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from 'splice-api';
import type { Response } from 'express';
import { AuthenticatedUser } from '../common/decorators';
import { ApiKeyStoreService } from './api-key-store.service';
import { ApiKeyHeadersDto, CreateApiKeyDto } from './dto';

@ApiTags('api-keys')
@Controller('api-key-store')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ApiKeyStoreController {
  constructor(private readonly apiKeyStoreService: ApiKeyStoreService) {}

  @Post()
  @ApiOperation({ summary: 'Store encrypted API key for user' })
  @ApiHeader({ name: 'X-Api-Key', description: 'The API key to encrypt and store', required: true })
  @ApiResponse({ status: 201, description: 'API key stored successfully. Secret returned in X-Secret header.' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async storeApiKey(
    @AuthenticatedUser() user: User,
    @Headers() headers: ApiKeyHeadersDto,
    @Body() body: CreateApiKeyDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const apiKey = headers['X-Api-Key'] || (headers as any)['x-api-key'];
    const secret = await this.apiKeyStoreService.storeApiKey(user.id, apiKey, body.keyType, body.organisationId);
    response.set('X-Secret', secret);
  }
}
