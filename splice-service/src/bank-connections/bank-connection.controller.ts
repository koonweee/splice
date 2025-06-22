import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BankConnectionResponse, BankConnectionStatus, User } from '@splice/api';
import { AuthenticatedUser } from '../common/decorators';
import { BankConnectionService } from './bank-connection.service';
import { BankConnectionByIdParamsDto, CreateBankConnectionDto, UpdateBankConnectionDto } from './dto';

@ApiTags('bank-connections')
@Controller('users/:userId/banks')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BankConnectionController {
  constructor(private readonly bankConnectionService: BankConnectionService) {}

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
    @Param() params: BankConnectionParamsDto,
    @Body() createRequest: CreateBankConnectionDto,
  ): Promise<BankConnectionResponse> {
    const connection = await this.bankConnectionService.create(params.userId, createRequest);

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
    @Param() params: BankConnectionByIdParamsDto,
    @Body() updateRequest: UpdateBankConnectionDto,
  ): Promise<BankConnectionResponse> {
    const connection = await this.bankConnectionService.update(params.userId, params.connectionId, updateRequest);

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
  async deleteBankConnection(@Param() params: BankConnectionByIdParamsDto): Promise<void> {
    await this.bankConnectionService.delete(params.userId, params.connectionId);
  }

  @Get(':connectionId/status')
  @ApiOperation({ summary: 'Get bank connection status' })
  @ApiResponse({ status: 200, description: 'Bank connection status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bank connection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBankConnectionStatus(
    @Param() params: BankConnectionByIdParamsDto,
  ): Promise<{ status: BankConnectionStatus; lastSync?: Date }> {
    const connection = await this.bankConnectionService.findByUserIdAndConnectionId(params.userId, params.connectionId);
    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }

    return {
      status: connection.status,
      lastSync: connection.lastSync,
    };
  }
}
