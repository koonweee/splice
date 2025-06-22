import { Test, type TestingModule } from '@nestjs/testing';
import { Bank, BankSourceType } from '@splice/api';
import { BankEntity } from '../../../src/bank-registry/bank.entity';
import { BankRegistryController } from '../../../src/bank-registry/bank-registry.controller';
import { BankRegistryService } from '../../../src/bank-registry/bank-registry.service';

describe('BankRegistryController', () => {
  let controller: BankRegistryController;
  let bankRegistryService: jest.Mocked<BankRegistryService>;

  const mockBanks: Bank[] = [
    {
      id: 'bank-1',
      name: 'DBS Bank',
      logoUrl: 'https://example.com/dbs-logo.png',
      sourceType: BankSourceType.SCRAPER,
      scraperIdentifier: 'dbs',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bank-2',
      name: 'OCBC Bank',
      logoUrl: undefined,
      sourceType: BankSourceType.PLAID,
      scraperIdentifier: undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockBankRegistryService = {
      findAllActive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankRegistryController],
      providers: [
        {
          provide: BankRegistryService,
          useValue: mockBankRegistryService,
        },
      ],
    }).compile();

    controller = module.get<BankRegistryController>(BankRegistryController);
    bankRegistryService = module.get(BankRegistryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableBanks', () => {
    it('should return all active banks in proper response format', async () => {
      bankRegistryService.findAllActive.mockResolvedValue(mockBanks);

      const result = await controller.getAvailableBanks();

      expect(bankRegistryService.findAllActive).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 'bank-1',
          name: 'DBS Bank',
          logoUrl: 'https://example.com/dbs-logo.png',
          sourceType: BankSourceType.SCRAPER,
        },
        {
          id: 'bank-2',
          name: 'OCBC Bank',
          logoUrl: undefined,
          sourceType: BankSourceType.PLAID,
        },
      ]);
    });

    it('should return empty array when no active banks', async () => {
      bankRegistryService.findAllActive.mockResolvedValue([]);

      const result = await controller.getAvailableBanks();

      expect(result).toEqual([]);
    });

    it('should handle banks with missing optional fields', async () => {
      const bankWithoutLogo: Bank = {
        id: 'bank-3',
        name: 'Test Bank',
        logoUrl: undefined,
        sourceType: BankSourceType.SIMPLEFIN,
        scraperIdentifier: undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      bankRegistryService.findAllActive.mockResolvedValue([bankWithoutLogo]);

      const result = await controller.getAvailableBanks();

      expect(result).toEqual([
        {
          id: 'bank-3',
          name: 'Test Bank',
          logoUrl: undefined,
          sourceType: BankSourceType.SIMPLEFIN,
        },
      ]);
    });
  });
});
