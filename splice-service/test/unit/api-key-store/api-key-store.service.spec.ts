import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ApiKeyStoreEntity, ApiKeyType } from '../../../src/api-key-store/api-key-store.entity';
import { ApiKeyStoreService } from '../../../src/api-key-store/api-key-store.service';

describe('ApiKeyStoreService', () => {
  let service: ApiKeyStoreService;
  let repository: jest.Mocked<Repository<ApiKeyStoreEntity>>;

  const mockUserUuid = 'test-user-uuid-123';
  const mockApiKey = 'test-api-key-value';
  const mockEncryptionKey = 'test-master-key-32-bytes-long!!';

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'apiStoreEncryptionKey') {
          return mockEncryptionKey;
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyStoreService,
        {
          provide: getRepositoryToken(ApiKeyStoreEntity),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ApiKeyStoreService>(ApiKeyStoreService);
    repository = module.get(getRepositoryToken(ApiKeyStoreEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('storeApiKey', () => {
    it('should encrypt and store API key successfully', async () => {
      const mockApiKeyStore = {
        uuid: 'test-uuid',
        userUuid: mockUserUuid,
        keyType: ApiKeyType.BITWARDEN,
        encryptedKey: 'test-encrypted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.create.mockReturnValue(mockApiKeyStore);
      repository.save.mockResolvedValue(mockApiKeyStore);

      const secret = await service.storeApiKey(mockUserUuid, mockApiKey, ApiKeyType.BITWARDEN);

      expect(repository.create).toHaveBeenCalledWith({
        userUuid: mockUserUuid,
        keyType: ApiKeyType.BITWARDEN,
        encryptedKey: expect.any(String),
      });
      expect(repository.save).toHaveBeenCalledWith(mockApiKeyStore);
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate different secrets for the same API key', async () => {
      const mockApiKeyStore = {
        uuid: 'test-uuid',
        userUuid: mockUserUuid,
        keyType: ApiKeyType.BITWARDEN,
        encryptedKey: 'test-encrypted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.create.mockReturnValue(mockApiKeyStore);
      repository.save.mockResolvedValue(mockApiKeyStore);

      const secret1 = await service.storeApiKey(mockUserUuid, mockApiKey, ApiKeyType.BITWARDEN);
      const secret2 = await service.storeApiKey(mockUserUuid, mockApiKey, ApiKeyType.BITWARDEN);

      expect(secret1).not.toBe(secret2);
    });
  });

  describe('retrieveApiKey', () => {
    it('should decrypt and return API key successfully', async () => {
      // First store an API key to get a valid secret
      const mockApiKeyStore = {
        uuid: 'test-uuid',
        userUuid: mockUserUuid,
        keyType: ApiKeyType.BITWARDEN,
        encryptedKey: 'test-encrypted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.create.mockReturnValue(mockApiKeyStore);
      repository.save.mockResolvedValue(mockApiKeyStore);

      const secret = await service.storeApiKey(mockUserUuid, mockApiKey, ApiKeyType.BITWARDEN);

      // Get the encrypted data from the create call
      const createCall = repository.create.mock.calls[0][0];
      const encryptedKey = createCall.encryptedKey ?? '';

      // Mock the repository to return the stored data
      repository.findOne.mockResolvedValue({
        uuid: 'test-uuid',
        userUuid: mockUserUuid,
        keyType: ApiKeyType.BITWARDEN,
        encryptedKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const retrievedApiKey = await service.retrieveApiKey(mockUserUuid, ApiKeyType.BITWARDEN, secret);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userUuid: mockUserUuid,
          keyType: ApiKeyType.BITWARDEN,
        },
      });
      expect(retrievedApiKey).toBe(mockApiKey);
    });

    it('should throw NotFoundException when API key is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.retrieveApiKey(mockUserUuid, ApiKeyType.BITWARDEN, 'invalid-secret')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException for invalid secret', async () => {
      repository.findOne.mockResolvedValue({
        uuid: 'test-uuid',
        userUuid: mockUserUuid,
        keyType: ApiKeyType.BITWARDEN,
        encryptedKey: 'some-encrypted-data',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.retrieveApiKey(mockUserUuid, ApiKeyType.BITWARDEN, '1234567890abcdef1234567890abcdef12345678'),
      ).rejects.toThrow();
    });
  });
});
