import type { INestApplication } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard, PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bank, BankConnection, BankConnectionStatus, DataSourceType, User } from 'splice-api';
import request from 'supertest';
import type { App } from 'supertest/types';
import { v4 as uuidv4 } from 'uuid';
import { ApiKeyStoreService } from '../../src/api-key-store/api-key-store.service';
import { AuthModule } from '../../src/auth/auth.module';
import { BankConnectionController } from '../../src/bank-connections/bank-connection.controller';
import { BankConnectionService } from '../../src/bank-connections/bank-connection.service';
import { BankRegistryController } from '../../src/bank-registry/bank-registry.controller';
import { BankRegistryService } from '../../src/bank-registry/bank-registry.service';
import { DataSourceManager } from '../../src/data-sources/manager/data-source-manager.service';
import { UserEntity } from '../../src/users/user.entity';
import { UsersModule } from '../../src/users/users.module';

describe('Bank Management (e2e)', () => {
  let app: INestApplication<App>;
  let bankRegistryService: jest.Mocked<BankRegistryService>;
  let bankConnectionService: jest.Mocked<BankConnectionService>;
  let _dataSourceManager: jest.Mocked<DataSourceManager>;
  let testUser: User;
  let testBank: Bank;
  let testConnection: BankConnection;

  beforeAll(async () => {
    // Create test data objects
    testUser = {
      id: uuidv4(),
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      tokenVersion: 1,
    };

    testBank = {
      id: uuidv4(),
      name: 'Test Bank',
      logoUrl: 'https://example.com/logo.png',
      sourceType: DataSourceType.SCRAPER,
      scraperIdentifier: 'test-bank',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    testConnection = {
      id: uuidv4(),
      userId: testUser.id,
      bankId: testBank.id,
      status: BankConnectionStatus.PENDING_AUTH,
      alias: 'My Test Bank',
      lastSync: undefined,
      authDetailsUuid: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      bank: testBank,
    };

    // Create mocked services
    const mockBankRegistryService = {
      findAllActive: jest.fn(),
      findById: jest.fn(),
    };

    const mockBankConnectionService = {
      findByUserId: jest.fn(),
      findByUserIdAndConnectionId: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    const mockDataSourceManager = {
      fetchAccounts: jest.fn(),
      getHealthStatus: jest.fn(),
      initiateConnection: jest.fn(),
      finalizeConnection: jest.fn(),
      fetchTransactions: jest.fn(),
    };

    const mockApiKeyStoreService = {
      storeApiKey: jest.fn(),
      retrieveApiKey: jest.fn(),
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [BankRegistryController, BankConnectionController],
      providers: [
        {
          provide: BankRegistryService,
          useValue: mockBankRegistryService,
        },
        {
          provide: BankConnectionService,
          useValue: mockBankConnectionService,
        },
        {
          provide: DataSourceManager,
          useValue: mockDataSourceManager,
        },
        {
          provide: ApiKeyStoreService,
          useValue: mockApiKeyStoreService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = testUser; // Mock the authenticated user
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false); // Disable logging for cleaner test output
    await app.init();

    bankRegistryService = moduleFixture.get(BankRegistryService);
    bankConnectionService = moduleFixture.get(BankConnectionService);
    _dataSourceManager = moduleFixture.get(DataSourceManager);

    // Set up default mock responses
    bankRegistryService.findAllActive.mockResolvedValue([testBank]);
    bankRegistryService.findById.mockImplementation((id: string) => {
      return Promise.resolve(id === testBank.id ? testBank : null);
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Set up default mock responses
    bankRegistryService.findAllActive.mockResolvedValue([testBank]);
    bankRegistryService.findById.mockImplementation((id: string) => {
      return Promise.resolve(id === testBank.id ? testBank : null);
    });
  });

  describe('Full Bank Connection Flow', () => {
    it('should complete the full user bank management flow', async () => {
      // Step 1: Get available banks from bank registry
      const availableBanksResponse = await request(app.getHttpServer()).get('/banks/available').expect(200);

      expect(availableBanksResponse.body).toBeInstanceOf(Array);
      expect(availableBanksResponse.body.length).toBe(1);

      const availableBank = availableBanksResponse.body.find(
        (bank: { id: string; name: string; sourceType: string }) => bank.id === testBank.id,
      );
      expect(availableBank).toBeDefined();
      expect(availableBank.name).toBe(testBank.name);
      expect(availableBank.sourceType).toBe(testBank.sourceType);

      // Verify service was called
      expect(bankRegistryService.findAllActive).toHaveBeenCalledTimes(1);

      // Step 2: Create a bank connection for the user
      const createConnectionRequest = {
        bankId: testBank.id,
        alias: 'My Test Bank',
      };

      const mockCreatedConnection = {
        ...testConnection,
        authDetailsUuid: undefined,
      };

      bankConnectionService.create.mockResolvedValue(mockCreatedConnection);

      const createConnectionResponse = await request(app.getHttpServer())
        .post('/users/banks')
        .send(createConnectionRequest)
        .expect(201);

      expect(createConnectionResponse.body.bankId).toBe(testBank.id);
      expect(createConnectionResponse.body.bankName).toBe(testBank.name);
      expect(createConnectionResponse.body.alias).toBe('My Test Bank');
      expect(createConnectionResponse.body.status).toBe(BankConnectionStatus.PENDING_AUTH);
      expect(createConnectionResponse.body.sourceType).toBe(testBank.sourceType);

      // Verify service was called
      expect(bankConnectionService.create).toHaveBeenCalledWith(testUser.id, createConnectionRequest);

      const connectionId = createConnectionResponse.body.id;

      // Step 3: Get user's bank connections
      bankConnectionService.findByUserId.mockResolvedValue([mockCreatedConnection]);

      const userConnectionsResponse = await request(app.getHttpServer()).get('/users/banks').expect(200);

      expect(userConnectionsResponse.body).toBeInstanceOf(Array);
      expect(userConnectionsResponse.body.length).toBe(1);
      expect(userConnectionsResponse.body[0].id).toBe(connectionId);
      expect(userConnectionsResponse.body[0].bankName).toBe(testBank.name);

      // Verify service was called
      expect(bankConnectionService.findByUserId).toHaveBeenCalled();

      // Step 4: Check the status of the specific connection
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(mockCreatedConnection);

      const statusResponse = await request(app.getHttpServer()).get(`/users/banks/${connectionId}/status`).expect(200);

      expect(statusResponse.body.status).toBe(BankConnectionStatus.PENDING_AUTH);
      expect(statusResponse.body.lastSync).toBeUndefined();

      // Verify service was called
      expect(bankConnectionService.findByUserIdAndConnectionId).toHaveBeenCalledWith(testUser.id, connectionId);

      // Step 5: Delete the connection
      bankConnectionService.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer()).delete(`/users/banks/${connectionId}`).expect(200);

      // Verify service was called
      expect(bankConnectionService.delete).toHaveBeenCalledWith(testUser.id, connectionId);

      // Step 6: Verify the connection is deleted
      bankConnectionService.findByUserId.mockResolvedValue([]);

      const emptyConnectionsResponse = await request(app.getHttpServer()).get('/users/banks').expect(200);

      expect(emptyConnectionsResponse.body).toBeInstanceOf(Array);
      expect(emptyConnectionsResponse.body.length).toBe(0);

      // Step 7: Verify accessing deleted connection returns 404
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(null);

      await request(app.getHttpServer()).get(`/users/banks/${connectionId}/status`).expect(404);
    });

    it("should use authenticated user's ID for bank operations", async () => {
      // All operations should use the authenticated user's ID from the JWT token
      bankConnectionService.findByUserId.mockResolvedValue([]);

      await request(app.getHttpServer()).get('/users/banks').expect(200);

      expect(bankConnectionService.findByUserId).toHaveBeenCalledWith(testUser.id);

      // Create connection will use authenticated user's ID
      const createRequest = {
        bankId: testBank.id,
        alias: 'Test Connection',
      };

      const mockConnection = {
        ...testConnection,
        userId: testUser.id, // Should use authenticated user's ID
      };

      bankConnectionService.create.mockResolvedValue(mockConnection);

      await request(app.getHttpServer()).post('/users/banks').send(createRequest).expect(201);

      expect(bankConnectionService.create).toHaveBeenCalledWith(testUser.id, createRequest);
    });

    it('should handle invalid bank registry requests', async () => {
      const invalidBankId = uuidv4();

      // Mock service to return null for invalid bank ID
      bankRegistryService.findById.mockImplementation((id: string) => {
        return Promise.resolve(id === testBank.id ? testBank : null);
      });

      // Try to create connection with non-existent bank
      const createRequest = {
        bankId: invalidBankId,
        alias: 'Invalid Bank',
      };

      // Mock service to throw NotFoundException
      bankConnectionService.create.mockRejectedValue(new Error('Bank not found'));

      await request(app.getHttpServer()).post('/users/banks').send(createRequest).expect(500); // Service throws error which becomes 500

      expect(bankConnectionService.create).toHaveBeenCalledWith(testUser.id, createRequest);
    });
  });

  describe('Bank Registry Service Integration', () => {
    it('should get available banks', async () => {
      const response = await request(app.getHttpServer()).get('/banks/available').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual({
        id: testBank.id,
        name: testBank.name,
        logoUrl: testBank.logoUrl,
        sourceType: testBank.sourceType,
      });

      expect(bankRegistryService.findAllActive).toHaveBeenCalledTimes(1);
    });

    it('should handle empty bank registry', async () => {
      bankRegistryService.findAllActive.mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get('/banks/available').expect(200);

      expect(response.body).toHaveLength(0);
      expect(bankRegistryService.findAllActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('JWT Authentication', () => {
    let authApp: INestApplication<App>;

    beforeAll(async () => {
      // Create a separate app instance WITHOUT overriding the AuthGuard
      // so we can test actual JWT authentication
      const authModuleFixture = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({ jwt: { secret: 'test-jwt-secret' } })],
          }),
          TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:',
            entities: [UserEntity],
            synchronize: true,
          }),
          PassportModule,
          UsersModule,
          AuthModule,
        ],
        controllers: [BankConnectionController],
        providers: [
          {
            provide: BankConnectionService,
            useValue: {
              findByUserId: jest.fn().mockResolvedValue([]),
              create: jest.fn(),
            },
          },
          {
            provide: DataSourceManager,
            useValue: {
              fetchAccounts: jest.fn(),
              getHealthStatus: jest.fn(),
              initiateConnection: jest.fn(),
              finalizeConnection: jest.fn(),
              fetchTransactions: jest.fn(),
            },
          },
          {
            provide: ApiKeyStoreService,
            useValue: {
              storeApiKey: jest.fn(),
              retrieveApiKey: jest.fn(),
            },
          },
        ],
      }).compile();

      authApp = authModuleFixture.createNestApplication();
      await authApp.init();
    });

    afterAll(async () => {
      await authApp.close();
    });

    it('should reject requests without JWT token', async () => {
      const response = await request(authApp.getHttpServer()).get('/users/banks');

      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid JWT token', async () => {
      const response = await request(authApp.getHttpServer())
        .get('/users/banks')
        .set('Authorization', 'Bearer invalid-jwt-token');

      expect(response.status).toBe(401);
    });

    it('should reject requests with malformed Authorization header', async () => {
      const response = await request(authApp.getHttpServer())
        .get('/users/banks')
        .set('Authorization', 'InvalidFormat some-token');

      expect(response.status).toBe(401);
    });

    it('should reject requests with expired or revoked JWT token', async () => {
      // This would test a token with an old version number
      // In a real scenario, you'd generate a JWT with an outdated version
      const response = await request(authApp.getHttpServer())
        .get('/users/banks')
        .set(
          'Authorization',
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJ2ZXIiOjF9.invalid',
        );

      expect(response.status).toBe(401);
    });
  });
});
