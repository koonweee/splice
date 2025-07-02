import { BaseClient } from '../../src/client/base-client';
import { HttpError } from '../../src/utils/http-helpers';
import { createMockResponse, mockFetch, mockFetchError } from '../mocks/fetch';

// Create a concrete implementation for testing
class TestClient extends BaseClient {
  public async testGet<T>(path: string, options?: any): Promise<T> {
    return this.get<T>(path, options);
  }

  public async testPost<T>(path: string, body?: any, headers?: any): Promise<T> {
    return this.post<T>(path, body, headers);
  }

  public async testDelete<T>(path: string, headers?: any): Promise<T> {
    return this.delete<T>(path, headers);
  }
}

describe('BaseClient', () => {
  let client: TestClient;

  beforeEach(() => {
    client = new TestClient({
      baseURL: 'http://localhost:3000',
      timeout: 5000,
      retries: 2,
      jwt: 'test-jwt-token',
    });
  });

  describe('configuration', () => {
    it('should initialize with correct config', () => {
      expect(client['baseURL']).toBe('http://localhost:3000');
      expect(client['timeout']).toBe(5000);
      expect(client['retries']).toBe(2);
      expect(client['jwt']).toBe('test-jwt-token');
    });

    it('should use default values when not provided', () => {
      const defaultClient = new TestClient({
        baseURL: 'http://localhost:3000',
      });

      expect(defaultClient['timeout']).toBe(30000);
      expect(defaultClient['retries']).toBe(3);
      expect(defaultClient['jwt']).toBeUndefined();
    });

    it('should remove trailing slash from baseURL', () => {
      const clientWithSlash = new TestClient({
        baseURL: 'http://localhost:3000/',
      });

      expect(clientWithSlash['baseURL']).toBe('http://localhost:3000');
    });
  });

  describe('JWT management', () => {
    it('should set JWT token', () => {
      client.setJwt('new-token');
      expect(client['jwt']).toBe('new-token');
    });

    it('should clear JWT token', () => {
      client.setJwt('token');
      client.clearJwt();
      expect(client['jwt']).toBeUndefined();
    });
  });

  describe('HTTP methods', () => {
    it('should make GET request successfully', async () => {
      const mockData = { id: 1, name: 'test' };
      mockFetch(createMockResponse(mockData));

      const result = await client.testGet('/test');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockData);
    });

    it('should make POST request with body', async () => {
      const requestBody = { name: 'test' };
      const mockResponse = { id: 1, ...requestBody };
      mockFetch(createMockResponse(mockResponse));

      const result = await client.testPost('/test', requestBody);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        body: JSON.stringify(requestBody),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should make DELETE request', async () => {
      mockFetch(createMockResponse({}, { status: 204 }));

      await client.testDelete('/test/123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test/123', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should include custom headers', async () => {
      mockFetch(createMockResponse({}));

      await client.testGet('/test', {
        headers: { 'X-Custom': 'value' },
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'value',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should include query parameters', async () => {
      mockFetch(createMockResponse({}));

      await client.testGet('/test', {
        queryParams: { page: '1', size: '10' },
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test?page=1&size=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should filter undefined query parameters', async () => {
      mockFetch(createMockResponse({}));

      await client.testGet('/test', {
        queryParams: { page: '1', size: undefined, sort: 'name' },
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test?page=1&sort=name', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('error handling', () => {
    it('should throw HttpError for 4xx client errors', async () => {
      const mockResponse = createMockResponse({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      // Mock fetch twice since we call it twice in this test
      ((global as any).fetch as jest.Mock).mockResolvedValueOnce(mockResponse).mockResolvedValueOnce(mockResponse);

      await expect(client.testGet('/test')).rejects.toThrow(HttpError);
      await expect(client.testGet('/test')).rejects.toThrow('Not found');
    });

    it('should throw HttpError for 5xx server errors', async () => {
      // Use a client with no retries to avoid complexity
      const noRetryClient = new TestClient({
        baseURL: 'http://localhost:3000',
        timeout: 5000,
        retries: 0,
        jwt: 'test-jwt-token',
      });

      const mockResponse = createMockResponse(
        { message: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' },
      );

      // Mock fetch twice since we call it twice in this test
      ((global as any).fetch as jest.Mock).mockResolvedValueOnce(mockResponse).mockResolvedValueOnce(mockResponse);

      await expect(noRetryClient.testGet('/test')).rejects.toThrow(HttpError);
      await expect(noRetryClient.testGet('/test')).rejects.toThrow('Internal server error');
    });

    it('should throw network errors immediately for 4xx errors (no retry)', async () => {
      mockFetch(createMockResponse({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' }));

      await expect(client.testGet('/test')).rejects.toThrow('Bad request');

      // Should only be called once (no retries for 4xx)
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry mechanism', () => {
    it('should retry on network errors', async () => {
      // First call fails, second succeeds
      mockFetchError(new Error('Network error'));
      mockFetch(createMockResponse({ success: true }));

      const result = await client.testGet('/test');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    it('should retry up to the configured limit', async () => {
      // All calls fail
      for (let i = 0; i <= 2; i++) {
        mockFetchError(new Error('Network error'));
      }

      await expect(client.testGet('/test')).rejects.toThrow('Network error');

      // Should be called 3 times (initial + 2 retries)
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
});
