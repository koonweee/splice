import { DataSourceType } from '@splice/api';
import { BankRegistryClient } from '../../src/client/bank-registry-client';
import { createMockResponse, mockFetch, mockFetchError } from '../mocks/fetch';

describe('BankRegistryClient', () => {
  let client: BankRegistryClient;

  beforeEach(() => {
    client = new BankRegistryClient({
      baseURL: 'http://localhost:3000',
      jwt: 'test-jwt-token',
    });
  });

  describe('getAvailableBanks', () => {
    it('should fetch available banks successfully', async () => {
      const mockBanks = [
        {
          id: 'bank-1',
          name: 'Test Bank',
          logoUrl: 'https://example.com/logo.png',
          sourceType: DataSourceType.SCRAPER,
        },
        {
          id: 'bank-2',
          name: 'Another Bank',
          logoUrl: 'https://example.com/logo2.png',
          sourceType: DataSourceType.PLAID,
        },
      ];

      mockFetch(createMockResponse(mockBanks));

      const result = await client.getAvailableBanks();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/banks/available', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockBanks);
    });

    it('should handle empty bank list', async () => {
      mockFetch(createMockResponse([]));

      const result = await client.getAvailableBanks();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      // Create client with no retries to avoid timeout
      const fastClient = new BankRegistryClient({
        baseURL: 'http://localhost:3000',
        jwt: 'test-jwt-token',
        timeout: 100,
        retries: 0,
      });

      mockFetch(
        createMockResponse({ message: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' }),
      );

      await expect(fastClient.getAvailableBanks()).rejects.toThrow('Internal server error');
    });

    it('should handle unauthorized errors', async () => {
      mockFetch(createMockResponse({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' }));

      await expect(client.getAvailableBanks()).rejects.toThrow('Unauthorized');
    });

    it('should handle network errors', async () => {
      // Create client with shorter timeout and no retries to avoid timeout
      const fastClient = new BankRegistryClient({
        baseURL: 'http://localhost:3000',
        jwt: 'test-jwt-token',
        timeout: 100,
        retries: 0,
      });

      mockFetchError(new Error('Network error'));

      await expect(fastClient.getAvailableBanks()).rejects.toThrow('Network error');
    });

    it('should handle banks with missing optional fields', async () => {
      const mockBanks = [
        {
          id: 'bank-1',
          name: 'Test Bank',
          sourceType: DataSourceType.SCRAPER,
        },
      ];

      mockFetch(createMockResponse(mockBanks));

      const result = await client.getAvailableBanks();

      expect(result).toEqual(mockBanks);
    });
  });
});
