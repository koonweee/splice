import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Headers,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ApiKeyStoreService } from './api-key-store.service';
import { ApiKeyType } from './api-key-store.entity';
import { Response } from 'express';

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
    const secret = await this.apiKeyStoreService.storeApiKey(
      userUuid,
      apiKey,
      keyType,
    );
    response.set('X-Secret', secret);
  }
}
