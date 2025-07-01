import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyType, BankConnectionResponse, BankConnectionStatus, StandardizedAccount, User } from '@splice/api';
import { ApiKeyStoreService } from '../api-key-store/api-key-store.service';
import { AuthenticatedUser } from '../common/decorators';
import { DataSourceManager } from '../data-sources/manager/data-source-manager.service';
import { BankConnectionService } from './bank-connection.service';
import { BankConnectionByIdParamsDto, CreateBankConnectionDto, UpdateBankConnectionDto } from './dto';

@ApiTags('bank-connections')
@Controller('users/banks')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BankConnectionController {
  constructor(
    private readonly bankConnectionService: BankConnectionService,
    private readonly dataSourceManager: DataSourceManager,
    private readonly apiKeyStoreService: ApiKeyStoreService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all bank connections for a user' })
  @ApiResponse({ status: 200, description: 'List of bank connections' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserBankConnections(@AuthenticatedUser() user: User): Promise<BankConnectionResponse[]> {
    const connections = await this.bankConnectionService.findByUserId(user.id);

    return connections.map((connection) => ({
      id: connection.id,
      bankId: connection.bankId,
      bankName: connection.bank.name,
      bankLogoUrl: connection.bank.logoUrl,
      sourceType: connection.bank.sourceType,
      status: connection.status,
      alias: connection.alias,
      lastSync: connection.lastSync,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    }));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new bank connection' })
  @ApiResponse({ status: 201, description: 'Bank connection created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBankConnection(
    @AuthenticatedUser() user: User,
    @Body() createRequest: CreateBankConnectionDto,
  ): Promise<BankConnectionResponse> {
    const connection = await this.bankConnectionService.create(user.id, createRequest);

    if (!connection) {
      throw new HttpException('Bank connection could not be created', 400);
    }

    return {
      id: connection.id,
      bankId: connection.bankId,
      bankName: connection.bank.name,
      bankLogoUrl: connection.bank.logoUrl,
      sourceType: connection.bank.sourceType,
      status: connection.status,
      alias: connection.alias,
      lastSync: connection.lastSync,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  @Put(':connectionId')
  @ApiOperation({ summary: 'Update an existing bank connection' })
  @ApiResponse({ status: 200, description: 'Bank connection updated successfully' })
  @ApiResponse({ status: 404, description: 'Bank connection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateBankConnection(
    @AuthenticatedUser() user: User,
    @Param() params: BankConnectionByIdParamsDto,
    @Body() updateRequest: UpdateBankConnectionDto,
  ): Promise<BankConnectionResponse> {
    const connection = await this.bankConnectionService.update(user.id, params.connectionId, updateRequest);

    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }

    return {
      id: connection.id,
      bankId: connection.bankId,
      bankName: connection.bank.name,
      bankLogoUrl: connection.bank.logoUrl,
      sourceType: connection.bank.sourceType,
      status: connection.status,
      alias: connection.alias,
      lastSync: connection.lastSync,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  @Delete(':connectionId')
  @ApiOperation({ summary: 'Delete a bank connection' })
  @ApiResponse({ status: 200, description: 'Bank connection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bank connection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteBankConnection(
    @AuthenticatedUser() user: User,
    @Param() params: BankConnectionByIdParamsDto,
  ): Promise<void> {
    await this.bankConnectionService.delete(user.id, params.connectionId);
  }

  @Get(':connectionId/status')
  @ApiOperation({ summary: 'Get bank connection status' })
  @ApiResponse({ status: 200, description: 'Bank connection status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bank connection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBankConnectionStatus(
    @AuthenticatedUser() user: User,
    @Param() params: BankConnectionByIdParamsDto,
  ): Promise<{ status: BankConnectionStatus; lastSync?: Date }> {
    const connection = await this.bankConnectionService.findByUserIdAndConnectionId(user.id, params.connectionId);
    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }

    return {
      status: connection.status,
      lastSync: connection.lastSync,
    };
  }

  @Get(':connectionId/accounts')
  @ApiOperation({ summary: 'Get accounts for a bank connection' })
  @ApiHeader({
    name: 'X-Secret',
    description: 'The secret returned when storing the API key (vault access token)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'List of accounts for the bank connection',
  })
  @ApiResponse({ status: 404, description: 'Bank connection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBankConnectionAccounts(
    @AuthenticatedUser() user: User,
    @Param() params: BankConnectionByIdParamsDto,
    @Headers() headers: { 'X-Secret'?: string; 'x-secret'?: string },
  ): Promise<StandardizedAccount[]> {
    const connection = await this.bankConnectionService.findByUserIdAndConnectionId(user.id, params.connectionId);
    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }

    // Extract and decrypt the vault access token
    const secret = headers['X-Secret'] || headers['x-secret'];
    if (!secret) {
      throw new HttpException('X-Secret header is required', 400);
    }

    const vaultAccessToken = await this.apiKeyStoreService.retrieveApiKey(user.id, ApiKeyType.BITWARDEN, secret);

    return this.dataSourceManager.fetchAccounts(connection, vaultAccessToken);
  }
}
