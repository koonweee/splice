import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BankSourceType } from '@splice/api';
import type { Repository } from 'typeorm';
import { BankEntity } from '../../../src/bank-registry/bank.entity';
import { BankRegistryService } from '../../../src/bank-registry/bank-registry.service';

describe('BankRegistryService', () => {
  let service: BankRegistryService;
  let repository: jest.Mocked<Repository<BankEntity>>;

  const mockBankRegistry: BankEntity = {
    id: 'test-bank-id',
    name: 'Test Bank',
    logoUrl: 'https://example.com/logo.png',
    sourceType: BankSourceType.SCRAPER,
    scraperIdentifier: 'test-bank',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankRegistryService,
        {
          provide: getRepositoryToken(BankEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BankRegistryService>(BankRegistryService);
    repository = module.get(getRepositoryToken(BankEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllActive', () => {
    it('should return all active banks ordered by name', async () => {
      const activeBanks = [mockBankRegistry];
      repository.find.mockResolvedValue(activeBanks);

      const result = await service.findAllActive();

      expect(repository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(activeBanks);
    });

    it('should return empty array when no active banks', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAllActive();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return bank when found', async () => {
      repository.findOne.mockResolvedValue(mockBankRegistry);

      const result = await service.findById('test-bank-id');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-bank-id' },
      });
      expect(result).toEqual(mockBankRegistry);
    });

    it('should return null when bank not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByScraperIdentifier', () => {
    it('should return active bank with matching scraper identifier', async () => {
      repository.findOne.mockResolvedValue(mockBankRegistry);

      const result = await service.findByScraperIdentifier('test-bank');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { scraperIdentifier: 'test-bank', isActive: true },
      });
      expect(result).toEqual(mockBankRegistry);
    });

    it('should return null when no matching active bank', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByScraperIdentifier('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('seedBankRegistry', () => {
    it('should skip seeding when banks already exist', async () => {
      repository.count.mockResolvedValue(1);

      await service.onModuleInit();

      expect(repository.count).toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should seed DBS bank when registry is empty', async () => {
      repository.count.mockResolvedValue(0);
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockBankRegistry);
      repository.save.mockResolvedValue(mockBankRegistry);

      await service.onModuleInit();

      expect(repository.count).toHaveBeenCalled();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { scraperIdentifier: 'dbs' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        name: 'DBS Bank',
        sourceType: BankSourceType.SCRAPER,
        scraperIdentifier: 'dbs',
        isActive: true,
      });
      expect(repository.save).toHaveBeenCalledWith(mockBankRegistry);
    });

    it('should not seed bank if it already exists', async () => {
      repository.count.mockResolvedValue(0);
      repository.findOne.mockResolvedValue(mockBankRegistry);

      await service.onModuleInit();

      expect(repository.count).toHaveBeenCalled();
      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
