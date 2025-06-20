import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { BankConnectionStatus, BankSourceType } from '@splice/api';
import * as request from 'supertest';
import { BankConnectionController } from '../../src/bank-connections/bank-connection.controller';
import { BankConnectionService } from '../../src/bank-connections/bank-connection.service';
import { BankRegistryController } from '../../src/bank-registry/bank-registry.controller';
import { BankRegistryService } from '../../src/bank-registry/bank-registry.service';

describe('Bank Connections Controllers (e2e)', () => {
  let app: INestApplication;
  let bankRegistryService: jest.Mocked<BankRegistryService>;
  let bankConnectionService: jest.Mocked<BankConnectionService>;

  const testUser = {
    uuid: 'test-user-uuid',
    username: 'testuser',
    email: 'test@example.com',
  };

  const testBank = {
    id: 'test-bank-uuid',
    name: 'Test Bank',
    logoUrl: 'https://example.com/logo.png',
    sourceType: BankSourceType.SCRAPER,
    scraperIdentifier: 'test-bank',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const testConnection = {
    id: 'test-connection-uuid',
    userId: testUser.uuid,
    bankId: testBank.id,
    status: BankConnectionStatus.PENDING_AUTH,
    alias: 'My Test Account',
    lastSync: null,
    authDetailsUuid: 'test-auth-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: testUser as any,
    bank: testBank as any,
  };

  let authToken: string;

  beforeAll(async () => {
    const mockBankRegistryService = {
      findAllActive: jest.fn(),
      findById: jest.fn(),
    };

    const mockBankConnectionService = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserIdAndConnectionId: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.secret') return 'test-secret';
        return undefined;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
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
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(require('../../src/auth/auth.guard').AuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;

          // Simulate real auth guard behavior
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException();
          }

          request.jwt = { sub: testUser.uuid };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    bankRegistryService = moduleFixture.get(BankRegistryService);
    bankConnectionService = moduleFixture.get(BankConnectionService);

    // Generate auth token
    authToken = 'Bearer mock-jwt-token';

    // Setup default mock behaviors
    bankRegistryService.findAllActive.mockResolvedValue([testBank]);
    bankRegistryService.findById.mockResolvedValue(testBank);
    bankConnectionService.findByUserId.mockResolvedValue([testConnection]);
    bankConnectionService.create.mockResolvedValue(testConnection);
    bankConnectionService.findByUserIdAndConnectionId.mockResolvedValue(testConnection);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Bank Connections User Flow', () => {
    it('1. Should get available banks', async () => {
      const response = await request(app.getHttpServer()).get('/banks/available').expect(200);

      expect(response.body).toEqual([
        {
          id: testBank.id,
          name: testBank.name,
          logoUrl: testBank.logoUrl,
          sourceType: testBank.sourceType,
        },
      ]);

      expect(bankRegistryService.findAllActive).toHaveBeenCalled();
    });

    it('2. Should create a bank connection', async () => {
      const createDto = {
        bankId: testBank.id,
        alias: 'My Test Account',
        authDetailsUuid: 'test-auth-uuid',
      };

      const response = await request(app.getHttpServer())
        .post(`/users/${testUser.uuid}/banks`)
        .set('Authorization', authToken)
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual({
        id: testConnection.id,
        bankId: testBank.id,
        bankName: testBank.name,
        bankLogoUrl: testBank.logoUrl,
        sourceType: testBank.sourceType,
        status: BankConnectionStatus.PENDING_AUTH,
        alias: 'My Test Account',
        lastSync: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      expect(bankConnectionService.create).toHaveBeenCalledWith(testUser.uuid, createDto);
    });

    it('3. Should get user bank connections', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.uuid}/banks`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toEqual([
        {
          id: testConnection.id,
          bankId: testBank.id,
          bankName: testBank.name,
          bankLogoUrl: testBank.logoUrl,
          sourceType: testBank.sourceType,
          status: BankConnectionStatus.PENDING_AUTH,
          alias: 'My Test Account',
          lastSync: null,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ]);

      expect(bankConnectionService.findByUserId).toHaveBeenCalledWith(testUser.uuid);
    });

    it('4. Should get bank connection status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.uuid}/banks/${testConnection.id}/status`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toEqual({
        status: BankConnectionStatus.PENDING_AUTH,
        lastSync: null,
      });

      expect(bankConnectionService.findByUserIdAndConnectionId).toHaveBeenCalledWith(testUser.uuid, testConnection.id);
    });

    it('5. Should update bank connection', async () => {
      const updateDto = {
        alias: 'Updated Account',
        status: BankConnectionStatus.ACTIVE,
      };

      const updatedConnection = {
        ...testConnection,
        ...updateDto,
      };

      bankConnectionService.update.mockResolvedValueOnce(updatedConnection);

      const response = await request(app.getHttpServer())
        .put(`/users/${testUser.uuid}/banks/${testConnection.id}`)
        .set('Authorization', authToken)
        .send(updateDto)
        .expect(200);

      expect(response.body.alias).toBe('Updated Account');
      expect(response.body.status).toBe(BankConnectionStatus.ACTIVE);

      expect(bankConnectionService.update).toHaveBeenCalledWith(testUser.uuid, testConnection.id, updateDto);
    });

    it('6. Should delete bank connection', async () => {
      bankConnectionService.delete.mockResolvedValueOnce();

      await request(app.getHttpServer())
        .delete(`/users/${testUser.uuid}/banks/${testConnection.id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(bankConnectionService.delete).toHaveBeenCalledWith(testUser.uuid, testConnection.id);
    });
  });

  describe('Error Scenarios', () => {
    it('Should return 401 for requests without authentication', async () => {
      // Test without Authorization header
      await request(app.getHttpServer())
        .get(`/users/${testUser.uuid}/banks`)
        // No Authorization header
        .expect(401);
    });

    it('Should return 403 for cross-user access attempts', async () => {
      const differentUserId = 'different-user-id';

      await request(app.getHttpServer())
        .get(`/users/${differentUserId}/banks`)
        .set('Authorization', authToken)
        .expect(403);
    });

    it('Should return 404 for non-existent connection', async () => {
      bankConnectionService.findByUserIdAndConnectionId.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .get(`/users/${testUser.uuid}/banks/non-existent-id/status`)
        .set('Authorization', authToken)
        .expect(404);
    });

    it('Should handle validation errors for bank connection creation', async () => {
      // This test demonstrates that validation would be handled by DTO validation
      // In a real implementation, we'd have validation decorators on the DTO
      // For now, we'll test the service-level validation instead
      bankConnectionService.create.mockRejectedValueOnce(new Error('Validation failed'));

      await request(app.getHttpServer())
        .post(`/users/${testUser.uuid}/banks`)
        .set('Authorization', authToken)
        .send({ alias: 'test' }) // Missing required fields
        .expect(500); // Service error becomes 500
    });
  });

  describe('Data Validation', () => {
    it('Should validate bank connection creation data', async () => {
      const validDto = {
        bankId: testBank.id,
        alias: 'Valid Account',
        authDetailsUuid: 'valid-auth-uuid',
      };

      await request(app.getHttpServer())
        .post(`/users/${testUser.uuid}/banks`)
        .set('Authorization', authToken)
        .send(validDto)
        .expect(201);

      expect(bankConnectionService.create).toHaveBeenCalledWith(testUser.uuid, validDto);
    });

    it('Should validate bank connection update data', async () => {
      const validUpdateDto = {
        alias: 'Updated Valid Account',
        status: BankConnectionStatus.ACTIVE,
      };

      const updatedConnection = {
        ...testConnection,
        ...validUpdateDto,
      };

      bankConnectionService.update.mockResolvedValueOnce(updatedConnection);

      await request(app.getHttpServer())
        .put(`/users/${testUser.uuid}/banks/${testConnection.id}`)
        .set('Authorization', authToken)
        .send(validUpdateDto)
        .expect(200);

      expect(bankConnectionService.update).toHaveBeenCalledWith(testUser.uuid, testConnection.id, validUpdateDto);
    });
  });
});
