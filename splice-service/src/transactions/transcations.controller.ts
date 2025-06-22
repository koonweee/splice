import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyType, User } from '@splice/api';
import { ApiKeyStoreService } from '../api-key-store/api-key-store.service';
import { AuthenticatedUser } from '../common/decorators';
import {
  GetSecretDto,
  GetTransactionsByAccountDto,
  GetTransactionsByConnectionDto,
  TransactionHeadersDto,
} from './dto';
import { TransactionsService } from './transactions.service';
@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly apiKeyStoreService: ApiKeyStoreService,
  ) {}

  @Get('by-account')
  @ApiOperation({ summary: 'Get transactions by account' })
  @ApiHeader({
    name: 'X-Secret',
    description: 'The secret returned when storing the API key',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'List of transactions for the account' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByAccount(
    @AuthenticatedUser() user: User,
    @Query() query: GetTransactionsByAccountDto,
    @Headers() headers: TransactionHeadersDto,
  ) {
    const secret = (headers as any)['x-secret'] || headers['X-Secret'];
    const authToken = await this.apiKeyStoreService.retrieveApiKey(user.id, ApiKeyType.BITWARDEN, secret);
    return this.transactionsService.getTransactionsForAccount(query.accountName, authToken);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get list of available accounts' })
  @ApiResponse({ status: 200, description: 'List of available accounts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAccounts() {
    return this.transactionsService.getAccounts();
  }

  @Get('by-connection')
  @ApiOperation({ summary: 'Get transactions by bank connection' })
  @ApiHeader({
    name: 'X-Secret',
    description: 'The secret returned when storing the API key',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'List of transactions for the bank connection' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByConnection(
    @AuthenticatedUser() user: User,
    @Query() query: GetTransactionsByConnectionDto,
    @Headers() headers: TransactionHeadersDto,
  ) {
    const secret = (headers as any)['x-secret'] || headers['X-Secret'];
    const authToken = await this.apiKeyStoreService.retrieveApiKey(user.id, ApiKeyType.BITWARDEN, secret);
    return this.transactionsService.getTransactionsByBankConnection(user.id, query.connectionId, authToken);
  }

  @Get('secret')
  @ApiOperation({ summary: 'Get secret by ID' })
  @ApiResponse({ status: 200, description: 'Secret retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Secret not found' })
  async getSecret(@Query() query: GetSecretDto) {
    return this.transactionsService.getSecret(query.secretId);
  }
}
