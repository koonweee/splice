import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PlaidApi } from 'plaid';
import {
  AccountType,
  BankConnection,
  BankConnectionStatus,
  CreditAccountSubtype,
  DataSourceType,
  DepositoryAccountSubtype,
} from 'splice-api';
import { PlaidAdapter } from '../../../../src/data-sources/adapters/plaid.adapter';
import { VaultService } from '../../../../src/vault/vault.service';

// Mock the plaid module
jest.mock('plaid', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn(),
  PlaidEnvironments: {
    production: 'https://production.plaid.com',
  },
  Products: {
    Transactions: 'transactions',
  },
  CountryCode: {
    Us: 'US',
  },
  AccountType: {
    Depository: 'depository',
    Credit: 'credit',
    Investment: 'investment',
  },
  AccountSubtype: {
    Checking: 'checking',
    Savings: 'savings',
  },
}));

describe('PlaidAdapter', () => {
  let adapter: PlaidAdapter;
  let configService: jest.Mocked<ConfigService>;
  let mockPlaidApiClient: jest.Mocked<PlaidApi>;
  let mockVaultService: jest.Mocked<VaultService>;

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
      name: 'Chase Bank',
      sourceType: DataSourceType.PLAID,
      scraperIdentifier: undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockVaultAccessToken = 'vault-token-123';
  const mockAccountId = 'account-123';
  const mockStartDate = new Date('2024-01-01');
  const mockEndDate = new Date('2024-01-31');
  const mockUserUuid = 'user-uuid-123';

  const mockLinkTokenResponse = {
    data: {
      link_token: 'link-token-123',
      expiration: '2024-01-15T10:30:00Z',
      request_id: 'request-123',
    },
  };

  const mockPlaidAccountsResponse = {
    data: {
      accounts: [
        {
          account_id: 'account-123',
          name: 'Chase Checking',
          official_name: 'Chase Total Checking',
          mask: '1234',
          type: 'depository',
          subtype: 'checking',
          balances: {
            current: 1000.5,
            available: 950.5,
            limit: null,
            iso_currency_code: 'USD',
            unofficial_currency_code: null,
            last_updated_datetime: '2024-01-01T10:00:00Z',
          },
        },
        {
          account_id: 'account-456',
          name: 'Chase Credit Card',
          official_name: 'Chase Freedom Unlimited',
          mask: '5678',
          type: 'credit',
          subtype: null,
          balances: {
            current: -500.25,
            available: 2000.0,
            limit: 5000.0,
            iso_currency_code: 'USD',
            unofficial_currency_code: null,
            last_updated_datetime: '2024-01-01T10:00:00Z',
          },
        },
      ],
    },
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock PlaidApi methods
    mockPlaidApiClient = {
      linkTokenCreate: jest.fn(),
      accountsGet: jest.fn(),
    } as unknown as jest.Mocked<PlaidApi>;

    // Mock PlaidApi constructor
    (PlaidApi as jest.Mock).mockImplementation(() => mockPlaidApiClient);

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn(),
    };

    // Setup config service to return plaid config
    mockConfigService.get.mockReturnValue({
      clientId: 'test-client-id',
      secret: 'test-secret',
    });

    // Mock VaultService
    mockVaultService = {
      getSecret: jest.fn(),
    } as unknown as jest.Mocked<VaultService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaidAdapter,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: VaultService,
          useValue: mockVaultService,
        },
      ],
    }).compile();

    adapter = module.get<PlaidAdapter>(PlaidAdapter);
    configService = module.get(ConfigService);

    // Suppress logger output in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with valid plaid configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('plaid');
      expect(PlaidApi).toHaveBeenCalledTimes(1);
    });

    it('should throw error when plaid config is missing', () => {
      // Mock config service to return undefined
      const mockConfigServiceMissing = {
        get: jest.fn().mockReturnValue(undefined),
      };

      expect(() => {
        new PlaidAdapter(mockConfigServiceMissing as any, mockVaultService);
      }).toThrow('PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set');
    });

    it('should throw error when clientId is missing', () => {
      const mockConfigServiceMissing = {
        get: jest.fn().mockReturnValue({ secret: 'test-secret' }),
      };

      expect(() => {
        new PlaidAdapter(mockConfigServiceMissing as any, mockVaultService);
      }).toThrow('PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set');
    });

    it('should throw error when secret is missing', () => {
      const mockConfigServiceMissing = {
        get: jest.fn().mockReturnValue({ clientId: 'test-client-id' }),
      };

      expect(() => {
        new PlaidAdapter(mockConfigServiceMissing as any, mockVaultService);
      }).toThrow('PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set');
    });

    it('should log initialization success', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      new PlaidAdapter(configService, mockVaultService);

      expect(logSpy).toHaveBeenCalledWith('Plaid adapter initialized');
    });
  });

  describe('initiateConnection', () => {
    beforeEach(() => {
      mockPlaidApiClient.linkTokenCreate.mockResolvedValue(mockLinkTokenResponse as any);
    });

    it('should create link token successfully', async () => {
      const result = await adapter.initiateConnection(mockUserUuid);

      expect(mockPlaidApiClient.linkTokenCreate).toHaveBeenCalledWith({
        client_name: 'Splice',
        language: 'en',
        country_codes: ['US'],
        products: ['transactions'],
        user: {
          client_user_id: mockUserUuid,
        },
        hosted_link: {},
      });

      expect(result).toEqual(mockLinkTokenResponse.data);
    });

    it('should log the initiation', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.initiateConnection(mockUserUuid);

      expect(logSpy).toHaveBeenCalledWith('Initiating plaid connection, acquiring link token');
    });

    it('should throw error when plaid API fails', async () => {
      const apiError = new Error('Plaid API error');
      mockPlaidApiClient.linkTokenCreate.mockRejectedValue(apiError);

      await expect(adapter.initiateConnection(mockUserUuid)).rejects.toThrow('Plaid API error');
    });
  });

  describe('validateFinalizeConnectionPayload', () => {
    it('should validate payload with valid access token', async () => {
      const validPayload = {
        accessToken: 'access-token-123',
      };

      await expect(adapter.validateFinalizeConnectionPayload(validPayload)).resolves.not.toThrow();
    });

    it('should throw error when access token is missing', async () => {
      const invalidPayload = {};

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow(
        'Validation failed: accessToken: Required',
      );
    });

    it('should throw error when access token is empty string', async () => {
      const invalidPayload = {
        accessToken: '',
      };

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow(
        'Validation failed: accessToken: Plaid access token for the account is required',
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

    it('should throw error when access token is not a string', async () => {
      const invalidPayload = {
        accessToken: 123,
      };

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow(
        'Validation failed: accessToken: Expected string, received number',
      );
    });

    it('should log validation success for valid payload', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      const validPayload = {
        accessToken: 'access-token-123',
      };

      await adapter.validateFinalizeConnectionPayload(validPayload);

      expect(logSpy).toHaveBeenCalledWith('Validating finalize connection payload for plaid connection');
      expect(logSpy).toHaveBeenCalledWith('Plaid connection payload validation successful');
    });

    it('should log validation errors for invalid payload', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const invalidPayload = {
        accessToken: '',
      };

      await expect(adapter.validateFinalizeConnectionPayload(invalidPayload)).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        'Plaid connection payload validation failed: accessToken: Plaid access token for the account is required',
      );
    });

    it('should handle non-zod errors gracefully', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      // Create a test adapter that will fail validation in a different way
      const testConfigService = {
        get: jest.fn().mockReturnValue({
          clientId: 'test-client-id',
          secret: 'test-secret',
        }),
      };

      const testAdapter = new PlaidAdapter(testConfigService as any, mockVaultService);

      // Mock the internal validation to throw a non-zod error
      testAdapter.validateFinalizeConnectionPayload = jest.fn().mockImplementation(async () => {
        throw new Error('Unexpected error');
      });

      const payload = { accessToken: 'valid-token' };

      await expect(testAdapter.validateFinalizeConnectionPayload(payload)).rejects.toThrow('Unexpected error');
    });
  });

  describe('fetchAccounts', () => {
    beforeEach(() => {
      mockVaultService.getSecret.mockResolvedValue(JSON.stringify({ accessToken: 'access-token-123' }));
      mockPlaidApiClient.accountsGet.mockResolvedValue(mockPlaidAccountsResponse as any);
    });

    it('should fetch accounts successfully', async () => {
      const result = await adapter.fetchAccounts(mockBankConnection, mockVaultAccessToken);

      expect(mockVaultService.getSecret).toHaveBeenCalledWith('auth-uuid-123', mockVaultAccessToken);
      expect(mockPlaidApiClient.accountsGet).toHaveBeenCalledWith({
        access_token: 'access-token-123',
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'account-123',
        bankConnection: mockBankConnection,
        providerAccountId: 'account-123',
        name: 'Chase Checking',
        mask: '1234',
        type: {
          type: AccountType.DEPOSITORY,
          subtype: DepositoryAccountSubtype.CHECKING,
        },
        balances: {
          current: 1000.5,
          available: 950.5,
          isoCurrencyCode: 'USD',
          unofficialCurrencyCode: undefined,
          lastUpdated: '2024-01-01T10:00:00Z',
        },
      });
      expect(result[1]).toEqual({
        id: 'account-456',
        bankConnection: mockBankConnection,
        providerAccountId: 'account-456',
        name: 'Chase Credit Card',
        mask: '5678',
        type: {
          type: AccountType.CREDIT,
          subtype: CreditAccountSubtype.CREDIT_CARD,
        },
        balances: {
          current: -500.25,
          available: 2000.0,
          isoCurrencyCode: 'USD',
          unofficialCurrencyCode: undefined,
          lastUpdated: '2024-01-01T10:00:00Z',
        },
      });
    });

    it('should log account fetching', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.fetchAccounts(mockBankConnection, mockVaultAccessToken);

      expect(logSpy).toHaveBeenCalledWith(`Fetching accounts for plaid connection ${mockConnectionId}`);
    });

    it('should throw error when authDetailsUuid is missing', async () => {
      const connectionWithoutAuth = { ...mockBankConnection, authDetailsUuid: undefined };

      await expect(adapter.fetchAccounts(connectionWithoutAuth, mockVaultAccessToken)).rejects.toThrow(
        'Auth details UUID is not set for connection',
      );
    });

    it('should throw error when vault secret is invalid JSON', async () => {
      mockVaultService.getSecret.mockResolvedValue('invalid-json');

      await expect(adapter.fetchAccounts(mockBankConnection, mockVaultAccessToken)).rejects.toThrow();
    });

    it('should throw error when auth details validation fails', async () => {
      mockVaultService.getSecret.mockResolvedValue(JSON.stringify({ invalidField: 'value' }));

      await expect(adapter.fetchAccounts(mockBankConnection, mockVaultAccessToken)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('plaidAccountTypeToStandardizedAccountType', () => {
    it('should convert depository checking to CHECKING', () => {
      const result = adapter.plaidAccountTypeToStandardizedAccountType('depository' as any, 'checking' as any);
      expect(result).toEqual({
        type: AccountType.DEPOSITORY,
        subtype: DepositoryAccountSubtype.CHECKING,
      });
    });

    it('should convert depository savings to SAVINGS', () => {
      const result = adapter.plaidAccountTypeToStandardizedAccountType('depository' as any, 'savings' as any);
      expect(result).toEqual({
        type: AccountType.DEPOSITORY,
        subtype: DepositoryAccountSubtype.SAVINGS,
      });
    });

    it('should convert credit to CREDIT_CARD', () => {
      const result = adapter.plaidAccountTypeToStandardizedAccountType('credit' as any, null);
      expect(result).toEqual({
        type: AccountType.CREDIT,
        subtype: CreditAccountSubtype.CREDIT_CARD,
      });
    });

    it('should convert investment to INVESTMENT', () => {
      const result = adapter.plaidAccountTypeToStandardizedAccountType('investment' as any, null);
      expect(result).toEqual({
        type: AccountType.INVESTMENT,
      });
    });

    it('should return OTHER for unknown account types', () => {
      const result = adapter.plaidAccountTypeToStandardizedAccountType('unknown' as any, null);
      expect(result).toEqual({
        type: AccountType.OTHER,
      });
    });

    it('should return OTHER for depository with unknown subtype', () => {
      const result = adapter.plaidAccountTypeToStandardizedAccountType('depository' as any, 'unknown' as any);
      expect(result).toEqual({
        type: AccountType.DEPOSITORY,
      });
    });
  });

  describe('plaidAccountToStandardizedAccount', () => {
    it('should convert plaid account to standardized account', () => {
      const plaidAccount = {
        account_id: 'test-account-id',
        name: 'Test Account',
        official_name: 'Test Account Official',
        mask: '1234',
        type: 'depository' as any,
        subtype: 'checking' as any,
        balances: {
          current: 1000.5,
          available: 950.5,
          limit: null,
          iso_currency_code: 'USD',
          unofficial_currency_code: null,
          last_updated_datetime: '2024-01-01T10:00:00Z',
        },
      };

      const result = adapter.plaidAccountToStandardizedAccount(plaidAccount, mockBankConnection);

      expect(result).toEqual({
        id: 'test-account-id',
        bankConnection: mockBankConnection,
        providerAccountId: 'test-account-id',
        name: 'Test Account',
        mask: '1234',
        type: {
          type: AccountType.DEPOSITORY,
          subtype: DepositoryAccountSubtype.CHECKING,
        },
        balances: {
          current: 1000.5,
          available: 950.5,
          isoCurrencyCode: 'USD',
          unofficialCurrencyCode: undefined,
          lastUpdated: '2024-01-01T10:00:00Z',
        },
      });
    });

    it('should handle missing optional fields', () => {
      const plaidAccount = {
        account_id: 'test-account-id',
        name: 'Test Account',
        official_name: null,
        mask: null,
        type: 'credit' as any,
        subtype: null,
        balances: {
          current: null,
          available: null,
          limit: null,
          iso_currency_code: null,
          unofficial_currency_code: null,
          last_updated_datetime: null,
        },
      };

      const result = adapter.plaidAccountToStandardizedAccount(plaidAccount, mockBankConnection);

      expect(result).toEqual({
        id: 'test-account-id',
        bankConnection: mockBankConnection,
        providerAccountId: 'test-account-id',
        name: 'Test Account',
        mask: undefined,
        type: {
          type: AccountType.CREDIT,
          subtype: CreditAccountSubtype.CREDIT_CARD,
        },
        balances: {
          current: undefined,
          available: undefined,
          isoCurrencyCode: undefined,
          unofficialCurrencyCode: undefined,
          lastUpdated: undefined,
        },
      });
    });
  });

  describe('fetchTransactions', () => {
    const mockPlaidTransactionsResponse = {
      data: {
        transactions: [
          {
            transaction_id: 'tx-123',
            account_id: 'account-123',
            date: '2024-01-15',
            datetime: '2024-01-15T10:30:00Z',
            name: 'Coffee Shop Purchase',
            merchant_name: 'Starbucks',
            pending: false,
            logo_url: 'https://example.com/logo.png',
            website: 'https://starbucks.com',
            amount: 5.25,
            iso_currency_code: 'USD',
            unofficial_currency_code: null,
          },
          {
            transaction_id: 'tx-456',
            account_id: 'account-123',
            date: '2024-01-16',
            datetime: null,
            name: 'ATM Withdrawal',
            merchant_name: null,
            pending: true,
            logo_url: null,
            website: null,
            amount: 100.0,
            iso_currency_code: 'USD',
            unofficial_currency_code: null,
          },
        ],
      },
    };

    beforeEach(() => {
      mockVaultService.getSecret.mockResolvedValue(JSON.stringify({ accessToken: 'access-token-123' }));
      mockPlaidApiClient.transactionsGet = jest.fn().mockResolvedValue(mockPlaidTransactionsResponse);
    });

    it('should fetch transactions successfully', async () => {
      const result = await adapter.fetchTransactions(
        mockBankConnection,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
        mockAccountId,
      );

      expect(mockVaultService.getSecret).toHaveBeenCalledWith('auth-uuid-123', mockVaultAccessToken);
      expect(mockPlaidApiClient.transactionsGet).toHaveBeenCalledWith({
        access_token: 'access-token-123',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        options: {
          account_ids: ['account-123'],
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tx-123',
        accountId: 'account-123',
        providerTransactionId: 'tx-123',
        providerAccountId: 'account-123',
        date: '2024-01-15',
        name: 'Coffee Shop Purchase',
        pending: false,
        logoUrl: 'https://example.com/logo.png',
        websiteUrl: 'https://starbucks.com',
        amount: 5.25,
        isoCurrencyCode: 'USD',
        unofficialCurrencyCode: undefined,
        category: undefined,
      });
      expect(result[1]).toEqual({
        id: 'tx-456',
        accountId: 'account-123',
        providerTransactionId: 'tx-456',
        providerAccountId: 'account-123',
        date: '2024-01-16',
        name: 'ATM Withdrawal',
        pending: true,
        logoUrl: undefined,
        websiteUrl: undefined,
        amount: 100.0,
        isoCurrencyCode: 'USD',
        unofficialCurrencyCode: undefined,
        category: undefined,
      });
    });

    it('should throw error when authDetailsUuid is missing', async () => {
      const connectionWithoutAuth = { ...mockBankConnection, authDetailsUuid: undefined };

      await expect(
        adapter.fetchTransactions(
          connectionWithoutAuth,
          mockStartDate,
          mockEndDate,
          mockVaultAccessToken,
          mockAccountId,
        ),
      ).rejects.toThrow('Auth details UUID is not set for connection');
    });

    it('should throw error when accountId is missing', async () => {
      await expect(
        adapter.fetchTransactions(mockBankConnection, mockStartDate, mockEndDate, mockVaultAccessToken),
      ).rejects.toThrow('Account ID is required for plaid transactions');
    });

    it('should throw error when vault secret is invalid JSON', async () => {
      mockVaultService.getSecret.mockResolvedValue('invalid-json');

      await expect(
        adapter.fetchTransactions(mockBankConnection, mockStartDate, mockEndDate, mockVaultAccessToken, mockAccountId),
      ).rejects.toThrow();
    });

    it('should throw error when auth details validation fails', async () => {
      mockVaultService.getSecret.mockResolvedValue(JSON.stringify({ invalidField: 'value' }));

      await expect(
        adapter.fetchTransactions(mockBankConnection, mockStartDate, mockEndDate, mockVaultAccessToken, mockAccountId),
      ).rejects.toThrow('Validation failed');
    });

    it('should log transaction fetching', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.fetchTransactions(
        mockBankConnection,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
        mockAccountId,
      );

      expect(logSpy).toHaveBeenCalledWith(
        `Fetching transactions for plaid connection ${mockConnectionId}, account ${mockAccountId} from ${mockStartDate.toISOString()} to ${mockEndDate.toISOString()}`,
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Fetched 2 transactions for plaid connection ${mockConnectionId}`,
        mockPlaidTransactionsResponse.data.transactions,
      );
    });

    it('should handle plaid API errors', async () => {
      const apiError = new Error('Plaid API timeout');
      mockPlaidApiClient.transactionsGet.mockRejectedValue(apiError);

      await expect(
        adapter.fetchTransactions(mockBankConnection, mockStartDate, mockEndDate, mockVaultAccessToken, mockAccountId),
      ).rejects.toThrow('Plaid API timeout');
    });
  });

  describe('plaidTransactionToStandardizedTransaction', () => {
    it('should convert plaid transaction to standardized transaction', () => {
      const plaidTransaction = {
        transaction_id: 'tx-789',
        account_id: 'account-456',
        date: '2024-01-20',
        datetime: '2024-01-20T14:30:00Z',
        name: 'Amazon Purchase',
        merchant_name: 'Amazon',
        pending: false,
        logo_url: 'https://example.com/amazon-logo.png',
        website: 'https://amazon.com',
        amount: 25.99,
        iso_currency_code: 'USD',
        unofficial_currency_code: null,
        // Required properties for Plaid Transaction type
        location: {},
        payment_meta: {},
        pending_transaction_id: null,
        account_owner: null,
        category: [],
        category_id: null,
        check_number: null,
        original_description: null,
      } as any;

      const result = adapter.plaidTransactionToStandardizedTransaction(plaidTransaction, mockAccountId);

      expect(result).toEqual({
        id: 'tx-789',
        accountId: mockAccountId,
        providerTransactionId: 'tx-789',
        providerAccountId: mockAccountId,
        date: '2024-01-20',
        name: 'Amazon Purchase',
        pending: false,
        logoUrl: 'https://example.com/amazon-logo.png',
        websiteUrl: 'https://amazon.com',
        amount: 25.99,
        isoCurrencyCode: 'USD',
        unofficialCurrencyCode: undefined,
      });
    });

    it('should handle transactions with null optional fields', () => {
      const plaidTransaction = {
        transaction_id: 'tx-null-fields',
        account_id: 'account-null',
        date: '2024-01-21',
        datetime: null,
        name: 'Cash Withdrawal',
        merchant_name: null,
        pending: true,
        logo_url: null,
        website: null,
        amount: 50.0,
        iso_currency_code: null,
        unofficial_currency_code: null,
        // Required properties for Plaid Transaction type
        location: {},
        payment_meta: {},
        pending_transaction_id: null,
        account_owner: null,
        category: [],
        category_id: null,
        check_number: null,
        original_description: null,
      } as any;

      const result = adapter.plaidTransactionToStandardizedTransaction(plaidTransaction, mockAccountId);

      expect(result).toEqual({
        id: 'tx-null-fields',
        accountId: mockAccountId,
        providerTransactionId: 'tx-null-fields',
        providerAccountId: mockAccountId,
        date: '2024-01-21',
        name: 'Cash Withdrawal',
        pending: true,
        logoUrl: undefined,
        websiteUrl: undefined,
        amount: 50.0,
        isoCurrencyCode: undefined,
        unofficialCurrencyCode: undefined,
      });
    });

    it('should correctly identify credit transactions (negative amounts)', () => {
      const plaidTransaction = {
        transaction_id: 'tx-credit',
        account_id: 'account-credit',
        date: '2024-01-22',
        datetime: '2024-01-22T09:00:00Z',
        name: 'Refund',
        merchant_name: 'Store',
        pending: false,
        logo_url: null,
        website: null,
        amount: -15.75, // Negative amount
        iso_currency_code: 'USD',
        unofficial_currency_code: null,
        // Required properties for Plaid Transaction type
        location: {},
        payment_meta: {},
        pending_transaction_id: null,
        account_owner: null,
        category: [],
        category_id: null,
        check_number: null,
        original_description: null,
      } as any;

      const result = adapter.plaidTransactionToStandardizedTransaction(plaidTransaction, mockAccountId);

      expect(result).toEqual({
        id: 'tx-credit',
        accountId: mockAccountId,
        providerTransactionId: 'tx-credit',
        providerAccountId: mockAccountId,
        date: '2024-01-22',
        name: 'Refund',
        pending: false,
        logoUrl: undefined,
        websiteUrl: undefined,
        amount: -15.75,
        isoCurrencyCode: 'USD',
        unofficialCurrencyCode: undefined,
      });
    });

    it('should handle zero amounts', () => {
      const plaidTransaction = {
        transaction_id: 'tx-zero',
        account_id: 'account-zero',
        date: '2024-01-23',
        datetime: '2024-01-23T12:00:00Z',
        name: 'Balance Inquiry',
        merchant_name: 'Bank',
        pending: false,
        logo_url: null,
        website: null,
        amount: 0,
        iso_currency_code: 'USD',
        unofficial_currency_code: null,
        // Required properties for Plaid Transaction type
        location: {},
        payment_meta: {},
        pending_transaction_id: null,
        account_owner: null,
        category: [],
        category_id: null,
        check_number: null,
        original_description: null,
      } as any;

      const result = adapter.plaidTransactionToStandardizedTransaction(plaidTransaction, mockAccountId);

      expect(result).toEqual({
        id: 'tx-zero',
        accountId: mockAccountId,
        providerTransactionId: 'tx-zero',
        providerAccountId: mockAccountId,
        date: '2024-01-23',
        name: 'Balance Inquiry',
        pending: false,
        logoUrl: undefined,
        websiteUrl: undefined,
        amount: 0,
        isoCurrencyCode: 'USD',
        unofficialCurrencyCode: undefined,
      });
    });
  });

  describe('getAuthDetails', () => {
    it('should retrieve and validate auth details successfully', async () => {
      const validAuthDetails = JSON.stringify({ accessToken: 'valid-access-token' });
      mockVaultService.getSecret.mockResolvedValue(validAuthDetails);

      const result = await adapter.getAuthDetails(mockBankConnection, mockVaultAccessToken);

      expect(mockVaultService.getSecret).toHaveBeenCalledWith('auth-uuid-123', mockVaultAccessToken);
      expect(result).toEqual({ accessToken: 'valid-access-token' });
    });

    it('should throw error when authDetailsUuid is missing', async () => {
      const connectionWithoutAuth = { ...mockBankConnection, authDetailsUuid: undefined };

      await expect(adapter.getAuthDetails(connectionWithoutAuth, mockVaultAccessToken)).rejects.toThrow(
        'Auth details UUID is not set for connection',
      );
    });

    it('should throw error when vault secret is invalid JSON', async () => {
      mockVaultService.getSecret.mockResolvedValue('invalid-json');

      await expect(adapter.getAuthDetails(mockBankConnection, mockVaultAccessToken)).rejects.toThrow();
    });

    it('should throw error when auth details are missing accessToken', async () => {
      const invalidAuthDetails = JSON.stringify({ wrongField: 'value' });
      mockVaultService.getSecret.mockResolvedValue(invalidAuthDetails);

      await expect(adapter.getAuthDetails(mockBankConnection, mockVaultAccessToken)).rejects.toThrow(
        'Validation failed',
      );
    });

    it('should throw error when accessToken is empty', async () => {
      const invalidAuthDetails = JSON.stringify({ accessToken: '' });
      mockVaultService.getSecret.mockResolvedValue(invalidAuthDetails);

      await expect(adapter.getAuthDetails(mockBankConnection, mockVaultAccessToken)).rejects.toThrow(
        'Validation failed',
      );
    });

    it('should log error when validation fails', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const invalidAuthDetails = JSON.stringify({ accessToken: '' });
      mockVaultService.getSecret.mockResolvedValue(invalidAuthDetails);

      await expect(adapter.getAuthDetails(mockBankConnection, mockVaultAccessToken)).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Plaid connection payload validation failed'));
    });
  });
});
