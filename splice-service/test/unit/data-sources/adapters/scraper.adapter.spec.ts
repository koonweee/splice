import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BankConnection, BankConnectionStatus, DataSourceType } from '@splice/api';
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
    status: BankConnectionStatus.ACTIVE,
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
    it('should return undefined for scraper connections', async () => {
      const result = await adapter.initiateConnection();

      expect(result).toBeUndefined();
    });

    it('should log the initiation', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.initiateConnection();

      expect(logSpy).toHaveBeenCalledWith(`Initiating scraper connection`);
    });
  });

  describe('validateFinalizeConnectionPayload', () => {
    it('should validate payload with valid username and password', async () => {
      const validPayload = {
        username: 'testuser',
        password: 'testpass123',
      };

      await expect(adapter.validateFinalizeConnectionPayload(validPayload)).resolves.not.toThrow();
    });

    it('should throw error when username is missing', async () => {
      const invalidPayload = {
        password: 'testpass123',
      };

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow(
        'Validation failed: username: Required',
      );
    });

    it('should throw error when password is missing', async () => {
      const invalidPayload = {
        username: 'testuser',
      };

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow(
        'Validation failed: password: Required',
      );
    });

    it('should throw error when username is empty string', async () => {
      const invalidPayload = {
        username: '',
        password: 'testpass123',
      };

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow(
        'Validation failed: username: Username is required',
      );
    });

    it('should throw error when password is empty string', async () => {
      const invalidPayload = {
        username: 'testuser',
        password: '',
      };

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow(
        'Validation failed: password: Password is required',
      );
    });

    it('should throw error when payload is undefined', async () => {
      await expect(adapter.validateFinalizeConnectionPayload(undefined)).rejects.toThrow('Validation failed');
    });

    it('should throw error when payload is null', async () => {
      await expect(adapter.validateFinalizeConnectionPayload(null as unknown as object)).rejects.toThrow(
        'Validation failed',
      );
    });

    it('should throw error when both username and password are missing', async () => {
      const invalidPayload = {};

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow(
        'Validation failed: username: Required, password: Required',
      );
    });

    it('should log validation success for valid payload', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      const validPayload = {
        username: 'testuser',
        password: 'testpass123',
      };

      await adapter.validateFinalizeConnectionPayload(validPayload);

      expect(logSpy).toHaveBeenCalledWith('Validating finalize connection payload for scraper connection');
      expect(logSpy).toHaveBeenCalledWith('Scraper connection payload validation successful');
    });

    it('should log validation errors for invalid payload', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const invalidPayload = {
        username: '',
        password: '',
      };

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        'Scraper connection payload validation failed: username: Username is required, password: Password is required',
      );
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
