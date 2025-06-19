import {
  Controller,
  Get,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiKeyType } from '@splice/api';
import { ApiKeyStoreService } from 'src/api-key-store/api-key-store.service';
import { TransactionsService } from 'src/transactions/transactions.service';
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly apiKeyStoreService: ApiKeyStoreService,
  ) {}

  @Get('by-account')
  async getByAccount(
    @Query('accountName') accountName: string,
    @Query('userUuid') userUuid: string,
    @Headers('X-Secret') secret: string,
  ) {
    if (!secret || !userUuid || !accountName) {
      throw new BadRequestException('Missing required parameters');
    }
    const authToken = await this.apiKeyStoreService.retrieveApiKey(
      userUuid,
      ApiKeyType.BITWARDEN,
      secret,
    );
    return this.transactionsService.getTransactionsForAccount(
      accountName,
      authToken,
    );
  }

  @Get('accounts')
  async getAccounts() {
    return this.transactionsService.getAccounts();
  }

  // @Get('generate-jwt')
  // async generateJwt() {
  //   return this.jwtService.signAsync({ userId: 'koonweee' });
  // }

  @Get('secret')
  async getSecret(@Query('secretId') secretId: string) {
    return this.transactionsService.getSecret(secretId);
  }
}
