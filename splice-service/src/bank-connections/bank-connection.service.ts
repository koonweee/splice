import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BankConnection,
  BankConnectionStatus,
  CreateBankConnectionRequest,
  UpdateBankConnectionRequest,
} from '@splice/api';
import { Repository } from 'typeorm';
import { BankRegistryService } from '../bank-registry/bank-registry.service';
import { BankConnectionEntity } from './bank-connection.entity';

@Injectable()
export class BankConnectionService {
  constructor(
    @InjectRepository(BankConnectionEntity)
    private bankConnectionRepository: Repository<BankConnectionEntity>,
    private bankRegistryService: BankRegistryService,
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
      authDetailsUuid: createRequest.authDetailsUuid,
      status: BankConnectionStatus.PENDING_AUTH,
    });

    const savedConnection = await this.bankConnectionRepository.save(connection);

    return this.bankConnectionRepository.findOne({
      where: { id: savedConnection.id },
      relations: ['bank'],
    });
  }

  async update(
    userId: string,
    connectionId: string,
    updateRequest: UpdateBankConnectionRequest,
  ): Promise<BankConnection | null> {
    const connection = await this.findByUserIdAndConnectionId(userId, connectionId);
    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }

    if (updateRequest.alias !== undefined) {
      connection.alias = updateRequest.alias;
    }

    if (updateRequest.status !== undefined) {
      connection.status = updateRequest.status;
    }

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
}
