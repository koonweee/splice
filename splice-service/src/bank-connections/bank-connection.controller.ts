import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import {
  BankConnectionResponse,
  BankConnectionStatus,
  CreateBankConnectionRequest,
  UpdateBankConnectionRequest,
} from '@splice/api';
import { BankConnectionService } from './bank-connection.service';

@Controller('users/:userId/banks')
export class BankConnectionController {
  constructor(private readonly bankConnectionService: BankConnectionService) {}

  @Get()
  async getUserBankConnections(@Param('userId') userId: string): Promise<BankConnectionResponse[]> {
    const connections = await this.bankConnectionService.findByUserId(userId);

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
    @Param('userId') userId: string,
    @Body() createRequest: CreateBankConnectionRequest,
  ): Promise<BankConnectionResponse> {
    const connection = await this.bankConnectionService.create(userId, createRequest);

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
    @Param('userId') userId: string,
    @Param('connectionId') connectionId: string,
    @Body() updateRequest: UpdateBankConnectionRequest,
  ): Promise<BankConnectionResponse> {
    const connection = await this.bankConnectionService.update(userId, connectionId, updateRequest);

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
  async deleteBankConnection(
    @Param('userId') userId: string,
    @Param('connectionId') connectionId: string,
  ): Promise<void> {
    await this.bankConnectionService.delete(userId, connectionId);
  }

  @Get(':connectionId/status')
  async getBankConnectionStatus(
    @Param('userId') userId: string,
    @Param('connectionId') connectionId: string,
  ): Promise<{ status: BankConnectionStatus; lastSync?: Date }> {
    const connection = await this.bankConnectionService.findByUserIdAndConnectionId(userId, connectionId);
    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }

    return {
      status: connection.status,
      lastSync: connection.lastSync,
    };
  }
}
