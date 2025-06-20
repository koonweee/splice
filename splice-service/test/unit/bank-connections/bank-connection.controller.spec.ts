import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

  const mockAuthenticatedRequest = {
    jwt: {
      sub: mockUserId,
    },
  } as any;

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
    })
      .overrideGuard(require('../../../src/auth/auth.guard').AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

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

      const result = await controller.getUserBankConnections(mockUserId, mockAuthenticatedRequest);

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

    it("should throw ForbiddenException when user tries to access another user's connections", async () => {
      const differentUserId = 'different-user-id';

      await expect(controller.getUserBankConnections(differentUserId, mockAuthenticatedRequest)).rejects.toThrow(
        ForbiddenException,
      );
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

      const result = await controller.createBankConnection(mockUserId, createRequest, mockAuthenticatedRequest);

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

    it('should throw ForbiddenException when user tries to create connection for another user', async () => {
      const differentUserId = 'different-user-id';

      await expect(
        controller.createBankConnection(differentUserId, createRequest, mockAuthenticatedRequest),
      ).rejects.toThrow(ForbiddenException);
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
        mockUserId,
        mockConnectionId,
        updateRequest,
        mockAuthenticatedRequest,
      );

      expect(bankConnectionService.update).toHaveBeenCalledWith(mockUserId, mockConnectionId, updateRequest);
      expect(result.alias).toBe('Updated Alias');
    });

    it("should throw ForbiddenException when user tries to update another user's connection", async () => {
      const differentUserId = 'different-user-id';

      await expect(
        controller.updateBankConnection(differentUserId, mockConnectionId, updateRequest, mockAuthenticatedRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteBankConnection', () => {
    it('should delete bank connection successfully', async () => {
      bankConnectionService.delete.mockResolvedValue();

      await controller.deleteBankConnection(mockUserId, mockConnectionId, mockAuthenticatedRequest);

      expect(bankConnectionService.delete).toHaveBeenCalledWith(mockUserId, mockConnectionId);
    });

    it("should throw ForbiddenException when user tries to delete another user's connection", async () => {
      const differentUserId = 'different-user-id';

      await expect(
        controller.deleteBankConnection(differentUserId, mockConnectionId, mockAuthenticatedRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getBankConnectionStatus', () => {
    it('should return connection status', async () => {
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(mockBankConnection);

      const result = await controller.getBankConnectionStatus(mockUserId, mockConnectionId, mockAuthenticatedRequest);

      expect(bankConnectionService.findByUserIdAndConnectionId).toHaveBeenCalledWith(mockUserId, mockConnectionId);
      expect(result).toEqual({
        status: BankConnectionStatus.ACTIVE,
        lastSync: mockBankConnection.lastSync,
      });
    });

    it('should throw NotFoundException when connection not found', async () => {
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(null);

      await expect(
        controller.getBankConnectionStatus(mockUserId, mockConnectionId, mockAuthenticatedRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when user tries to access another user's connection status", async () => {
      const differentUserId = 'different-user-id';

      await expect(
        controller.getBankConnectionStatus(differentUserId, mockConnectionId, mockAuthenticatedRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
