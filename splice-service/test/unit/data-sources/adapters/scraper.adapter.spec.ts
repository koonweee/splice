import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BankConnection, DataSourceType } from '@splice/api';
import { ScraperAdapter } from '../../../../src/data-sources/adapters/scraper.adapter';
import { ScraperService } from '../../../../src/scraper/scraper.service';

describe('ScraperAdapter', () => {
  let adapter: ScraperAdapter;
  let scraperService: jest.Mocked<ScraperService>;

  const mockUserId = 'user-123';
  const mockConnectionId = 'connection-456';
  const mockBankConnection: BankConnection = {
    id: mockConnectionId,
    userId: mockUserId,
    bankId: 'bank-789',
    status: 'ACTIVE' as any,
    authDetailsUuid: 'auth-uuid-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    bank: {
      id: 'bank-789',
      name: 'DBS Bank',
      sourceType: DataSourceType.SCRAPER,
      scraperIdentifier: 'dbs',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockVaultAccessToken = 'vault-token-123';
  const mockAccountId = 'account-123';
  const mockStartDate = new Date('2024-01-01');
  const mockEndDate = new Date('2024-01-31');

  const mockScrapedData = {
    'DBS Savings Account': {
      transactions: [
        {
          date: '2024-01-15',
          reference: 'REF001',
          transactionRef1: 'Transfer',
          transactionRef2: 'From Checking',
          transactionRef3: 'Online Banking',
          amount: -100.5,
        },
        {
          date: '2024-01-20',
          reference: 'REF002',
          transactionRef1: 'Deposit',
          transactionRef2: 'Salary',
          transactionRef3: '',
          amount: 2500.0,
        },
      ],
      totalBalance: 5500.75,
      type: 'savings_or_checking',
    },
    'DBS Credit Card': {
      transactions: [
        {
          date: '2024-01-10',
          reference: 'REF003',
          transactionRef1: 'Purchase',
          transactionRef2: 'Grocery Store',
          transactionRef3: 'POS Transaction',
          amount: -45.25,
        },
      ],
      totalBalance: -1200.0,
      type: 'credit_card',
    },
  };

  beforeEach(async () => {
    const mockScraperService = {
      scrapeByBankConnection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperAdapter,
        {
          provide: ScraperService,
          useValue: mockScraperService,
        },
      ],
    }).compile();

    adapter = module.get<ScraperAdapter>(ScraperAdapter);
    scraperService = module.get(ScraperService);

    // Suppress logger output in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateConnection', () => {
    it('should return ready status for scraper connections', async () => {
      const result = await adapter.initiateConnection(mockUserId);

      expect(result).toEqual({
        status: 'ready',
      });
    });

    it('should log the initiation', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.initiateConnection(mockUserId);

      expect(logSpy).toHaveBeenCalledWith(`Initiating scraper connection for user ${mockUserId}`);
    });
  });

  describe('finalizeConnection', () => {
    it('should finalize connection with valid authDetailsUuid', async () => {
      const connectionData = { authDetailsUuid: 'auth-uuid-456' };

      const result = await adapter.finalizeConnection(connectionData);

      expect(result).toEqual({
        authDetailsUuid: 'auth-uuid-456',
        metadata: {
          sourceType: 'SCRAPER',
          connectionType: 'credential-based',
        },
      });
    });

    it('should throw error when authDetailsUuid is missing', async () => {
      const connectionData = {};

      await expect(adapter.finalizeConnection(connectionData)).rejects.toThrow(
        'authDetailsUuid is required for scraper connections',
      );
    });

    it('should throw error when authDetailsUuid is null', async () => {
      const connectionData = { authDetailsUuid: null };

      await expect(adapter.finalizeConnection(connectionData)).rejects.toThrow(
        'authDetailsUuid is required for scraper connections',
      );
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when connection has authDetailsUuid', async () => {
      const result = await adapter.getHealthStatus(mockBankConnection);

      expect(result).toEqual({
        healthy: true,
      });
    });

    it('should return unhealthy status when authDetailsUuid is missing', async () => {
      const connectionWithoutAuth = {
        ...mockBankConnection,
        authDetailsUuid: undefined,
      };

      const result = await adapter.getHealthStatus(connectionWithoutAuth as any);

      expect(result).toEqual({
        healthy: false,
        error: 'Missing authentication details UUID',
      });
    });

    it('should log health check operations', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.getHealthStatus(mockBankConnection);

      expect(logSpy).toHaveBeenCalledWith(`Checking health status for scraper connection ${mockConnectionId}`);
    });
  });

  describe('fetchAccounts', () => {
    it('should return placeholder account for scraper connection', async () => {
      const result = await adapter.fetchAccounts(mockBankConnection, mockVaultAccessToken);

      expect(result).toEqual([
        {
          id: `${mockConnectionId}-default`,
          name: 'DBS Bank',
          type: 'OTHER',
          institution: 'DBS Bank',
          metadata: {
            connectionId: mockConnectionId,
            scraperIdentifier: 'dbs',
          },
        },
      ]);
    });

    it('should log account fetching', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.fetchAccounts(mockBankConnection, mockVaultAccessToken);

      expect(logSpy).toHaveBeenCalledWith(`Fetching accounts for scraper connection ${mockConnectionId}`);
    });
  });

  describe('fetchTransactions', () => {
    beforeEach(() => {
      scraperService.scrapeByBankConnection.mockResolvedValue(mockScrapedData);
    });

    it('should fetch and transform transactions successfully', async () => {
      const result = await adapter.fetchTransactions(
        mockBankConnection,
        mockAccountId,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
      );

      expect(scraperService.scrapeByBankConnection).toHaveBeenCalledWith(
        mockUserId,
        mockConnectionId,
        mockVaultAccessToken,
      );

      expect(result).toHaveLength(3); // 2 savings + 1 credit card transaction

      // Check first transaction (credit - negative amount becomes positive)
      expect(result[0]).toEqual({
        id: `${mockConnectionId}-DBS Savings Account-2024-01-15-REF001`,
        accountId: `${mockConnectionId}-DBS Savings Account`,
        date: '2024-01-15',
        description: 'REF001 - Transfer - From Checking - Online Banking',
        amount: 100.5, // Absolute value
        currency: 'SGD',
        type: 'CREDIT', // Negative amount = CREDIT
        metadata: {
          originalAmount: -100.5,
          reference: 'REF001',
          transactionRef1: 'Transfer',
          transactionRef2: 'From Checking',
          transactionRef3: 'Online Banking',
          accountName: 'DBS Savings Account',
          accountBalance: 5500.75,
          accountType: 'savings_or_checking',
        },
      });

      // Check second transaction (debit - positive amount)
      expect(result[1]).toEqual({
        id: `${mockConnectionId}-DBS Savings Account-2024-01-20-REF002`,
        accountId: `${mockConnectionId}-DBS Savings Account`,
        date: '2024-01-20',
        description: 'REF002 - Deposit - Salary',
        amount: 2500.0,
        currency: 'SGD',
        type: 'DEBIT', // Positive amount = DEBIT
        metadata: {
          originalAmount: 2500.0,
          reference: 'REF002',
          transactionRef1: 'Deposit',
          transactionRef2: 'Salary',
          transactionRef3: '',
          accountName: 'DBS Savings Account',
          accountBalance: 5500.75,
          accountType: 'savings_or_checking',
        },
      });

      // Check credit card transaction
      expect(result[2]).toEqual({
        id: `${mockConnectionId}-DBS Credit Card-2024-01-10-REF003`,
        accountId: `${mockConnectionId}-DBS Credit Card`,
        date: '2024-01-10',
        description: 'REF003 - Purchase - Grocery Store - POS Transaction',
        amount: 45.25, // Absolute value
        currency: 'SGD',
        type: 'CREDIT', // Negative amount = CREDIT
        metadata: {
          originalAmount: -45.25,
          reference: 'REF003',
          transactionRef1: 'Purchase',
          transactionRef2: 'Grocery Store',
          transactionRef3: 'POS Transaction',
          accountName: 'DBS Credit Card',
          accountBalance: -1200.0,
          accountType: 'credit_card',
        },
      });
    });

    it('should handle empty scraped data', async () => {
      scraperService.scrapeByBankConnection.mockResolvedValue({});

      const result = await adapter.fetchTransactions(
        mockBankConnection,
        mockAccountId,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
      );

      expect(result).toEqual([]);
    });

    it('should handle scraped data with invalid account data', async () => {
      const invalidScrapedData = {
        'Invalid Account': null,
        'Another Invalid': 'not an object',
        'Valid Account': {
          transactions: [],
          totalBalance: 0,
          type: 'savings_or_checking',
        },
      };

      scraperService.scrapeByBankConnection.mockResolvedValue(invalidScrapedData);

      const result = await adapter.fetchTransactions(
        mockBankConnection,
        mockAccountId,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
      );

      expect(result).toEqual([]);
    });

    it('should handle scraped data with missing transactions array', async () => {
      const dataWithoutTransactions = {
        'Account Without Transactions': {
          totalBalance: 100,
          type: 'savings_or_checking',
        },
        'Account With Invalid Transactions': {
          transactions: 'not an array',
          totalBalance: 200,
          type: 'savings_or_checking',
        },
      };

      scraperService.scrapeByBankConnection.mockResolvedValue(dataWithoutTransactions);

      const result = await adapter.fetchTransactions(
        mockBankConnection,
        mockAccountId,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
      );

      expect(result).toEqual([]);
    });

    it('should throw error when scraper service fails', async () => {
      const scraperError = new Error('Scraping failed');
      scraperService.scrapeByBankConnection.mockRejectedValue(scraperError);

      await expect(
        adapter.fetchTransactions(mockBankConnection, mockAccountId, mockStartDate, mockEndDate, mockVaultAccessToken),
      ).rejects.toThrow('Scraping failed');

      expect(scraperService.scrapeByBankConnection).toHaveBeenCalledWith(
        mockUserId,
        mockConnectionId,
        mockVaultAccessToken,
      );
    });

    it('should log transaction fetching', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.fetchTransactions(
        mockBankConnection,
        mockAccountId,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
      );

      expect(logSpy).toHaveBeenCalledWith(
        `Fetching transactions for scraper connection ${mockConnectionId}, account ${mockAccountId} from ${mockStartDate.toISOString()} to ${mockEndDate.toISOString()}`,
      );
    });
  });

  describe('buildTransactionDescription', () => {
    it('should build description from all non-empty reference fields', () => {
      const transaction = {
        reference: 'REF001',
        transactionRef1: 'Transfer',
        transactionRef2: 'From Checking',
        transactionRef3: 'Online Banking',
      };

      // Access the private method via any casting for testing
      const description = (adapter as any).buildTransactionDescription(transaction);

      expect(description).toBe('REF001 - Transfer - From Checking - Online Banking');
    });

    it('should skip empty and whitespace-only reference fields', () => {
      const transaction = {
        reference: 'REF002',
        transactionRef1: 'Deposit',
        transactionRef2: '',
        transactionRef3: '   ',
      };

      const description = (adapter as any).buildTransactionDescription(transaction);

      expect(description).toBe('REF002 - Deposit');
    });

    it('should handle all empty reference fields', () => {
      const transaction = {
        reference: '',
        transactionRef1: '',
        transactionRef2: '',
        transactionRef3: '',
      };

      const description = (adapter as any).buildTransactionDescription(transaction);

      expect(description).toBe('');
    });
  });

  describe('fetchTransactionsWithToken', () => {
    beforeEach(() => {
      scraperService.scrapeByBankConnection.mockResolvedValue(mockScrapedData);
    });

    it('should delegate to fetchTransactions method', async () => {
      const result = await adapter.fetchTransactionsWithToken(
        mockBankConnection,
        mockAccountId,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
      );

      expect(scraperService.scrapeByBankConnection).toHaveBeenCalledWith(
        mockUserId,
        mockConnectionId,
        mockVaultAccessToken,
      );

      expect(result).toHaveLength(3);
    });

    it('should log the operation with vault token reference', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.fetchTransactionsWithToken(
        mockBankConnection,
        mockAccountId,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
      );

      expect(logSpy).toHaveBeenCalledWith(
        `Fetching transactions with vault token for scraper connection ${mockConnectionId}, account ${mockAccountId}`,
      );
    });

    it('should log error and rethrow when scraper service fails', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const scraperError = new Error('Network timeout');
      scraperService.scrapeByBankConnection.mockRejectedValue(scraperError);

      await expect(
        adapter.fetchTransactionsWithToken(
          mockBankConnection,
          mockAccountId,
          mockStartDate,
          mockEndDate,
          mockVaultAccessToken,
        ),
      ).rejects.toThrow('Network timeout');

      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to fetch transactions for connection ${mockConnectionId}: Network timeout`,
      );
    });
  });
});
