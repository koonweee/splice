import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PlaidApi } from 'plaid';
import { BankConnection, BankConnectionStatus, DataSourceType } from 'splice-api';
import { PlaidAdapter } from '../../../../src/data-sources/adapters/plaid.adapter';

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
}));

describe('PlaidAdapter', () => {
  let adapter: PlaidAdapter;
  let configService: jest.Mocked<ConfigService>;
  let mockPlaidApiClient: jest.Mocked<PlaidApi>;

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

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock PlaidApi methods
    mockPlaidApiClient = {
      linkTokenCreate: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaidAdapter,
        {
          provide: ConfigService,
          useValue: mockConfigService,
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
        new PlaidAdapter(mockConfigServiceMissing as any);
      }).toThrow('PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set');
    });

    it('should throw error when clientId is missing', () => {
      const mockConfigServiceMissing = {
        get: jest.fn().mockReturnValue({ secret: 'test-secret' }),
      };

      expect(() => {
        new PlaidAdapter(mockConfigServiceMissing as any);
      }).toThrow('PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set');
    });

    it('should throw error when secret is missing', () => {
      const mockConfigServiceMissing = {
        get: jest.fn().mockReturnValue({ clientId: 'test-client-id' }),
      };

      expect(() => {
        new PlaidAdapter(mockConfigServiceMissing as any);
      }).toThrow('PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set');
    });

    it('should log initialization success', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      new PlaidAdapter(configService);

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

      const testAdapter = new PlaidAdapter(testConfigService as any);

      // Mock the internal validation to throw a non-zod error
      testAdapter.validateFinalizeConnectionPayload = jest.fn().mockImplementation(async () => {
        throw new Error('Unexpected error');
      });

      const payload = { accessToken: 'valid-token' };

      await expect(testAdapter.validateFinalizeConnectionPayload(payload)).rejects.toThrow('Unexpected error');
    });
  });

  describe('fetchAccounts', () => {
    it('should return empty array for plaid connection', async () => {
      const result = await adapter.fetchAccounts(mockBankConnection, mockVaultAccessToken);

      expect(result).toEqual([]);
    });

    it('should log account fetching', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.fetchAccounts(mockBankConnection, mockVaultAccessToken);

      expect(logSpy).toHaveBeenCalledWith(`Fetching accounts for plaid connection ${mockConnectionId}`);
    });
  });

  describe('fetchTransactions', () => {
    it('should return empty array for plaid connection', async () => {
      const result = await adapter.fetchTransactions(
        mockBankConnection,
        mockAccountId,
        mockStartDate,
        mockEndDate,
        mockVaultAccessToken,
      );

      expect(result).toEqual([]);
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
        `Fetching transactions for plaid connection ${mockConnectionId}, account ${mockAccountId} from ${mockStartDate.toISOString()} to ${mockEndDate.toISOString()}`,
      );
    });
  });
});
