import { Body, Controller, Headers, Param, Post, Res } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiKeyStoreService } from './api-key-store.service';
import { ApiKeyHeadersDto, ApiKeyParamsDto, CreateApiKeyDto } from './dto';

@ApiTags('api-keys')
@Controller('api-key-store')
export class ApiKeyStoreController {
  constructor(private readonly apiKeyStoreService: ApiKeyStoreService) {}

  @Post(':userId')
  @ApiOperation({ summary: 'Store encrypted API key for user' })
  @ApiHeader({ name: 'X-Api-Key', description: 'The API key to encrypt and store', required: true })
  @ApiResponse({ status: 201, description: 'API key stored successfully. Secret returned in X-Secret header.' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async storeApiKey(
    @Param() params: ApiKeyParamsDto,
    @Headers() headers: ApiKeyHeadersDto,
    @Body() body: CreateApiKeyDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const secret = await this.apiKeyStoreService.storeApiKey(params.userId, headers['X-Api-Key'], body.keyType);
    response.set('X-Secret', secret);
  }
}
