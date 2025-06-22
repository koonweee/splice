import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BankConnectionStatus, BankSourceType } from '@splice/api';
import type { Repository } from 'typeorm';
import { BankConnectionEntity } from '../../../src/bank-connections/bank-connection.entity';
import { BankConnectionService } from '../../../src/bank-connections/bank-connection.service';
import { BankEntity } from '../../../src/bank-registry/bank.entity';
import { BankRegistryService } from '../../../src/bank-registry/bank-registry.service';
import { MOCK_USER, MOCK_USER_UUID } from '../../mocks/mocks';

describe('BankConnectionService', () => {
  let service: BankConnectionService;
  let repository: jest.Mocked<Repository<BankConnectionEntity>>;
  let bankRegistryService: jest.Mocked<BankRegistryService>;

  const mockConnectionId = 'test-connection-id';
  const mockBankId = 'test-bank-id';

  const mockBank: BankEntity = {
    id: mockBankId,
    name: 'Test Bank',
    logoUrl: 'https://example.com/logo.png',
    sourceType: BankSourceType.SCRAPER,
    scraperIdentifier: 'test-bank',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBankConnection: BankConnectionEntity = {
    id: mockConnectionId,
    userId: MOCK_USER_UUID,
    bankId: mockBankId,
    status: BankConnectionStatus.ACTIVE,
    alias: 'My Test Account',
    lastSync: new Date(),
    authDetailsUuid: 'auth-details-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: MOCK_USER,
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
      ],
    }).compile();

    service = module.get<BankConnectionService>(BankConnectionService);
    repository = module.get(getRepositoryToken(BankConnectionEntity));
    bankRegistryService = module.get(BankRegistryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return user bank connections ordered by creation date', async () => {
      const connections = [mockBankConnection];
      repository.find.mockResolvedValue(connections);

      const result = await service.findByUserId(MOCK_USER_UUID);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_UUID },
        relations: ['bank'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(connections);
    });

    it('should return empty array when user has no connections', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByUserId(MOCK_USER_UUID);

      expect(result).toEqual([]);
    });
  });

  describe('findByUserIdAndConnectionId', () => {
    it('should return connection when found', async () => {
      repository.findOne.mockResolvedValue(mockBankConnection);

      const result = await service.findByUserIdAndConnectionId(MOCK_USER_UUID, mockConnectionId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockConnectionId, userId: MOCK_USER_UUID },
        relations: ['bank'],
      });
      expect(result).toEqual(mockBankConnection);
    });

    it('should return null when connection not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUserIdAndConnectionId(MOCK_USER_UUID, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createRequest = {
      bankId: mockBankId,
      alias: 'My New Account',
      authDetailsUuid: 'new-auth-uuid',
    };

    it('should create bank connection successfully', async () => {
      bankRegistryService.findById.mockResolvedValue(mockBank);
      repository.create.mockReturnValue(mockBankConnection);
      repository.save.mockResolvedValue(mockBankConnection);
      repository.findOne.mockResolvedValue(mockBankConnection);

      const result = await service.create(MOCK_USER_UUID, createRequest);

      expect(bankRegistryService.findById).toHaveBeenCalledWith(mockBankId);
      expect(repository.create).toHaveBeenCalledWith({
        userId: MOCK_USER_UUID,
        bankId: mockBankId,
        alias: createRequest.alias,
        authDetailsUuid: createRequest.authDetailsUuid,
        status: BankConnectionStatus.PENDING_AUTH,
      });
      expect(repository.save).toHaveBeenCalledWith(mockBankConnection);
      expect(result).toEqual(mockBankConnection);
    });

    it('should throw NotFoundException when bank not found', async () => {
      bankRegistryService.findById.mockResolvedValue(null);

      await expect(service.create(MOCK_USER_UUID, createRequest)).rejects.toThrow(
        new NotFoundException('Bank not found'),
      );
    });

    it('should throw NotFoundException when bank is not active', async () => {
      const inactiveBank = { ...mockBank, isActive: false };
      bankRegistryService.findById.mockResolvedValue(inactiveBank);

      await expect(service.create(MOCK_USER_UUID, createRequest)).rejects.toThrow(
        new NotFoundException('Bank is not available for new connections'),
      );
    });
  });

  describe('update', () => {
    const updateRequest = {
      alias: 'Updated Alias',
      status: BankConnectionStatus.ACTIVE,
    };

    it('should update bank connection successfully', async () => {
      const existingConnection = { ...mockBankConnection };
      const updatedConnection = { ...mockBankConnection, ...updateRequest };

      repository.findOne
        .mockResolvedValueOnce(existingConnection) // for findByUserIdAndConnectionId
        .mockResolvedValueOnce(updatedConnection); // for final fetch with relations
      repository.save.mockResolvedValue(updatedConnection);

      const result = await service.update(MOCK_USER_UUID, mockConnectionId, updateRequest);

      expect(repository.save).toHaveBeenCalledWith({
        ...existingConnection,
        ...updateRequest,
      });
      expect(result).toEqual(updatedConnection);
    });

    it('should throw NotFoundException when connection not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(MOCK_USER_UUID, mockConnectionId, updateRequest)).rejects.toThrow(
        new NotFoundException('Bank connection not found'),
      );
    });

    it('should update only provided fields', async () => {
      const partialUpdate = { alias: 'New Alias' };
      const existingConnection = { ...mockBankConnection };
      const updatedConnection = { ...mockBankConnection, alias: 'New Alias' };

      repository.findOne.mockResolvedValueOnce(existingConnection).mockResolvedValueOnce(updatedConnection);
      repository.save.mockResolvedValue(updatedConnection);

      const result = await service.update(MOCK_USER_UUID, mockConnectionId, partialUpdate);

      expect(repository.save).toHaveBeenCalledWith({
        ...existingConnection,
        alias: 'New Alias',
      });
      expect(result?.status).toBe(mockBankConnection.status); // Should remain unchanged
    });
  });

  describe('delete', () => {
    it('should delete bank connection successfully', async () => {
      repository.findOne.mockResolvedValue(mockBankConnection);
      repository.remove.mockResolvedValue(mockBankConnection);

      await service.delete(MOCK_USER_UUID, mockConnectionId);

      expect(repository.remove).toHaveBeenCalledWith(mockBankConnection);
    });

    it('should throw NotFoundException when connection not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete(MOCK_USER_UUID, mockConnectionId)).rejects.toThrow(
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
});
