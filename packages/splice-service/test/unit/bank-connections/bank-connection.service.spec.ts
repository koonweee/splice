import { Logger, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Bank, BankConnection, BankConnectionStatus, DataSourceType } from 'splice-api';
import type { Repository } from 'typeorm';
import { BankConnectionEntity } from '../../../src/bank-connections/bank-connection.entity';
import { BankConnectionService } from '../../../src/bank-connections/bank-connection.service';
import { BankRegistryService } from '../../../src/bank-registry/bank-registry.service';
import { DataSourceManager } from '../../../src/data-sources/manager/data-source-manager.service';
import { VaultService } from '../../../src/vault/vault.service';
import { MOCK_USER_ID } from '../../mocks/mocks';

describe('BankConnectionService', () => {
  let service: BankConnectionService;
  let repository: jest.Mocked<Repository<BankConnectionEntity>>;
  let bankRegistryService: jest.Mocked<BankRegistryService>;
  let dataSourceManager: jest.Mocked<DataSourceManager>;

  const mockConnectionId = 'test-connection-id';
  const mockBankId = 'test-bank-id';

  const mockBank: Bank = {
    id: mockBankId,
    name: 'Test Bank',
    logoUrl: 'https://example.com/logo.png',
    sourceType: DataSourceType.SCRAPER,
    scraperIdentifier: 'test-bank',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBankConnection: BankConnection = {
    id: mockConnectionId,
    userId: MOCK_USER_ID,
    bankId: mockBankId,
    status: BankConnectionStatus.ACTIVE,
    alias: 'My Test Account',
    lastSync: new Date(),
    authDetailsUuid: 'auth-details-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    bank: mockBank,
  };

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };

    const mockBankRegistryService = {
      findById: jest.fn(),
    };

    const mockDataSourceManager = {
      fetchTransactions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankConnectionService,
        {
          provide: getRepositoryToken(BankConnectionEntity),
          useValue: mockRepository,
        },
        {
          provide: BankRegistryService,
          useValue: mockBankRegistryService,
        },
        {
          provide: DataSourceManager,
          useValue: mockDataSourceManager,
        },
        {
          provide: VaultService,
          useValue: {
            createSecret: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BankConnectionService>(BankConnectionService);
    repository = module.get(getRepositoryToken(BankConnectionEntity));
    bankRegistryService = module.get(BankRegistryService);
    dataSourceManager = module.get(DataSourceManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return user bank connections ordered by creation date', async () => {
      const connections = [mockBankConnection];
      repository.find.mockResolvedValue(connections);

      const result = await service.findByUserId(MOCK_USER_ID);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
        relations: ['bank'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(connections);
    });

    it('should return empty array when user has no connections', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByUserId(MOCK_USER_ID);

      expect(result).toEqual([]);
    });
  });

  describe('findByUserIdAndConnectionId', () => {
    it('should return connection when found', async () => {
      repository.findOne.mockResolvedValue(mockBankConnection);

      const result = await service.findByUserIdAndConnectionId(MOCK_USER_ID, mockConnectionId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockConnectionId, userId: MOCK_USER_ID },
        relations: ['bank'],
      });
      expect(result).toEqual(mockBankConnection);
    });

    it('should return null when connection not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUserIdAndConnectionId(MOCK_USER_ID, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createRequest = {
      bankId: mockBankId,
      alias: 'My New Account',
    };

    it('should create bank connection successfully', async () => {
      bankRegistryService.findById.mockResolvedValue(mockBank);
      repository.create.mockReturnValue(mockBankConnection);
      repository.save.mockResolvedValue(mockBankConnection);
      repository.findOne.mockResolvedValue(mockBankConnection);

      const result = await service.create(MOCK_USER_ID, createRequest);

      expect(bankRegistryService.findById).toHaveBeenCalledWith(mockBankId);
      expect(repository.create).toHaveBeenCalledWith({
        userId: MOCK_USER_ID,
        bankId: mockBankId,
        alias: createRequest.alias,
        authDetailsUuid: undefined,
        status: BankConnectionStatus.PENDING_AUTH,
      });
      expect(repository.save).toHaveBeenCalledWith(mockBankConnection);
      expect(result).toEqual(mockBankConnection);
    });

    it('should throw NotFoundException when bank not found', async () => {
      bankRegistryService.findById.mockResolvedValue(null);

      await expect(service.create(MOCK_USER_ID, createRequest)).rejects.toThrow(
        new NotFoundException('Bank not found'),
      );
    });

    it('should throw NotFoundException when bank is not active', async () => {
      const inactiveBank = { ...mockBank, isActive: false };
      bankRegistryService.findById.mockResolvedValue(inactiveBank);

      await expect(service.create(MOCK_USER_ID, createRequest)).rejects.toThrow(
        new NotFoundException('Bank is not available for new connections'),
      );
    });
  });

  describe('delete', () => {
    it('should delete bank connection successfully', async () => {
      repository.findOne.mockResolvedValue(mockBankConnection);
      repository.remove.mockResolvedValue(mockBankConnection);

      await service.delete(MOCK_USER_ID, mockConnectionId);

      expect(repository.remove).toHaveBeenCalledWith(mockBankConnection);
    });

    it('should throw NotFoundException when connection not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete(MOCK_USER_ID, mockConnectionId)).rejects.toThrow(
        new NotFoundException('Bank connection not found'),
      );
    });
  });

  describe('updateLastSync', () => {
    it('should update last sync timestamp', async () => {
      await service.updateLastSync(mockConnectionId);

      expect(repository.update).toHaveBeenCalledWith(mockConnectionId, {
        lastSync: expect.any(Date),
      });
    });
  });

  describe('updateStatus', () => {
    it('should update connection status', async () => {
      await service.updateStatus(mockConnectionId, BankConnectionStatus.ERROR);

      expect(repository.update).toHaveBeenCalledWith(mockConnectionId, {
        status: BankConnectionStatus.ERROR,
      });
    });
  });

  describe('getTransactions', () => {
    const mockVaultAccessToken = 'vault-access-token';
    const mockTransactions = [
      {
        id: 'tx1',
        accountId: 'acc1',
        date: '2024-01-01',
        description: 'Test transaction',
        amount: 100,
        type: 'CREDIT' as const,
        pending: false,
      },
    ];

    it('should fetch transactions successfully', async () => {
      repository.findOne.mockResolvedValue(mockBankConnection);
      dataSourceManager.fetchTransactions.mockResolvedValue(mockTransactions);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await service.getTransactions(
        MOCK_USER_ID,
        mockConnectionId,
        mockVaultAccessToken,
        startDate,
        endDate,
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockConnectionId, userId: MOCK_USER_ID },
        relations: ['bank'],
      });
      expect(dataSourceManager.fetchTransactions).toHaveBeenCalledWith(
        mockBankConnection,
        startDate,
        endDate,
        mockVaultAccessToken,
        undefined, // accountId not provided
      );
      expect(result).toEqual(mockTransactions);
    });

    it('should use default date range when dates not provided', async () => {
      repository.findOne.mockResolvedValue(mockBankConnection);
      dataSourceManager.fetchTransactions.mockResolvedValue(mockTransactions);

      await service.getTransactions(MOCK_USER_ID, mockConnectionId, mockVaultAccessToken);

      expect(dataSourceManager.fetchTransactions).toHaveBeenCalledWith(
        mockBankConnection,
        expect.any(Date), // 90 days ago
        expect.any(Date), // now
        mockVaultAccessToken,
        undefined, // accountId not provided
      );
    });

    it('should throw NotFoundException when connection not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getTransactions(MOCK_USER_ID, mockConnectionId, mockVaultAccessToken)).rejects.toThrow(
        new NotFoundException(`Bank connection not found: ${mockConnectionId}`),
      );
    });

    it('should throw NotFoundException when connection not authenticated', async () => {
      const unauthenticatedConnection = { ...mockBankConnection, authDetailsUuid: undefined };
      repository.findOne.mockResolvedValue(unauthenticatedConnection);

      await expect(service.getTransactions(MOCK_USER_ID, mockConnectionId, mockVaultAccessToken)).rejects.toThrow(
        new NotFoundException('Bank connection not authenticated. Please complete login first.'),
      );
    });
  });
});
