import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionResponse } from 'splice-api';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionEntity } from './transaction.entity';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
  ) {}

  async findByUserId(userId: string, query: TransactionQueryDto): Promise<TransactionEntity[]> {
    const whereConditions: FindOptionsWhere<TransactionEntity> = {
      account: {
        bankConnection: { userId },
      },
    };

    if (query.accountId) {
      whereConditions.accountId = query.accountId;
    }

    if (query.pending !== undefined) {
      whereConditions.pending = query.pending;
    }

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('account.bankConnection', 'bankConnection')
      .where('bankConnection.userId = :userId', { userId });

    if (query.accountId) {
      queryBuilder.andWhere('transaction.accountId = :accountId', { accountId: query.accountId });
    }

    if (query.pending !== undefined) {
      queryBuilder.andWhere('transaction.pending = :pending', { pending: query.pending });
    }

    if (query.startDate) {
      queryBuilder.andWhere('transaction.date >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('transaction.date <= :endDate', { endDate: query.endDate });
    }

    queryBuilder.orderBy('transaction.date', 'DESC');

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    return queryBuilder.getMany();
  }

  async findByUserIdAndTransactionId(userId: string, transactionId: string): Promise<TransactionEntity | null> {
    return this.transactionRepository.findOne({
      where: {
        id: transactionId,
        account: {
          bankConnection: { userId },
        },
      },
      relations: ['account', 'account.bankConnection'],
    });
  }

  async findByUserIdAndTransactionIdOrThrow(userId: string, transactionId: string): Promise<TransactionEntity> {
    const transaction = await this.findByUserIdAndTransactionId(userId, transactionId);
    if (!transaction) {
      throw new NotFoundException(`Transaction not found: ${transactionId}`);
    }
    return transaction;
  }

  async create(createTransactionDto: CreateTransactionDto): Promise<TransactionEntity> {
    const transaction = this.transactionRepository.create(createTransactionDto);
    return this.transactionRepository.save(transaction);
  }

  async update(transactionId: string, updateTransactionDto: UpdateTransactionDto): Promise<TransactionEntity> {
    await this.transactionRepository.update(transactionId, updateTransactionDto);
    const updatedTransaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['account', 'account.bankConnection'],
    });

    if (!updatedTransaction) {
      throw new NotFoundException(`Transaction not found: ${transactionId}`);
    }

    return updatedTransaction;
  }

  async remove(transactionId: string): Promise<void> {
    const result = await this.transactionRepository.delete(transactionId);
    if (result.affected === 0) {
      throw new NotFoundException(`Transaction not found: ${transactionId}`);
    }
  }

  toResponse(transaction: TransactionEntity): TransactionResponse {
    return {
      id: transaction.id,
      accountId: transaction.accountId,
      providerTransactionId: transaction.providerTransactionId,
      providerAccountId: transaction.providerAccountId,
      amount: transaction.amount,
      isoCurrencyCode: transaction.isoCurrencyCode,
      unofficialCurrencyCode: transaction.unofficialCurrencyCode,
      category: transaction.category,
      date: transaction.date,
      name: transaction.name,
      pending: transaction.pending,
      logoUrl: transaction.logoUrl,
      websiteUrl: transaction.websiteUrl,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
