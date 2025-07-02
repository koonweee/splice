import { UserClient } from '../../src/client/user-client';
import { createMockResponse, mockFetch, mockFetchError } from '../mocks/fetch';

describe('UserClient', () => {
  let client: UserClient;

  beforeEach(() => {
    client = new UserClient({
      baseURL: 'http://localhost:3000',
      jwt: 'test-jwt-token',
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        user: mockUser,
        apiKey: 'generated-api-key-123',
      };

      mockFetch(createMockResponse(mockResponse));

      const result = await client.createUser({
        username: 'testuser',
        email: 'test@example.com',
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
        }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      mockFetch(createMockResponse({ message: 'Username already exists' }, { status: 400, statusText: 'Bad Request' }));

      await expect(client.createUser({ username: 'existing' })).rejects.toThrow('Username already exists');
    });

    it('should handle network errors', async () => {
      // Create client with shorter timeout and no retries to avoid timeout
      const fastClient = new UserClient({
        baseURL: 'http://localhost:3000',
        jwt: 'test-jwt-token',
        timeout: 100,
        retries: 0,
      });

      mockFetchError(new Error('Network error'));

      await expect(fastClient.createUser({ username: 'test' })).rejects.toThrow('Network error');
    });
  });

  describe('revokeApiKeys', () => {
    it('should revoke API keys successfully', async () => {
      const mockResponse = { message: 'API keys revoked successfully' };

      mockFetch(createMockResponse(mockResponse));

      const result = await client.revokeApiKeys();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/users/revoke-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle unauthorized errors', async () => {
      mockFetch(createMockResponse({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' }));

      await expect(client.revokeApiKeys()).rejects.toThrow('Unauthorized');
    });
  });
});
