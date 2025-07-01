import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyType, StandardizedTransaction, User } from '@splice/api';
import { ApiKeyStoreService } from '../api-key-store/api-key-store.service';
import { AuthenticatedUser } from '../common/decorators';
import { GetTransactionsByConnectionDto, TransactionHeadersDto } from './dto';
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

  @Get('by-connection')
  @ApiOperation({ summary: 'Get standardized transactions by bank connection' })
  @ApiHeader({
    name: 'X-Secret',
    description: 'The secret returned when storing the API key',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'List of standardized transactions for the bank connection',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bank connection not found' })
  async getByConnection(
    @AuthenticatedUser() user: User,
    @Query() query: GetTransactionsByConnectionDto,
    @Headers() headers: TransactionHeadersDto,
  ): Promise<StandardizedTransaction[]> {
    const secret = headers['X-Secret'] || (headers as any)['x-secret'];
    const authToken = await this.apiKeyStoreService.retrieveApiKey(user.id, ApiKeyType.BITWARDEN, secret);

    // Parse optional date parameters
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.transactionsService.getTransactionsByBankConnection(
      user.id,
      query.connectionId,
      authToken,
      startDate,
      endDate,
    );
  }
}
