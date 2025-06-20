import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  BankConnectionResponse,
  BankConnectionStatus,
  CreateBankConnectionRequest,
  UpdateBankConnectionRequest,
} from '@splice/api';
import { AuthGuard } from '../auth/auth.guard';
import { BankConnectionService } from './bank-connection.service';

interface AuthenticatedRequest extends Request {
  jwt: {
    sub: string;
    [key: string]: any;
  };
}

@Controller('users/:userId/banks')
@UseGuards(AuthGuard)
export class BankConnectionController {
  constructor(private readonly bankConnectionService: BankConnectionService) {}

  @Get()
  async getUserBankConnections(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<BankConnectionResponse[]> {
    this.validateUserAccess(userId, req.jwt.sub);

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
    @Request() req: AuthenticatedRequest,
  ): Promise<BankConnectionResponse> {
    this.validateUserAccess(userId, req.jwt.sub);

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
    @Request() req: AuthenticatedRequest,
  ): Promise<BankConnectionResponse> {
    this.validateUserAccess(userId, req.jwt.sub);

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
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    this.validateUserAccess(userId, req.jwt.sub);

    await this.bankConnectionService.delete(userId, connectionId);
  }

  @Get(':connectionId/status')
  async getBankConnectionStatus(
    @Param('userId') userId: string,
    @Param('connectionId') connectionId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ status: BankConnectionStatus; lastSync?: Date }> {
    this.validateUserAccess(userId, req.jwt.sub);

    const connection = await this.bankConnectionService.findByUserIdAndConnectionId(userId, connectionId);
    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }

    return {
      status: connection.status,
      lastSync: connection.lastSync,
    };
  }

  private validateUserAccess(requestedUserId: string, jwtUserId: string): void {
    if (requestedUserId !== jwtUserId) {
      throw new ForbiddenException("Access denied: cannot access another user's bank connections");
    }
  }
}
