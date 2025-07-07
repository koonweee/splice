import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountType, DepositoryAccountSubtype } from 'splice-api';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AccountEntity } from '../../../src/accounts/account.entity';
import { AccountsModule } from '../../../src/accounts/accounts.module';
import { BankConnectionEntity } from '../../../src/bank-connections/bank-connection.entity';
import { BankConnectionsModule } from '../../../src/bank-connections/bank-connections.module';
import { MOCK_USER } from '../../mocks/mocks';

describe('Accounts (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const mockBankConnection = {
    id: 'bank-connection-1',
    userId: MOCK_USER.id,
    bankId: 'test-bank',
    status: 'ACTIVE' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccount = {
    bankConnectionId: 'bank-connection-1',
    providerAccountId: 'provider-account-1',
    name: 'Test Account',
    balances: {
      current: 1000,
      available: 900,
      isoCurrencyCode: 'USD',
    },
    mask: '1234',
    type: {
      type: AccountType.DEPOSITORY,
      subtype: DepositoryAccountSubtype.CHECKING,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [AccountEntity, BankConnectionEntity],
          synchronize: true,
          logging: false,
        }),
        AccountsModule,
        BankConnectionsModule,
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = MOCK_USER;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create test bank connection
    await dataSource.getRepository(BankConnectionEntity).save(mockBankConnection);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear accounts table before each test
    await dataSource.getRepository(AccountEntity).clear();
  });

  describe('POST /accounts', () => {
    it('should create a new account', async () => {
      const response = await request(app.getHttpServer()).post('/accounts').send(mockAccount).expect(201);

      expect(response.body).toMatchObject({
        bankConnectionId: mockAccount.bankConnectionId,
        providerAccountId: mockAccount.providerAccountId,
        name: mockAccount.name,
        type: mockAccount.type,
        balances: mockAccount.balances,
        mask: mockAccount.mask,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidAccount = {
        // Missing required fields
        name: 'Test Account',
      };

      await request(app.getHttpServer()).post('/accounts').send(invalidAccount).expect(400);
    });

    it('should validate UUID format for bankConnectionId', async () => {
      const invalidAccount = {
        ...mockAccount,
        bankConnectionId: 'invalid-uuid',
      };

      await request(app.getHttpServer()).post('/accounts').send(invalidAccount).expect(400);
    });
  });

  describe('GET /accounts', () => {
    it('should return all accounts for a user', async () => {
      // Create test accounts
      const account1 = await dataSource.getRepository(AccountEntity).save({
        ...mockAccount,
        name: 'Account 1',
      } as any);
      const account2 = await dataSource.getRepository(AccountEntity).save({
        ...mockAccount,
        name: 'Account 2',
      } as any);

      const response = await request(app.getHttpServer()).get('/accounts').expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Account 2'); // Most recent first
      expect(response.body[1].name).toBe('Account 1');
    });

    it('should return empty array when no accounts exist', async () => {
      const response = await request(app.getHttpServer()).get('/accounts').expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /accounts/:accountId', () => {
    it('should return account by ID', async () => {
      const savedAccount = await dataSource.getRepository(AccountEntity).save(mockAccount as any);

      const response = await request(app.getHttpServer()).get(`/accounts/${savedAccount.id}`).expect(200);

      expect(response.body).toMatchObject({
        id: savedAccount.id,
        name: mockAccount.name,
        type: mockAccount.type,
        balances: mockAccount.balances,
      });
    });

    it('should return 404 for non-existent account', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer()).get(`/accounts/${nonExistentId}`).expect(404);
    });

    it('should validate UUID format', async () => {
      await request(app.getHttpServer()).get('/accounts/invalid-uuid').expect(400);
    });
  });

  describe('PATCH /accounts/:accountId', () => {
    it('should update account', async () => {
      const savedAccount = await dataSource.getRepository(AccountEntity).save(mockAccount as any);
      const updateData = {
        name: 'Updated Account Name',
        mask: '5678',
      };

      const response = await request(app.getHttpServer())
        .patch(`/accounts/${savedAccount.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.mask).toBe(updateData.mask);
    });

    it('should return 404 for non-existent account', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer()).patch(`/accounts/${nonExistentId}`).send({ name: 'Updated Name' }).expect(404);
    });
  });

  describe('DELETE /accounts/:accountId', () => {
    it('should delete account', async () => {
      const savedAccount = await dataSource.getRepository(AccountEntity).save(mockAccount as any);

      await request(app.getHttpServer()).delete(`/accounts/${savedAccount.id}`).expect(200);

      // Verify account is deleted
      const deletedAccount = await dataSource.getRepository(AccountEntity).findOneBy({ id: savedAccount.id });
      expect(deletedAccount).toBeNull();
    });

    it('should return 404 for non-existent account', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer()).delete(`/accounts/${nonExistentId}`).expect(404);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const moduleWithoutAuth: TestingModule = await Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:',
            entities: [AccountEntity, BankConnectionEntity],
            synchronize: true,
            logging: false,
          }),
          AccountsModule,
        ],
      }).compile();

      const appWithoutAuth = moduleWithoutAuth.createNestApplication();
      appWithoutAuth.useGlobalPipes(new ValidationPipe({ transform: true }));
      await appWithoutAuth.init();

      await request(appWithoutAuth.getHttpServer()).get('/accounts').expect(401);

      await appWithoutAuth.close();
    });
  });
});
