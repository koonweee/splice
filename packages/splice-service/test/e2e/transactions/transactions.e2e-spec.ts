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
import { TransactionEntity } from '../../../src/transactions/transaction.entity';
import { TransactionsModule } from '../../../src/transactions/transactions.module';
import { MOCK_USER } from '../../mocks/mocks';

describe('Transactions (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testAccount: AccountEntity;

  const mockBankConnection = {
    id: 'bank-connection-1',
    userId: MOCK_USER.id,
    bankId: 'test-bank',
    status: 'ACTIVE' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccountData = {
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

  const mockTransaction = {
    accountId: '', // Will be set in beforeAll
    providerTransactionId: 'provider-transaction-1',
    providerAccountId: 'provider-account-1',
    amount: 25.5,
    isoCurrencyCode: 'USD',
    category: {
      primary: 'Food and Drink',
      detailed: 'Restaurants',
      confidenceLevel: 'VERY_HIGH',
    },
    date: '2023-01-01',
    name: 'Starbucks Coffee',
    pending: false,
    logoUrl: 'https://logo.url',
    websiteUrl: 'https://website.url',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [TransactionEntity, AccountEntity, BankConnectionEntity],
          synchronize: true,
          logging: false,
        }),
        TransactionsModule,
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

    // Create test data
    await dataSource.getRepository(BankConnectionEntity).save(mockBankConnection);
    testAccount = await dataSource.getRepository(AccountEntity).save(mockAccountData as any);
    mockTransaction.accountId = testAccount.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear transactions table before each test
    await dataSource.getRepository(TransactionEntity).clear();
  });

  describe('POST /transactions', () => {
    it('should create a new transaction', async () => {
      const response = await request(app.getHttpServer()).post('/transactions').send(mockTransaction).expect(201);

      expect(response.body).toMatchObject({
        accountId: mockTransaction.accountId,
        providerTransactionId: mockTransaction.providerTransactionId,
        amount: mockTransaction.amount,
        name: mockTransaction.name,
        date: mockTransaction.date,
        pending: mockTransaction.pending,
        category: mockTransaction.category,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidTransaction = {
        // Missing required fields
        name: 'Test Transaction',
      };

      await request(app.getHttpServer()).post('/transactions').send(invalidTransaction).expect(400);
    });

    it('should validate UUID format for accountId', async () => {
      const invalidTransaction = {
        ...mockTransaction,
        accountId: 'invalid-uuid',
      };

      await request(app.getHttpServer()).post('/transactions').send(invalidTransaction).expect(400);
    });
  });

  describe('GET /transactions', () => {
    it('should return all transactions for a user', async () => {
      // Create test transactions
      const transaction1 = await dataSource.getRepository(TransactionEntity).save({
        ...mockTransaction,
        name: 'Transaction 1',
        date: '2023-01-01',
      });
      const transaction2 = await dataSource.getRepository(TransactionEntity).save({
        ...mockTransaction,
        name: 'Transaction 2',
        date: '2023-01-02',
      } as any);

      const response = await request(app.getHttpServer()).get('/transactions').expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Transaction 2'); // Most recent first
      expect(response.body[1].name).toBe('Transaction 1');
    });

    it('should filter by accountId', async () => {
      // Create another account and transaction
      const anotherAccount = await dataSource.getRepository(AccountEntity).save({
        ...mockAccountData,
        providerAccountId: 'provider-account-2',
        name: 'Another Account',
      } as any);

      await dataSource.getRepository(TransactionEntity).save({
        ...mockTransaction,
        name: 'Transaction 1',
      });
      await dataSource.getRepository(TransactionEntity).save({
        ...mockTransaction,
        accountId: anotherAccount.id,
        name: 'Transaction 2',
      } as any);

      const response = await request(app.getHttpServer()).get(`/transactions?accountId=${testAccount.id}`).expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Transaction 1');
      expect(response.body[0].accountId).toBe(testAccount.id);
    });

    it('should filter by date range', async () => {
      await dataSource.getRepository(TransactionEntity).save({
        ...mockTransaction,
        name: 'Old Transaction',
        date: '2022-12-31',
      });
      await dataSource.getRepository(TransactionEntity).save({
        ...mockTransaction,
        name: 'New Transaction',
        date: '2023-01-01',
      } as any);

      const response = await request(app.getHttpServer())
        .get('/transactions?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('New Transaction');
    });

    it('should filter by pending status', async () => {
      await dataSource.getRepository(TransactionEntity).save({
        ...mockTransaction,
        name: 'Posted Transaction',
        pending: false,
      });
      await dataSource.getRepository(TransactionEntity).save({
        ...mockTransaction,
        name: 'Pending Transaction',
        pending: true,
      } as any);

      const response = await request(app.getHttpServer()).get('/transactions?pending=true').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Pending Transaction');
      expect(response.body[0].pending).toBe(true);
    });

    it('should apply limit and offset', async () => {
      // Create multiple transactions
      for (let i = 1; i <= 5; i++) {
        await dataSource.getRepository(TransactionEntity).save({
          ...mockTransaction,
          name: `Transaction ${i}`,
          date: `2023-01-0${i}`,
        });
      }

      const response = await request(app.getHttpServer()).get('/transactions?limit=2&offset=1').expect(200);

      expect(response.body).toHaveLength(2);
      // Should skip the first (most recent) transaction and return the next 2
    });

    it('should return empty array when no transactions exist', async () => {
      const response = await request(app.getHttpServer()).get('/transactions').expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /transactions/:transactionId', () => {
    it('should return transaction by ID', async () => {
      const savedTransaction = await dataSource.getRepository(TransactionEntity).save(mockTransaction);

      const response = await request(app.getHttpServer()).get(`/transactions/${savedTransaction.id}`).expect(200);

      expect(response.body).toMatchObject({
        id: savedTransaction.id,
        name: mockTransaction.name,
        amount: mockTransaction.amount,
        date: mockTransaction.date,
      });
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer()).get(`/transactions/${nonExistentId}`).expect(404);
    });

    it('should validate UUID format', async () => {
      await request(app.getHttpServer()).get('/transactions/invalid-uuid').expect(400);
    });
  });

  describe('PATCH /transactions/:transactionId', () => {
    it('should update transaction', async () => {
      const savedTransaction = await dataSource.getRepository(TransactionEntity).save(mockTransaction);
      const updateData = {
        name: 'Updated Transaction Name',
        amount: 35.0,
      };

      const response = await request(app.getHttpServer())
        .patch(`/transactions/${savedTransaction.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.amount).toBe(updateData.amount);
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .patch(`/transactions/${nonExistentId}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });
  });

  describe('DELETE /transactions/:transactionId', () => {
    it('should delete transaction', async () => {
      const savedTransaction = await dataSource.getRepository(TransactionEntity).save(mockTransaction);

      await request(app.getHttpServer()).delete(`/transactions/${savedTransaction.id}`).expect(200);

      // Verify transaction is deleted
      const deletedTransaction = await dataSource
        .getRepository(TransactionEntity)
        .findOneBy({ id: savedTransaction.id });
      expect(deletedTransaction).toBeNull();
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer()).delete(`/transactions/${nonExistentId}`).expect(404);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const moduleWithoutAuth: TestingModule = await Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:',
            entities: [TransactionEntity, AccountEntity, BankConnectionEntity],
            synchronize: true,
            logging: false,
          }),
          TransactionsModule,
        ],
      }).compile();

      const appWithoutAuth = moduleWithoutAuth.createNestApplication();
      appWithoutAuth.useGlobalPipes(new ValidationPipe({ transform: true }));
      await appWithoutAuth.init();

      await request(appWithoutAuth.getHttpServer()).get('/transactions').expect(401);

      await appWithoutAuth.close();
    });
  });
});
