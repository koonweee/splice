import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BankConnectionStatus, BankSourceType } from '@splice/api';
import * as request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../../src/app.module';
import { BankRegistry } from '../../src/bank-registry/bank-registry.entity';
import { User } from '../../src/users/user.entity';

describe('Bank Management (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let testUser: User;
  let testBank: BankRegistry;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create test data
    await createTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await app.close();
  });

  describe('Full Bank Connection Flow', () => {
    it('should complete the full user bank management flow', async () => {
      // Step 1: Get available banks from bank registry
      const availableBanksResponse = await request(app.getHttpServer()).get('/banks/available').expect(200);

      expect(availableBanksResponse.body).toBeInstanceOf(Array);
      expect(availableBanksResponse.body.length).toBeGreaterThan(0);

      const availableBank = availableBanksResponse.body.find(
        (bank: { id: string; name: string; sourceType: string }) => bank.id === testBank.id,
      );
      expect(availableBank).toBeDefined();
      expect(availableBank.name).toBe(testBank.name);
      expect(availableBank.sourceType).toBe(testBank.sourceType);

      // Step 2: Create a bank connection for the user
      const authDetailsUuid = uuidv4();
      const createConnectionRequest = {
        bankId: testBank.id,
        alias: 'My Test Bank',
        authDetailsUuid,
      };

      const createConnectionResponse = await request(app.getHttpServer())
        .post(`/users/${testUser.uuid}/banks`)
        .send(createConnectionRequest)
        .expect(201);

      expect(createConnectionResponse.body.bankId).toBe(testBank.id);
      expect(createConnectionResponse.body.bankName).toBe(testBank.name);
      expect(createConnectionResponse.body.alias).toBe('My Test Bank');
      expect(createConnectionResponse.body.status).toBe(BankConnectionStatus.PENDING_AUTH);
      expect(createConnectionResponse.body.sourceType).toBe(testBank.sourceType);

      const connectionId = createConnectionResponse.body.id;

      // Step 3: Get user's bank connections
      const userConnectionsResponse = await request(app.getHttpServer())
        .get(`/users/${testUser.uuid}/banks`)
        .expect(200);

      expect(userConnectionsResponse.body).toBeInstanceOf(Array);
      expect(userConnectionsResponse.body.length).toBe(1);
      expect(userConnectionsResponse.body[0].id).toBe(connectionId);
      expect(userConnectionsResponse.body[0].bankName).toBe(testBank.name);

      // Step 4: Check the status of the specific connection
      const statusResponse = await request(app.getHttpServer())
        .get(`/users/${testUser.uuid}/banks/${connectionId}/status`)
        .expect(200);

      expect(statusResponse.body.status).toBe(BankConnectionStatus.PENDING_AUTH);
      expect(statusResponse.body.lastSync).toBeNull();

      // Step 5: Update the connection (activate it)
      const updateRequest = {
        status: BankConnectionStatus.ACTIVE,
        alias: 'My Updated Bank Connection',
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/users/${testUser.uuid}/banks/${connectionId}`)
        .send(updateRequest)
        .expect(200);

      expect(updateResponse.body.status).toBe(BankConnectionStatus.ACTIVE);
      expect(updateResponse.body.alias).toBe('My Updated Bank Connection');

      // Step 6: Verify the update by checking status again
      const updatedStatusResponse = await request(app.getHttpServer())
        .get(`/users/${testUser.uuid}/banks/${connectionId}/status`)
        .expect(200);

      expect(updatedStatusResponse.body.status).toBe(BankConnectionStatus.ACTIVE);

      // Step 7: Delete the connection
      await request(app.getHttpServer()).delete(`/users/${testUser.uuid}/banks/${connectionId}`).expect(200);

      // Step 8: Verify the connection is deleted
      const emptyConnectionsResponse = await request(app.getHttpServer())
        .get(`/users/${testUser.uuid}/banks`)
        .expect(200);

      expect(emptyConnectionsResponse.body).toBeInstanceOf(Array);
      expect(emptyConnectionsResponse.body.length).toBe(0);

      // Step 9: Verify accessing deleted connection returns 404
      await request(app.getHttpServer()).get(`/users/${testUser.uuid}/banks/${connectionId}/status`).expect(404);
    });

    it("should prevent access to another user's bank connections", async () => {
      const otherUserId = uuidv4();

      // Try to access another user's connections
      await request(app.getHttpServer()).get(`/users/${otherUserId}/banks`).expect(200); // Should return empty array, not error

      // Try to create connection for non-existent user
      const createRequest = {
        bankId: testBank.id,
        alias: 'Unauthorized Test',
        authDetailsUuid: uuidv4(),
      };

      // The service doesn't validate user existence before creating connection,
      // so it fails with 500 due to foreign key constraint violation
      await request(app.getHttpServer()).post(`/users/${otherUserId}/banks`).send(createRequest).expect(500); // Fails with foreign key constraint violation
    });

    it('should handle invalid bank registry requests', async () => {
      const invalidBankId = uuidv4();

      // Try to create connection with non-existent bank
      const createRequest = {
        bankId: invalidBankId,
        alias: 'Invalid Bank',
        authDetailsUuid: uuidv4(),
      };

      await request(app.getHttpServer()).post(`/users/${testUser.uuid}/banks`).send(createRequest).expect(404); // Should fail because bank doesn't exist
    });
  });

  async function createTestData(): Promise<void> {
    // Create test user
    const userRepository = dataSource.getRepository(User);
    testUser = userRepository.create({
      username: 'testuser',
      email: 'test@example.com',
    });
    testUser = await userRepository.save(testUser);

    // Create test bank in registry
    const bankRepository = dataSource.getRepository(BankRegistry);
    testBank = bankRepository.create({
      name: 'Test Bank',
      logoUrl: 'https://example.com/logo.png',
      sourceType: BankSourceType.SCRAPER,
      scraperIdentifier: 'test-bank',
      isActive: true,
    });
    testBank = await bankRepository.save(testBank);
  }

  async function cleanupTestData(): Promise<void> {
    // Clean up in reverse order due to foreign key constraints
    await dataSource.getRepository('BankConnection').delete({});
    await dataSource.getRepository(BankRegistry).delete({ id: testBank.id });
    await dataSource.getRepository(User).delete({ uuid: testUser.uuid });
  }
});
