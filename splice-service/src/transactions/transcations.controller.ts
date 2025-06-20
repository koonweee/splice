import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyType } from '@splice/api';
import { ApiKeyStoreService } from 'src/api-key-store/api-key-store.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { AuthGuard } from '../auth/auth.guard';

interface AuthenticatedRequest extends Request {
  jwt: {
    sub: string;
    [key: string]: any;
  };
}
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
    const authToken = await this.apiKeyStoreService.retrieveApiKey(userUuid, ApiKeyType.BITWARDEN, secret);
    return this.transactionsService.getTransactionsForAccount(accountName, authToken);
  }

  @Get('accounts')
  async getAccounts() {
    return this.transactionsService.getAccounts();
  }

  // @Get('generate-jwt')
  // async generateJwt() {
  //   return this.jwtService.signAsync({ userId: 'koonweee' });
  // }

  @Get('by-connection')
  @UseGuards(AuthGuard)
  async getByConnection(
    @Query('userId') userId: string,
    @Query('connectionId') connectionId: string,
    @Headers('X-Secret') secret: string,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!secret || !userId || !connectionId) {
      throw new BadRequestException('Missing required parameters');
    }

    // Validate user access
    if (userId !== req.jwt.sub) {
      throw new ForbiddenException("Access denied: cannot access another user's transactions");
    }

    const authToken = await this.apiKeyStoreService.retrieveApiKey(userId, ApiKeyType.BITWARDEN, secret);
    return this.transactionsService.getTransactionsByBankConnection(userId, connectionId, authToken);
  }

  @Get('secret')
  async getSecret(@Query('secretId') secretId: string) {
    return this.transactionsService.getSecret(secretId);
  }
}
