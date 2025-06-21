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
import { BankConnectionResponse, BankConnectionStatus } from '@splice/api';
import { BankConnectionService } from './bank-connection.service';
import {
  BankConnectionByIdParamsDto,
  BankConnectionParamsDto,
  CreateBankConnectionDto,
  UpdateBankConnectionDto,
} from './dto';

@Controller('users/:userId/banks')
@UseGuards(AuthGuard('jwt'))
export class BankConnectionController {
  constructor(private readonly bankConnectionService: BankConnectionService) {}

  @Get()
  async getUserBankConnections(@Param() params: BankConnectionParamsDto): Promise<BankConnectionResponse[]> {
    const connections = await this.bankConnectionService.findByUserId(params.userId);

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
  async deleteBankConnection(@Param() params: BankConnectionByIdParamsDto): Promise<void> {
    await this.bankConnectionService.delete(params.userId, params.connectionId);
  }

  @Get(':connectionId/status')
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
