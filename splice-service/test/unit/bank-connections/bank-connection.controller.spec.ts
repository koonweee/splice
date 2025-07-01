import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Bank, BankConnection, BankConnectionStatus, DataSourceType, User } from '@splice/api';
import { ApiKeyStoreService } from '../../../src/api-key-store/api-key-store.service';
import { BankConnectionController } from '../../../src/bank-connections/bank-connection.controller';
import { BankConnectionService } from '../../../src/bank-connections/bank-connection.service';
import { DataSourceManager } from '../../../src/data-sources/manager/data-source-manager.service';
import { MOCK_USER_ID } from '../../mocks/mocks';

describe('BankConnectionController', () => {
  let controller: BankConnectionController;
  let bankConnectionService: jest.Mocked<BankConnectionService>;
  let _dataSourceManager: jest.Mocked<DataSourceManager>;

  const mockConnectionId = 'test-connection-id';
  const mockBankId = 'test-bank-id';
  const mockUser: User = { id: MOCK_USER_ID } as User;

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
    const mockBankConnectionService = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserIdAndConnectionId: jest.fn(),
    };

    const mockDataSourceManager = {
      fetchAccounts: jest.fn(),
      getHealthStatus: jest.fn(),
      initiateConnection: jest.fn(),
      finalizeConnection: jest.fn(),
      fetchTransactions: jest.fn(),
    };

    const mockApiKeyStoreService = {
      storeApiKey: jest.fn(),
      retrieveApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankConnectionController],
      providers: [
        {
          provide: BankConnectionService,
          useValue: mockBankConnectionService,
        },
        {
          provide: DataSourceManager,
          useValue: mockDataSourceManager,
        },
        {
          provide: ApiKeyStoreService,
          useValue: mockApiKeyStoreService,
        },
      ],
    }).compile();

    controller = module.get<BankConnectionController>(BankConnectionController);
    bankConnectionService = module.get(BankConnectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserBankConnections', () => {
    it('should return user bank connections', async () => {
      const connections = [mockBankConnection];
      bankConnectionService.findByUserId.mockResolvedValue(connections);

      const result = await controller.getUserBankConnections(mockUser);

      expect(bankConnectionService.findByUserId).toHaveBeenCalledWith(MOCK_USER_ID);
      expect(result).toEqual([
        {
          id: mockConnectionId,
          bankId: mockBankId,
          bankName: 'Test Bank',
          bankLogoUrl: 'https://example.com/logo.png',
          sourceType: DataSourceType.SCRAPER,
          status: BankConnectionStatus.ACTIVE,
          alias: 'My Test Account',
          lastSync: mockBankConnection.lastSync,
          createdAt: mockBankConnection.createdAt,
          updatedAt: mockBankConnection.updatedAt,
        },
      ]);
    });
  });

  describe('createBankConnection', () => {
    const createRequest = {
      bankId: mockBankId,
      alias: 'My New Account',
      authDetailsUuid: 'new-auth-uuid',
    };

    it('should create bank connection successfully', async () => {
      bankConnectionService.create.mockResolvedValue(mockBankConnection);

      const result = await controller.createBankConnection(mockUser, createRequest);

      expect(bankConnectionService.create).toHaveBeenCalledWith(MOCK_USER_ID, createRequest);
      expect(result).toEqual({
        id: mockConnectionId,
        bankId: mockBankId,
        bankName: 'Test Bank',
        bankLogoUrl: 'https://example.com/logo.png',
        sourceType: DataSourceType.SCRAPER,
        status: BankConnectionStatus.ACTIVE,
        alias: 'My Test Account',
        lastSync: mockBankConnection.lastSync,
        createdAt: mockBankConnection.createdAt,
        updatedAt: mockBankConnection.updatedAt,
      });
    });
  });

  describe('updateBankConnection', () => {
    const updateRequest = {
      alias: 'Updated Alias',
      status: BankConnectionStatus.ACTIVE,
    };

    it('should update bank connection successfully', async () => {
      const updatedConnection = { ...mockBankConnection, ...updateRequest };
      bankConnectionService.update.mockResolvedValue(updatedConnection);

      const result = await controller.updateBankConnection(mockUser, { connectionId: mockConnectionId }, updateRequest);

      expect(bankConnectionService.update).toHaveBeenCalledWith(MOCK_USER_ID, mockConnectionId, updateRequest);
      expect(result.alias).toBe('Updated Alias');
    });
  });

  describe('deleteBankConnection', () => {
    it('should delete bank connection successfully', async () => {
      bankConnectionService.delete.mockResolvedValue();

      await controller.deleteBankConnection(mockUser, { connectionId: mockConnectionId });

      expect(bankConnectionService.delete).toHaveBeenCalledWith(MOCK_USER_ID, mockConnectionId);
    });
  });

  describe('getBankConnectionStatus', () => {
    it('should return connection status', async () => {
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(mockBankConnection);

      const result = await controller.getBankConnectionStatus(mockUser, { connectionId: mockConnectionId });

      expect(bankConnectionService.findByUserIdAndConnectionId).toHaveBeenCalledWith(MOCK_USER_ID, mockConnectionId);
      expect(result).toEqual({
        status: BankConnectionStatus.ACTIVE,
        lastSync: mockBankConnection.lastSync,
      });
    });

    it('should throw NotFoundException when connection not found', async () => {
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(null);

      await expect(controller.getBankConnectionStatus(mockUser, { connectionId: mockConnectionId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
