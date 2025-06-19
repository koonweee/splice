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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VaultService],
    }).compile();

    service = module.get<VaultService>(VaultService);

    // Mock logger
    logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock behaviors
    mockBitwardenClient.auth.mockReturnValue(mockAuth);
    mockBitwardenClient.secrets.mockReturnValue(mockSecrets);
    mockAuth.loginAccessToken.mockResolvedValue(undefined);
    mockSecrets.get.mockResolvedValue({ value: mockSecretValue });
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
});
