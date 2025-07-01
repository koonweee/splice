import { Logger } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { VaultService } from '../../../src/vault/vault.service';

// Mock the Bitwarden SDK
const mockBitwardenClient = {
  auth: jest.fn(),
  secrets: jest.fn(),
};

const mockAuth = {
  loginAccessToken: jest.fn(),
};

const mockSecrets = {
  get: jest.fn(),
  create: jest.fn(),
  list: jest.fn(),
};

jest.mock('@bitwarden/sdk-napi', () => ({
  BitwardenClient: jest.fn().mockImplementation(() => mockBitwardenClient),
}));

describe('VaultService', () => {
  let service: VaultService;
  let logger: jest.SpyInstance;

  const mockAccessToken = 'test-access-token';
  const mockSecretId = 'test-secret-id';
  const mockSecretValue = 'test-secret-value';
  const mockOrganizationId = 'test-org-id';
  const mockSecretKey = 'test-secret-key';
  const mockSecretObject = { username: 'test-user', password: 'test-pass' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VaultService],
    }).compile();

    service = module.get<VaultService>(VaultService);

    // Mock logger
    logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock behaviors
    mockBitwardenClient.auth.mockReturnValue(mockAuth);
    mockBitwardenClient.secrets.mockReturnValue(mockSecrets);
    mockAuth.loginAccessToken.mockResolvedValue(undefined);
    mockSecrets.get.mockResolvedValue({ value: mockSecretValue });
    mockSecrets.create.mockResolvedValue({ id: mockSecretId });
    mockSecrets.list.mockResolvedValue({
      data: [{ id: mockSecretId, key: mockSecretKey, organizationId: mockOrganizationId }],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getSecret', () => {
    it('should successfully retrieve a secret', async () => {
      const result = await service.getSecret(mockSecretId, mockAccessToken);

      expect(mockAuth.loginAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(mockSecrets.get).toHaveBeenCalledWith(mockSecretId);
      expect(result).toBe(mockSecretValue);
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid access token');
      mockAuth.loginAccessToken.mockRejectedValue(authError);

      await expect(service.getSecret(mockSecretId, mockAccessToken)).rejects.toThrow(authError);

      expect(logger).toHaveBeenCalledWith(`Failed to retrieve secret ${mockSecretId}: Invalid access token`);
    });

    it('should handle secret retrieval errors', async () => {
      const secretError = new Error('Secret not found');
      mockSecrets.get.mockRejectedValue(secretError);

      await expect(service.getSecret(mockSecretId, mockAccessToken)).rejects.toThrow(secretError);

      expect(mockAuth.loginAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(logger).toHaveBeenCalledWith(`Failed to retrieve secret ${mockSecretId}: Secret not found`);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockAuth.loginAccessToken.mockRejectedValue(networkError);

      await expect(service.getSecret(mockSecretId, mockAccessToken)).rejects.toThrow(networkError);

      expect(logger).toHaveBeenCalledWith(`Failed to retrieve secret ${mockSecretId}: Network timeout`);
    });

    it('should handle undefined secret values', async () => {
      mockSecrets.get.mockResolvedValue({ value: undefined });

      const result = await service.getSecret(mockSecretId, mockAccessToken);

      expect(result).toBeUndefined();
    });

    it('should handle empty secret values', async () => {
      mockSecrets.get.mockResolvedValue({ value: '' });

      const result = await service.getSecret(mockSecretId, mockAccessToken);

      expect(result).toBe('');
    });

    it('should create a new Bitwarden client for each request', async () => {
      const { BitwardenClient } = require('@bitwarden/sdk-napi');

      await service.getSecret(mockSecretId, mockAccessToken);
      await service.getSecret('another-secret', mockAccessToken);

      expect(BitwardenClient).toHaveBeenCalledTimes(2);
    });

    it('should authenticate with the provided access token', async () => {
      const customToken = 'custom-access-token';

      await service.getSecret(mockSecretId, customToken);

      expect(mockAuth.loginAccessToken).toHaveBeenCalledWith(customToken);
    });

    it('should handle complex secret values', async () => {
      const complexSecret = JSON.stringify({
        username: 'test-user',
        password: 'complex-password-123!@#',
        additionalData: ['item1', 'item2'],
      });
      mockSecrets.get.mockResolvedValue({ value: complexSecret });

      const result = await service.getSecret(mockSecretId, mockAccessToken);

      expect(result).toBe(complexSecret);
    });

    it('should handle long secret IDs', async () => {
      const longSecretId = `very-long-secret-id-${'x'.repeat(100)}`;

      await service.getSecret(longSecretId, mockAccessToken);

      expect(mockSecrets.get).toHaveBeenCalledWith(longSecretId);
    });

    it('should propagate Bitwarden SDK specific errors', async () => {
      const bitwardenError = new Error('Insufficient permissions');
      bitwardenError.name = 'BitwardenError';
      mockSecrets.get.mockRejectedValue(bitwardenError);

      await expect(service.getSecret(mockSecretId, mockAccessToken)).rejects.toThrow(bitwardenError);

      expect(logger).toHaveBeenCalledWith(`Failed to retrieve secret ${mockSecretId}: Insufficient permissions`);
    });
  });

  describe('getBitwardenClient (private method behavior)', () => {
    it('should authenticate client before returning', async () => {
      // This tests the private method behavior indirectly through getSecret
      await service.getSecret(mockSecretId, mockAccessToken);

      expect(mockAuth.loginAccessToken).toHaveBeenCalled();
      expect(mockSecrets.get).toHaveBeenCalled();
    });

    it('should handle client creation failures', async () => {
      const { BitwardenClient } = require('@bitwarden/sdk-napi');
      BitwardenClient.mockImplementationOnce(() => {
        throw new Error('Client creation failed');
      });

      await expect(service.getSecret(mockSecretId, mockAccessToken)).rejects.toThrow('Client creation failed');
    });
  });

  describe('createSecret', () => {
    it('should successfully create a secret', async () => {
      const result = await service.createSecret(mockSecretKey, mockSecretObject, mockAccessToken, mockOrganizationId);

      expect(mockAuth.loginAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(mockSecrets.create).toHaveBeenCalledWith(
        mockOrganizationId,
        mockSecretKey,
        JSON.stringify(mockSecretObject, null, 2),
        '',
        [],
      );
      expect(result).toBe(mockSecretId);
    });

    it('should JSON stringify the value object with proper formatting', async () => {
      const complexObject = {
        credentials: {
          username: 'test-user',
          password: 'complex-password-123!',
        },
        metadata: {
          lastUpdated: '2023-01-01',
          version: 1,
        },
      };

      await service.createSecret('complex-secret', complexObject, mockAccessToken, mockOrganizationId);

      expect(mockSecrets.create).toHaveBeenCalledWith(
        mockOrganizationId,
        'complex-secret',
        JSON.stringify(complexObject, null, 2),
        '',
        [],
      );
    });

    it('should handle authentication errors during secret creation', async () => {
      const authError = new Error('Invalid access token');
      mockAuth.loginAccessToken.mockRejectedValue(authError);

      await expect(
        service.createSecret(mockSecretKey, mockSecretObject, mockAccessToken, mockOrganizationId),
      ).rejects.toThrow(authError);

      expect(logger).toHaveBeenCalledWith(`Failed to create secret ${mockSecretKey}: Invalid access token`);
    });

    it('should handle secret creation errors', async () => {
      const createError = new Error('Organization not found');
      mockSecrets.create.mockRejectedValue(createError);

      await expect(
        service.createSecret(mockSecretKey, mockSecretObject, mockAccessToken, mockOrganizationId),
      ).rejects.toThrow(createError);

      expect(mockAuth.loginAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(logger).toHaveBeenCalledWith(`Failed to create secret ${mockSecretKey}: Organization not found`);
    });

    it('should handle empty object values', async () => {
      const emptyObject = {};

      await service.createSecret('empty-secret', emptyObject, mockAccessToken, mockOrganizationId);

      expect(mockSecrets.create).toHaveBeenCalledWith(
        mockOrganizationId,
        'empty-secret',
        JSON.stringify(emptyObject, null, 2),
        '',
        [],
      );
    });

    it('should handle nested object values', async () => {
      const nestedObject = {
        bank: {
          name: 'Test Bank',
          credentials: {
            username: 'user',
            password: 'pass',
            mfa: {
              type: 'sms',
              phone: '+1234567890',
            },
          },
        },
      };

      await service.createSecret('nested-secret', nestedObject, mockAccessToken, mockOrganizationId);

      expect(mockSecrets.create).toHaveBeenCalledWith(
        mockOrganizationId,
        'nested-secret',
        JSON.stringify(nestedObject, null, 2),
        '',
        [],
      );
    });

    it('should handle array values in objects', async () => {
      const objectWithArray = {
        accounts: ['checking', 'savings'],
        features: ['transactions', 'balance'],
      };

      await service.createSecret('array-secret', objectWithArray, mockAccessToken, mockOrganizationId);

      expect(mockSecrets.create).toHaveBeenCalledWith(
        mockOrganizationId,
        'array-secret',
        JSON.stringify(objectWithArray, null, 2),
        '',
        [],
      );
    });

    it('should log successful secret creation', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.createSecret(mockSecretKey, mockSecretObject, mockAccessToken, mockOrganizationId);

      expect(logSpy).toHaveBeenCalledWith(`Created secret with key: ${mockSecretKey}`);
    });

    it('should handle special characters in secret key', async () => {
      const specialKey = 'secret-with-special-chars!@#$%';

      await service.createSecret(specialKey, mockSecretObject, mockAccessToken, mockOrganizationId);

      expect(mockSecrets.create).toHaveBeenCalledWith(
        mockOrganizationId,
        specialKey,
        JSON.stringify(mockSecretObject, null, 2),
        '',
        [],
      );
    });

    it('should handle long organization IDs', async () => {
      const longOrgId = `very-long-organization-id-${'x'.repeat(100)}`;

      await service.createSecret(mockSecretKey, mockSecretObject, mockAccessToken, longOrgId);

      expect(mockSecrets.create).toHaveBeenCalledWith(
        longOrgId,
        mockSecretKey,
        JSON.stringify(mockSecretObject, null, 2),
        '',
        [],
      );
    });
  });

  describe('listSecrets', () => {
    it('should successfully list secrets', async () => {
      const result = await service.listSecrets(mockAccessToken, mockOrganizationId);

      expect(mockAuth.loginAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(mockSecrets.list).toHaveBeenCalledWith(mockOrganizationId);
      expect(result).toEqual([
        {
          id: mockSecretId,
          key: mockSecretKey,
          organizationId: mockOrganizationId,
        },
      ]);
    });

    it('should handle multiple secrets in list response', async () => {
      const multipleSecrets = {
        data: [
          { id: 'secret-1', key: 'key-1', organizationId: mockOrganizationId },
          { id: 'secret-2', key: 'key-2', organizationId: mockOrganizationId },
          { id: 'secret-3', key: 'key-3', organizationId: mockOrganizationId },
        ],
      };
      mockSecrets.list.mockResolvedValue(multipleSecrets);

      const result = await service.listSecrets(mockAccessToken, mockOrganizationId);

      expect(result).toEqual([
        { id: 'secret-1', key: 'key-1', organizationId: mockOrganizationId },
        { id: 'secret-2', key: 'key-2', organizationId: mockOrganizationId },
        { id: 'secret-3', key: 'key-3', organizationId: mockOrganizationId },
      ]);
    });

    it('should handle empty secrets list', async () => {
      mockSecrets.list.mockResolvedValue({ data: [] });

      const result = await service.listSecrets(mockAccessToken, mockOrganizationId);

      expect(result).toEqual([]);
    });

    it('should handle authentication errors during list operation', async () => {
      const authError = new Error('Invalid access token');
      mockAuth.loginAccessToken.mockRejectedValue(authError);

      await expect(service.listSecrets(mockAccessToken, mockOrganizationId)).rejects.toThrow(authError);

      expect(logger).toHaveBeenCalledWith(
        `Failed to list secrets for organization ${mockOrganizationId}: Invalid access token`,
      );
    });

    it('should handle list operation errors', async () => {
      const listError = new Error('Organization not found');
      mockSecrets.list.mockRejectedValue(listError);

      await expect(service.listSecrets(mockAccessToken, mockOrganizationId)).rejects.toThrow(listError);

      expect(mockAuth.loginAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(logger).toHaveBeenCalledWith(
        `Failed to list secrets for organization ${mockOrganizationId}: Organization not found`,
      );
    });

    it('should handle network errors during list operation', async () => {
      const networkError = new Error('Network timeout');
      mockSecrets.list.mockRejectedValue(networkError);

      await expect(service.listSecrets(mockAccessToken, mockOrganizationId)).rejects.toThrow(networkError);

      expect(logger).toHaveBeenCalledWith(
        `Failed to list secrets for organization ${mockOrganizationId}: Network timeout`,
      );
    });

    it('should handle long organization IDs in list operation', async () => {
      const longOrgId = `very-long-organization-id-${'x'.repeat(100)}`;

      await service.listSecrets(mockAccessToken, longOrgId);

      expect(mockSecrets.list).toHaveBeenCalledWith(longOrgId);
    });

    it('should handle secrets with special characters in keys', async () => {
      const specialSecretsResponse = {
        data: [
          { id: 'secret-1', key: 'key-with-special-chars!@#$%', organizationId: mockOrganizationId },
          { id: 'secret-2', key: 'key_with_underscores', organizationId: mockOrganizationId },
          { id: 'secret-3', key: 'key-with-dashes', organizationId: mockOrganizationId },
        ],
      };
      mockSecrets.list.mockResolvedValue(specialSecretsResponse);

      const result = await service.listSecrets(mockAccessToken, mockOrganizationId);

      expect(result).toEqual([
        { id: 'secret-1', key: 'key-with-special-chars!@#$%', organizationId: mockOrganizationId },
        { id: 'secret-2', key: 'key_with_underscores', organizationId: mockOrganizationId },
        { id: 'secret-3', key: 'key-with-dashes', organizationId: mockOrganizationId },
      ]);
    });

    it('should handle secrets with long keys', async () => {
      const longKey = `very-long-secret-key-${'x'.repeat(100)}`;
      const longKeyResponse = {
        data: [{ id: mockSecretId, key: longKey, organizationId: mockOrganizationId }],
      };
      mockSecrets.list.mockResolvedValue(longKeyResponse);

      const result = await service.listSecrets(mockAccessToken, mockOrganizationId);

      expect(result).toEqual([{ id: mockSecretId, key: longKey, organizationId: mockOrganizationId }]);
    });

    it('should create a new Bitwarden client for each list request', async () => {
      const { BitwardenClient } = require('@bitwarden/sdk-napi');

      await service.listSecrets(mockAccessToken, mockOrganizationId);
      await service.listSecrets(mockAccessToken, 'another-org');

      expect(BitwardenClient).toHaveBeenCalledTimes(2);
    });
  });
});
