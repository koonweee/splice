import { BadRequestException, Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyType } from '@splice/api';
import { ApiKeyStoreService } from 'src/api-key-store/api-key-store.service';
import { TransactionsService } from 'src/transactions/transactions.service';
@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
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
    const authToken = await this.apiKeyStoreService.retrieveApiKey(userUuid, ApiKeyType.BITWARDEN, secret);
    return this.transactionsService.getTransactionsForAccount(accountName, authToken);
  }

  @Get('accounts')
  async getAccounts() {
    return this.transactionsService.getAccounts();
  }

  @Get('by-connection')
  async getByConnection(
    @Query('userId') userId: string,
    @Query('connectionId') connectionId: string,
    @Headers('X-Secret') secret: string,
  ) {
    if (!secret || !userId || !connectionId) {
      throw new BadRequestException('Missing required parameters');
    }

    const authToken = await this.apiKeyStoreService.retrieveApiKey(userId, ApiKeyType.BITWARDEN, secret);
    return this.transactionsService.getTransactionsByBankConnection(userId, connectionId, authToken);
  }

  @Get('secret')
  async getSecret(@Query('secretId') secretId: string) {
    return this.transactionsService.getSecret(secretId);
  }
}
