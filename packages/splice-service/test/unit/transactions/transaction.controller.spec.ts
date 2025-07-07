import { Test, TestingModule } from '@nestjs/testing';
import { CreateTransactionDto } from '../../../src/transactions/dto/create-transaction.dto';
import { TransactionByIdParamsDto } from '../../../src/transactions/dto/transaction-params.dto';
import { TransactionQueryDto } from '../../../src/transactions/dto/transaction-query.dto';
import { UpdateTransactionDto } from '../../../src/transactions/dto/update-transaction.dto';
import { TransactionController } from '../../../src/transactions/transaction.controller';
import { TransactionEntity } from '../../../src/transactions/transaction.entity';
import { TransactionService } from '../../../src/transactions/transaction.service';
import { MOCK_USER, MOCK_USER_ID } from '../../mocks/mocks';

describe('TransactionController', () => {
  let controller: TransactionController;
  let service: jest.Mocked<TransactionService>;

  const mockTransactionEntity: TransactionEntity = {
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

  const mockTransactionResponse = {
    id: 'transaction-1',
    accountId: 'account-1',
    providerTransactionId: 'provider-transaction-1',
    providerAccountId: 'provider-account-1',
    amount: 25.5,
    isoCurrencyCode: 'USD',
    unofficialCurrencyCode: undefined,
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
    createdAt: mockTransactionEntity.createdAt,
    updatedAt: mockTransactionEntity.updatedAt,
  };

  beforeEach(async () => {
    const mockService = {
      findByUserId: jest.fn(),
      findByUserIdAndTransactionIdOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      toResponse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    service = module.get(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all transactions for a user with query', async () => {
      const query: TransactionQueryDto = {
        accountId: 'account-1',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };
      const mockTransactions = [mockTransactionEntity];
      service.findByUserId.mockResolvedValue(mockTransactions);
      service.toResponse.mockReturnValue(mockTransactionResponse);

      const result = await controller.findAll(MOCK_USER, query);

      expect(service.findByUserId).toHaveBeenCalledWith(MOCK_USER.id, query);
      expect(service.toResponse).toHaveBeenCalledWith(mockTransactionEntity);
      expect(result).toEqual([mockTransactionResponse]);
    });

    it('should return empty array when no transactions found', async () => {
      const query: TransactionQueryDto = {};
      service.findByUserId.mockResolvedValue([]);

      const result = await controller.findAll(MOCK_USER, query);

      expect(service.findByUserId).toHaveBeenCalledWith(MOCK_USER.id, query);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return transaction by ID', async () => {
      const params: TransactionByIdParamsDto = { transactionId: 'transaction-1' };
      service.findByUserIdAndTransactionIdOrThrow.mockResolvedValue(mockTransactionEntity);
      service.toResponse.mockReturnValue(mockTransactionResponse);

      const result = await controller.findOne(MOCK_USER, params);

      expect(service.findByUserIdAndTransactionIdOrThrow).toHaveBeenCalledWith(MOCK_USER.id, 'transaction-1');
      expect(service.toResponse).toHaveBeenCalledWith(mockTransactionEntity);
      expect(result).toEqual(mockTransactionResponse);
    });
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
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

      service.create.mockResolvedValue(mockTransactionEntity);
      service.toResponse.mockReturnValue(mockTransactionResponse);

      const result = await controller.create(MOCK_USER, createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.toResponse).toHaveBeenCalledWith(mockTransactionEntity);
      expect(result).toEqual(mockTransactionResponse);
    });
  });

  describe('update', () => {
    it('should update transaction by ID', async () => {
      const params: TransactionByIdParamsDto = { transactionId: 'transaction-1' };
      const updateDto: UpdateTransactionDto = {
        name: 'Updated Transaction',
        amount: 30.0,
      };

      const updatedEntity = { ...mockTransactionEntity, ...updateDto };
      const updatedResponse = { ...mockTransactionResponse, ...updateDto };

      service.findByUserIdAndTransactionIdOrThrow.mockResolvedValue(mockTransactionEntity);
      service.update.mockResolvedValue(updatedEntity);
      service.toResponse.mockReturnValue(updatedResponse);

      const result = await controller.update(MOCK_USER, params, updateDto);

      expect(service.findByUserIdAndTransactionIdOrThrow).toHaveBeenCalledWith(MOCK_USER.id, 'transaction-1');
      expect(service.update).toHaveBeenCalledWith('transaction-1', updateDto);
      expect(service.toResponse).toHaveBeenCalledWith(updatedEntity);
      expect(result).toEqual(updatedResponse);
    });
  });

  describe('remove', () => {
    it('should delete transaction by ID', async () => {
      const params: TransactionByIdParamsDto = { transactionId: 'transaction-1' };

      service.findByUserIdAndTransactionIdOrThrow.mockResolvedValue(mockTransactionEntity);
      service.remove.mockResolvedValue();

      await controller.remove(MOCK_USER, params);

      expect(service.findByUserIdAndTransactionIdOrThrow).toHaveBeenCalledWith(MOCK_USER.id, 'transaction-1');
      expect(service.remove).toHaveBeenCalledWith('transaction-1');
    });
  });
});
