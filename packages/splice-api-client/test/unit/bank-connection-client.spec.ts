import { BankConnectionStatus } from 'splice-api';
import { BankConnectionClient } from '../../src/client/bank-connection-client';
import { createMockResponse, mockFetch } from '../mocks/fetch';

describe('BankConnectionClient', () => {
  let client: BankConnectionClient;

  beforeEach(() => {
    client = new BankConnectionClient({
      baseURL: 'http://localhost:3000',
      jwt: 'test-jwt-token',
    });
  });

  describe('getUserBankConnections', () => {
    it('should fetch user bank connections', async () => {
      const mockConnections = [
        {
          id: 'conn-123',
          bankId: 'bank-456',
          bankName: 'Test Bank',
          bankLogoUrl: 'https://example.com/logo.png',
          sourceType: 'SCRAPER',
          status: BankConnectionStatus.ACTIVE,
          alias: 'My Bank Account',
          lastSync: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockFetch(createMockResponse(mockConnections));

      const result = await client.getUserBankConnections();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/users/banks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockConnections);
    });
  });

  describe('createBankConnection', () => {
    it('should create a new bank connection', async () => {
      const request = {
        bankId: 'bank-456',
        alias: 'My New Bank',
        authDetailsUuid: 'auth-uuid-123',
      };

      const mockResponse = {
        id: 'conn-789',
        bankId: 'bank-456',
        bankName: 'Test Bank',
        sourceType: 'SCRAPER',
        status: BankConnectionStatus.PENDING_AUTH,
        alias: 'My New Bank',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFetch(createMockResponse(mockResponse));

      const result = await client.createBankConnection(request);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/users/banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        body: JSON.stringify(request),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getBankConnectionTransactions', () => {
    it('should fetch transactions with query parameters', async () => {
      const mockTransactions = [
        {
          id: 'txn-123',
          accountId: 'acc-456',
          date: '2024-01-01',
          description: 'Test Transaction',
          amount: -50.0,
          currency: 'USD',
          type: 'DEBIT',
        },
      ];

      mockFetch(createMockResponse(mockTransactions));

      const result = await client.getBankConnectionTransactions('conn-123', 'secret-456', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/banks/conn-123/transactions?startDate=2024-01-01&endDate=2024-01-31',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Secret': 'secret-456',
            Authorization: 'Bearer test-jwt-token',
          },
          signal: expect.any(AbortSignal),
        },
      );

      expect(result).toEqual(mockTransactions);
    });

    it('should fetch transactions without query parameters', async () => {
      const mockTransactions: any[] = [];

      mockFetch(createMockResponse(mockTransactions));

      const result = await client.getBankConnectionTransactions('conn-123', 'secret-456');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/users/banks/conn-123/transactions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret': 'secret-456',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockTransactions);
    });
  });

  describe('getBankConnectionAccounts', () => {
    it('should fetch bank connection accounts', async () => {
      const mockAccounts = [
        {
          id: 'acc-123',
          name: 'Checking Account',
          type: 'CHECKING',
          balance: 1000.5,
          currency: 'USD',
          institution: 'Test Bank',
        },
      ];

      mockFetch(createMockResponse(mockAccounts));

      const result = await client.getBankConnectionAccounts('conn-123', 'secret-456');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/users/banks/conn-123/accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret': 'secret-456',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockAccounts);
    });
  });

  describe('deleteBankConnection', () => {
    it('should delete a bank connection', async () => {
      mockFetch(createMockResponse({}, { status: 204 }));

      await client.deleteBankConnection('conn-123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/users/banks/conn-123', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });
    });
  });
});
