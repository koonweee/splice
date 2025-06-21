import { Body, Controller, Headers, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiKeyStoreService } from './api-key-store.service';
import { ApiKeyHeadersDto, ApiKeyParamsDto, CreateApiKeyDto } from './dto';

@Controller('api-key-store')
export class ApiKeyStoreController {
  constructor(private readonly apiKeyStoreService: ApiKeyStoreService) {}

  @Post(':userUuid')
  async storeApiKey(
    @Param() params: ApiKeyParamsDto,
    @Headers() headers: ApiKeyHeadersDto,
    @Body() body: CreateApiKeyDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const secret = await this.apiKeyStoreService.storeApiKey(params.userUuid, headers['X-Api-Key'], body.keyType);
    response.set('X-Secret', secret);
  }
}
