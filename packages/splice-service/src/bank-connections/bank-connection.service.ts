import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BankConnection,
  BankConnectionStatus,
  CreateBankConnectionRequest,
  StandardizedTransaction,
} from '@splice/api';
import { Repository } from 'typeorm';
import { BankRegistryService } from '../bank-registry/bank-registry.service';
import { DataSourceManager } from '../data-sources/manager/data-source-manager.service';
import { VaultService } from '../vault/vault.service';
import { BankConnectionEntity } from './bank-connection.entity';

@Injectable()
export class BankConnectionService {
  private readonly logger = new Logger(BankConnectionService.name);
  constructor(
    @InjectRepository(BankConnectionEntity)
    private bankConnectionRepository: Repository<BankConnectionEntity>,
    private bankRegistryService: BankRegistryService,
    private dataSourceManager: DataSourceManager,
    private vaultService: VaultService,
  ) {}

  async findByUserId(userId: string): Promise<BankConnection[]> {
    return this.bankConnectionRepository.find({
      where: { userId },
      relations: ['bank'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserIdAndConnectionId(userId: string, connectionId: string): Promise<BankConnection | null> {
    return this.bankConnectionRepository.findOne({
      where: { id: connectionId, userId },
      relations: ['bank'],
    });
  }

  async findByUserIdAndConnectionIdOrThrow(userId: string, connectionId: string): Promise<BankConnection> {
    const connection = await this.findByUserIdAndConnectionId(userId, connectionId);
    if (!connection) {
      throw new NotFoundException(`Bank connection not found: ${connectionId}`);
    }
    return connection;
  }

  async create(userId: string, createRequest: CreateBankConnectionRequest): Promise<BankConnection | null> {
    const bank = await this.bankRegistryService.findById(createRequest.bankId);
    if (!bank) {
      throw new NotFoundException('Bank not found');
    }

    if (!bank.isActive) {
      throw new NotFoundException('Bank is not available for new connections');
    }

    const connection = this.bankConnectionRepository.create({
      userId,
      bankId: createRequest.bankId,
      alias: createRequest.alias,
      authDetailsUuid: undefined,
      status: BankConnectionStatus.PENDING_AUTH,
    });

    const savedConnection = await this.bankConnectionRepository.save(connection);

    return this.bankConnectionRepository.findOne({
      where: { id: savedConnection.id },
      relations: ['bank'],
    });
  }

  async delete(userId: string, connectionId: string): Promise<void> {
    const connection = await this.findByUserIdAndConnectionId(userId, connectionId);
    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }

    await this.bankConnectionRepository.remove(connection);
  }

  async updateLastSync(connectionId: string): Promise<void> {
    await this.bankConnectionRepository.update(connectionId, {
      lastSync: new Date(),
    });
  }

  async updateStatus(connectionId: string, status: BankConnectionStatus): Promise<void> {
    await this.bankConnectionRepository.update(connectionId, { status });
  }

  async updateAuthDetailsUuid(connectionId: string, authDetailsUuid: string): Promise<void> {
    await this.bankConnectionRepository.update(connectionId, { authDetailsUuid });
  }

  async initiateLogin(userId: string, connectionId: string): Promise<object | undefined> {
    const connection = await this.findByUserIdAndConnectionIdOrThrow(userId, connectionId);
    // Throw if connection status is not pending auth
    if (connection.status !== BankConnectionStatus.PENDING_AUTH) {
      throw new BadRequestException('Bank connection is not in PENDING_AUTH state');
    }
    return this.dataSourceManager.initiateConnection(connection.bank.sourceType);
  }

  async finalizeLogin(
    userId: string,
    connectionId: string,
    vaultAccessToken: string,
    vaultOrganisationId: string,
    payload: object,
  ): Promise<void> {
    this.logger.log(`Finalizing login for connection ${connectionId}`);
    const connection = await this.findByUserIdAndConnectionIdOrThrow(userId, connectionId);
    // Throw if connection status is not pending auth
    if (connection.status !== BankConnectionStatus.PENDING_AUTH) {
      throw new BadRequestException('Bank connection is not in PENDING_AUTH state');
    }

    // Validate the payload
    this.dataSourceManager.validateFinalizeConnectionPayload(connection.bank.sourceType, payload);

    // Store the payload in the vault
    const authDetailsUuid = await this.vaultService.createSecret(
      connection.id,
      payload,
      vaultAccessToken,
      vaultOrganisationId,
      `Auth details for connection ${connection.id} - ${connection.bank.name}`,
    );

    // Update the connection with the auth details uuid
    await this.updateAuthDetailsUuid(connectionId, authDetailsUuid);

    // Update the connection status to ACTIVE
    await this.updateStatus(connectionId, BankConnectionStatus.ACTIVE);
    this.logger.log(`Finalized login for connection ${connectionId}`);
  }

  async getTransactions(
    userId: string,
    connectionId: string,
    vaultAccessToken: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StandardizedTransaction[]> {
    const connection = await this.findByUserIdAndConnectionId(userId, connectionId);
    if (!connection) {
      throw new NotFoundException(`Bank connection not found: ${connectionId}`);
    }

    if (!connection.authDetailsUuid) {
      throw new NotFoundException('Bank connection not authenticated. Please complete login first.');
    }

    return await this.dataSourceManager.fetchTransactions(
      connection,
      `${connectionId}-default`,
      startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate || new Date(),
      vaultAccessToken,
    );
  }
}
