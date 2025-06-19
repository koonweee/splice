import { BadRequestException, Body, Controller, Headers, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { ApiKeyType } from './api-key-store.entity';
import type { ApiKeyStoreService } from './api-key-store.service';

@Controller('api-key-store')
export class ApiKeyStoreController {
  constructor(private readonly apiKeyStoreService: ApiKeyStoreService) {}

  @Post(':userUuid')
  async storeApiKey(
    @Param('userUuid') userUuid: string,
    @Headers('X-Api-Key') apiKey: string,
    @Body('keyType') keyType: ApiKeyType,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (!apiKey) {
      throw new BadRequestException('API key not provided');
    }
    const secret = await this.apiKeyStoreService.storeApiKey(userUuid, apiKey, keyType);
    response.set('X-Secret', secret);
  }
}
