import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { Bank, BankConnection, BankConnectionStatus, DataSourceType } from 'splice-api';
import type { Browser, Page } from 'playwright';
import { BankConnectionService } from '../../../src/bank-connections/bank-connection.service';
import { BankRegistryService } from '../../../src/bank-registry/bank-registry.service';
import { ScraperService } from '../../../src/scraper/scraper.service';
import type { ScraperStrategy } from '../../../src/scraper/strategies/types';
import { VaultService } from '../../../src/vault/vault.service';
import { MOCK_USER_ID } from '../../mocks/mocks';

// Mock chromium.launch
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

describe('ScraperService', () => {
  let service: ScraperService;
  let bankConnectionService: jest.Mocked<BankConnectionService>;
  let vaultService: jest.Mocked<VaultService>;
  const mockConnectionId = 'test-connection-id';
  const mockBankId = 'test-bank-id';
  const mockAccessToken = 'test-access-token';
  const mockSecret = 'username=test&password=test123';
  const { chromium } = require('playwright');

  const mockStrategy: ScraperStrategy = {
    name: 'test-bank',
    startUrl: 'https://test-bank.com/login',
    scrape: jest.fn(),
  };

  const mockBank: Bank = {
    id: mockBankId,
    name: 'Test Bank',
    logoUrl: undefined,
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

  const mockPage = {
    goto: jest.fn(),
    waitForLoadState: jest.fn(),
    close: jest.fn(),
  } as unknown as jest.Mocked<Page>;

  const mockBrowser = {
    newPage: jest.fn(),
    close: jest.fn(),
  } as unknown as jest.Mocked<Browser>;

  beforeEach(async () => {
    const mockBankConnectionService = {
      findByUserIdAndConnectionId: jest.fn(),
      updateStatus: jest.fn(),
      updateLastSync: jest.fn(),
    };

    const mockBankRegistryService = {
      findById: jest.fn(),
    };

    const mockVaultService = {
      getSecret: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        {
          provide: 'SCRAPER_STRATEGIES',
          useValue: [mockStrategy],
        },
        {
          provide: BankConnectionService,
          useValue: mockBankConnectionService,
        },
        {
          provide: BankRegistryService,
          useValue: mockBankRegistryService,
        },
        {
          provide: VaultService,
          useValue: mockVaultService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    module.useLogger(false); // Disable logging for cleaner test output

    service = module.get<ScraperService>(ScraperService);
    bankConnectionService = module.get(BankConnectionService);
    vaultService = module.get(VaultService);

    // Set up browser mock
    chromium.launch.mockResolvedValue(mockBrowser);
    mockBrowser.newPage.mockResolvedValue(mockPage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scrapeByBankConnection', () => {
    const mockScrapedData = {
      transactions: [
        {
          date: '2023-01-01',
          description: 'Test Transaction',
          amount: 100.0,
        },
      ],
    };

    beforeEach(() => {
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(mockBankConnection);
      vaultService.getSecret.mockResolvedValue(mockSecret);
      (mockStrategy.scrape as jest.Mock).mockResolvedValue(mockScrapedData);
    });

    it('should scrape bank connection successfully', async () => {
      const result = await service.scrapeByBankConnection(MOCK_USER_ID, mockConnectionId, mockAccessToken);

      expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
      expect(bankConnectionService.findByUserIdAndConnectionId).toHaveBeenCalledWith(MOCK_USER_ID, mockConnectionId);
      expect(bankConnectionService.updateStatus).toHaveBeenCalledWith(mockConnectionId, BankConnectionStatus.ACTIVE);
      expect(vaultService.getSecret).toHaveBeenCalledWith('auth-details-uuid', mockAccessToken);
      expect(mockPage.goto).toHaveBeenCalledWith('https://test-bank.com/login');
      expect(mockPage.waitForLoadState).toHaveBeenCalledWith('networkidle');
      expect(mockStrategy.scrape).toHaveBeenCalledWith(mockSecret, mockPage, expect.any(Object));
      expect(bankConnectionService.updateLastSync).toHaveBeenCalledWith(mockConnectionId);
      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(result).toEqual(mockScrapedData);
    });

    it('should throw HttpException when bank connection not found', async () => {
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(null);

      await expect(service.scrapeByBankConnection(MOCK_USER_ID, mockConnectionId, mockAccessToken)).rejects.toThrow(
        new HttpException('Bank connection not found', 404),
      );
    });

    it('should throw HttpException when bank connection is inactive', async () => {
      const inactiveConnection = { ...mockBankConnection, status: BankConnectionStatus.INACTIVE };
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(inactiveConnection);

      await expect(service.scrapeByBankConnection(MOCK_USER_ID, mockConnectionId, mockAccessToken)).rejects.toThrow(
        new HttpException('Bank connection is inactive', 400),
      );
    });

    it('should throw HttpException when bank has no scraper identifier', async () => {
      const bankWithoutScraper = { ...mockBank, scraperIdentifier: undefined };
      const connectionWithoutScraper = { ...mockBankConnection, bank: bankWithoutScraper };
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(connectionWithoutScraper);

      await expect(service.scrapeByBankConnection(MOCK_USER_ID, mockConnectionId, mockAccessToken)).rejects.toThrow(
        new HttpException('Bank is not configured for scraping', 400),
      );
    });

    it('should throw HttpException when no scraper strategy found', async () => {
      const bankWithUnknownScraper = { ...mockBank, scraperIdentifier: 'unknown-bank' };
      const connectionWithUnknownScraper = { ...mockBankConnection, bank: bankWithUnknownScraper };
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(connectionWithUnknownScraper);

      await expect(service.scrapeByBankConnection(MOCK_USER_ID, mockConnectionId, mockAccessToken)).rejects.toThrow(
        new HttpException('No scraper strategy found for bank: Test Bank', 404),
      );
    });

    it('should update connection status to error on scraping failure', async () => {
      const scrapingError = new Error('Scraping failed');
      (mockStrategy.scrape as jest.Mock).mockRejectedValue(scrapingError);

      await expect(service.scrapeByBankConnection(MOCK_USER_ID, mockConnectionId, mockAccessToken)).rejects.toThrow(
        HttpException,
      );

      expect(bankConnectionService.updateStatus).toHaveBeenCalledWith(mockConnectionId, BankConnectionStatus.ERROR);
      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should close page even when scraping throws error', async () => {
      const scrapingError = new Error('Network error');
      mockPage.goto.mockRejectedValue(scrapingError);

      await expect(service.scrapeByBankConnection(MOCK_USER_ID, mockConnectionId, mockAccessToken)).rejects.toThrow(
        HttpException,
      );

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('getAvailableStrategies', () => {
    it('should return list of available strategy names', () => {
      const result = service.getAvailableStrategies();

      expect(result).toEqual(['test-bank']);
    });
  });
});
