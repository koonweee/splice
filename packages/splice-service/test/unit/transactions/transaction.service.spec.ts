import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateTransactionDto } from '../../../src/transactions/dto/create-transaction.dto';
import { TransactionQueryDto } from '../../../src/transactions/dto/transaction-query.dto';
import { UpdateTransactionDto } from '../../../src/transactions/dto/update-transaction.dto';
import { TransactionEntity } from '../../../src/transactions/transaction.entity';
import { TransactionService } from '../../../src/transactions/transaction.service';
import { MOCK_USER_ID } from '../../mocks/mocks';

describe('TransactionService', () => {
  let service: TransactionService;
  let repository: jest.Mocked<Repository<TransactionEntity>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<TransactionEntity>>;

  const mockTransaction: TransactionEntity = {
    id: 'transaction-1',
    accountId: 'account-1',
    providerTransactionId: 'provider-transaction-1',
    providerAccountId: 'provider-account-1',
    amount: 25.5,
    isoCurrencyCode: 'USD',
    category: {
      primary: 'Food and Drink',
      detailed: 'Restaurants',
      confidenceLevel: 'VERY_HIGH',
    },
    date: '2023-01-01',
    name: 'Starbucks Coffee',
    pending: false,
    logoUrl: 'https://logo.url',
    websiteUrl: 'https://website.url',
    createdAt: new Date(),
    updatedAt: new Date(),
    account: {
      id: 'account-1',
      bankConnection: {
        userId: MOCK_USER_ID,
      },
    } as any,
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;

    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(TransactionEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    repository = module.get(getRepositoryToken(TransactionEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return transactions for a user with basic query', async () => {
      const query: TransactionQueryDto = {};
      const mockTransactions = [mockTransaction];

      queryBuilder.getMany.mockResolvedValue(mockTransactions);

      const result = await service.findByUserId(MOCK_USER_ID, query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('transaction');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('transaction.account', 'account');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('account.bankConnection', 'bankConnection');
      expect(queryBuilder.where).toHaveBeenCalledWith('bankConnection.userId = :userId', { userId: MOCK_USER_ID });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('transaction.date', 'DESC');
      expect(result).toEqual(mockTransactions);
    });

    it('should filter by accountId when provided', async () => {
      const query: TransactionQueryDto = { accountId: 'account-1' };
      queryBuilder.getMany.mockResolvedValue([mockTransaction]);

      await service.findByUserId(MOCK_USER_ID, query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('transaction.accountId = :accountId', {
        accountId: 'account-1',
      });
    });

    it('should filter by pending status when provided', async () => {
      const query: TransactionQueryDto = { pending: true };
      queryBuilder.getMany.mockResolvedValue([mockTransaction]);

      await service.findByUserId(MOCK_USER_ID, query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('transaction.pending = :pending', { pending: true });
    });

    it('should filter by date range when provided', async () => {
      const query: TransactionQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };
      queryBuilder.getMany.mockResolvedValue([mockTransaction]);

      await service.findByUserId(MOCK_USER_ID, query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('transaction.date >= :startDate', {
        startDate: '2023-01-01',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('transaction.date <= :endDate', {
        endDate: '2023-12-31',
      });
    });

    it('should apply limit and offset when provided', async () => {
      const query: TransactionQueryDto = { limit: 10, offset: 5 };
      queryBuilder.getMany.mockResolvedValue([mockTransaction]);

      await service.findByUserId(MOCK_USER_ID, query);

      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
      expect(queryBuilder.offset).toHaveBeenCalledWith(5);
    });
  });

  describe('findByUserIdAndTransactionId', () => {
    it('should return transaction when found', async () => {
      repository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findByUserIdAndTransactionId(MOCK_USER_ID, 'transaction-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'transaction-1',
          account: {
            bankConnection: { userId: MOCK_USER_ID },
          },
        },
        relations: ['account', 'account.bankConnection'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should return null when transaction not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUserIdAndTransactionId(MOCK_USER_ID, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserIdAndTransactionIdOrThrow', () => {
    it('should return transaction when found', async () => {
      repository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findByUserIdAndTransactionIdOrThrow(MOCK_USER_ID, 'transaction-1');

      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findByUserIdAndTransactionIdOrThrow(MOCK_USER_ID, 'non-existent')).rejects.toThrow(
        new NotFoundException('Transaction not found: non-existent'),
      );
    });
  });

  describe('create', () => {
    it('should create and save transaction', async () => {
      const createDto: CreateTransactionDto = {
        accountId: 'account-1',
        providerTransactionId: 'provider-transaction-1',
        providerAccountId: 'provider-account-1',
        amount: 25.5,
        isoCurrencyCode: 'USD',
        category: {
          primary: 'Food and Drink',
          detailed: 'Restaurants',
          confidenceLevel: 'VERY_HIGH',
        },
        date: '2023-01-01',
        name: 'Starbucks Coffee',
        pending: false,
        logoUrl: 'https://logo.url',
        websiteUrl: 'https://website.url',
      };

      const createdTransaction = { ...mockTransaction };
      repository.create.mockReturnValue(createdTransaction);
      repository.save.mockResolvedValue(createdTransaction);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(createdTransaction);
      expect(result).toEqual(createdTransaction);
    });
  });

  describe('update', () => {
    it('should update and return transaction', async () => {
      const updateDto: UpdateTransactionDto = {
        name: 'Updated Transaction',
        amount: 30.0,
      };

      const updatedTransaction = { ...mockTransaction, ...updateDto };
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue(updatedTransaction);

      const result = await service.update('transaction-1', updateDto);

      expect(repository.update).toHaveBeenCalledWith('transaction-1', updateDto);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-1' },
        relations: ['account', 'account.bankConnection'],
      });
      expect(result).toEqual(updatedTransaction);
    });

    it('should throw NotFoundException when transaction not found after update', async () => {
      const updateDto: UpdateTransactionDto = { name: 'Updated Transaction' };
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        new NotFoundException('Transaction not found: non-existent'),
      );
    });
  });

  describe('remove', () => {
    it('should delete transaction successfully', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('transaction-1');

      expect(repository.delete).toHaveBeenCalledWith('transaction-1');
    });

    it('should throw NotFoundException when transaction not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove('non-existent')).rejects.toThrow(
        new NotFoundException('Transaction not found: non-existent'),
      );
    });
  });

  describe('toResponse', () => {
    it('should convert entity to response format', () => {
      const response = service.toResponse(mockTransaction);

      expect(response).toEqual({
        id: mockTransaction.id,
        accountId: mockTransaction.accountId,
        providerTransactionId: mockTransaction.providerTransactionId,
        providerAccountId: mockTransaction.providerAccountId,
        amount: mockTransaction.amount,
        isoCurrencyCode: mockTransaction.isoCurrencyCode,
        unofficialCurrencyCode: mockTransaction.unofficialCurrencyCode,
        category: mockTransaction.category,
        date: mockTransaction.date,
        name: mockTransaction.name,
        pending: mockTransaction.pending,
        logoUrl: mockTransaction.logoUrl,
        websiteUrl: mockTransaction.websiteUrl,
        createdAt: mockTransaction.createdAt,
        updatedAt: mockTransaction.updatedAt,
      });
    });
  });
});
