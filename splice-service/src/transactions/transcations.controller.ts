import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyType } from '@splice/api';
import { ApiKeyStoreService } from 'src/api-key-store/api-key-store.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import {
  GetSecretDto,
  GetTransactionsByAccountDto,
  GetTransactionsByConnectionDto,
  TransactionHeadersDto,
} from './dto';
@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly apiKeyStoreService: ApiKeyStoreService,
  ) {}

  @Get('by-account')
  async getByAccount(@Query() query: GetTransactionsByAccountDto, @Headers() headers: TransactionHeadersDto) {
    const authToken = await this.apiKeyStoreService.retrieveApiKey(
      query.userUuid,
      ApiKeyType.BITWARDEN,
      headers['X-Secret'],
    );
    return this.transactionsService.getTransactionsForAccount(query.accountName, authToken);
  }

  @Get('accounts')
  async getAccounts() {
    return this.transactionsService.getAccounts();
  }

  @Get('by-connection')
  async getByConnection(@Query() query: GetTransactionsByConnectionDto, @Headers() headers: TransactionHeadersDto) {
    const authToken = await this.apiKeyStoreService.retrieveApiKey(
      query.userId,
      ApiKeyType.BITWARDEN,
      headers['X-Secret'],
    );
    return this.transactionsService.getTransactionsByBankConnection(query.userId, query.connectionId, authToken);
  }

  @Get('secret')
  async getSecret(@Query() query: GetSecretDto) {
    return this.transactionsService.getSecret(query.secretId);
  }
}
