import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { BankConnectionStatus, BankSourceType } from '@splice/api';
import { BankConnectionController } from '../../../src/bank-connections/bank-connection.controller';
import { BankConnection } from '../../../src/bank-connections/bank-connection.entity';
import { BankConnectionService } from '../../../src/bank-connections/bank-connection.service';
import { BankRegistry } from '../../../src/bank-registry/bank-registry.entity';

describe('BankConnectionController', () => {
  let controller: BankConnectionController;
  let bankConnectionService: jest.Mocked<BankConnectionService>;

  const mockUserId = 'test-user-id';
  const mockConnectionId = 'test-connection-id';
  const mockBankId = 'test-bank-id';

  const mockBank: BankRegistry = {
    id: mockBankId,
    name: 'Test Bank',
    logoUrl: 'https://example.com/logo.png',
    sourceType: BankSourceType.SCRAPER,
    scraperIdentifier: 'test-bank',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBankConnection: BankConnection = {
    id: mockConnectionId,
    userId: mockUserId,
    bankId: mockBankId,
    status: BankConnectionStatus.ACTIVE,
    alias: 'My Test Account',
    lastSync: new Date(),
    authDetailsUuid: 'auth-details-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: undefined,
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankConnectionController],
      providers: [
        {
          provide: BankConnectionService,
          useValue: mockBankConnectionService,
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

      const result = await controller.getUserBankConnections({ userId: mockUserId });

      expect(bankConnectionService.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual([
        {
          id: mockConnectionId,
          bankId: mockBankId,
          bankName: 'Test Bank',
          bankLogoUrl: 'https://example.com/logo.png',
          sourceType: BankSourceType.SCRAPER,
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

      const result = await controller.createBankConnection({ userId: mockUserId }, createRequest);

      expect(bankConnectionService.create).toHaveBeenCalledWith(mockUserId, createRequest);
      expect(result).toEqual({
        id: mockConnectionId,
        bankId: mockBankId,
        bankName: 'Test Bank',
        bankLogoUrl: 'https://example.com/logo.png',
        sourceType: BankSourceType.SCRAPER,
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

      const result = await controller.updateBankConnection(
        { userId: mockUserId, connectionId: mockConnectionId },
        updateRequest,
      );

      expect(bankConnectionService.update).toHaveBeenCalledWith(mockUserId, mockConnectionId, updateRequest);
      expect(result.alias).toBe('Updated Alias');
    });
  });

  describe('deleteBankConnection', () => {
    it('should delete bank connection successfully', async () => {
      bankConnectionService.delete.mockResolvedValue();

      await controller.deleteBankConnection({ userId: mockUserId, connectionId: mockConnectionId });

      expect(bankConnectionService.delete).toHaveBeenCalledWith(mockUserId, mockConnectionId);
    });
  });

  describe('getBankConnectionStatus', () => {
    it('should return connection status', async () => {
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(mockBankConnection);

      const result = await controller.getBankConnectionStatus({ userId: mockUserId, connectionId: mockConnectionId });

      expect(bankConnectionService.findByUserIdAndConnectionId).toHaveBeenCalledWith(mockUserId, mockConnectionId);
      expect(result).toEqual({
        status: BankConnectionStatus.ACTIVE,
        lastSync: mockBankConnection.lastSync,
      });
    });

    it('should throw NotFoundException when connection not found', async () => {
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(null);

      await expect(
        controller.getBankConnectionStatus({ userId: mockUserId, connectionId: mockConnectionId }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
