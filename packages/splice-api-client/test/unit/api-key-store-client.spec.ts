import { ApiKeyType } from '@splice/api';
import { ApiKeyStoreClient } from '../../src/client/api-key-store-client';
import { HttpError } from '../../src/utils/http-helpers';
import { createMockResponse, mockFetch } from '../mocks/fetch';

describe('ApiKeyStoreClient', () => {
  let client: ApiKeyStoreClient;

  beforeEach(() => {
    client = new ApiKeyStoreClient({
      baseURL: 'http://localhost:3000',
      jwt: 'test-jwt-token',
    });
  });

  describe('storeApiKey', () => {
    it('should store API key and return secret from header', async () => {
      const mockSecret = 'secret-hash-12345';

      mockFetch(
        createMockResponse(
          {}, // Empty body
          {
            status: 201,
            statusText: 'Created',
            headers: { 'X-Secret': mockSecret },
          },
        ),
      );

      const result = await client.storeApiKey('bitwarden-access-token', ApiKeyType.BITWARDEN, 'org-123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api-key-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'bitwarden-access-token',
          Authorization: 'Bearer test-jwt-token',
        },
        body: JSON.stringify({
          keyType: ApiKeyType.BITWARDEN,
          organisationId: 'org-123',
        }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toBe(mockSecret);
    });

    it('should throw error when X-Secret header is missing', async () => {
      const mockResponse = createMockResponse(
        {},
        { status: 201, statusText: 'Created' }, // No X-Secret header
      );

      // Mock fetch twice since we call it twice in this test
      ((global as any).fetch as jest.Mock).mockResolvedValueOnce(mockResponse).mockResolvedValueOnce(mockResponse);

      await expect(client.storeApiKey('token', ApiKeyType.BITWARDEN, 'org-123')).rejects.toThrow(HttpError);

      await expect(client.storeApiKey('token', ApiKeyType.BITWARDEN, 'org-123')).rejects.toThrow(
        'X-Secret header not found in response',
      );
    });

    it('should handle API errors with proper error message', async () => {
      const mockResponse = createMockResponse(
        { message: 'Invalid API key format' },
        { status: 400, statusText: 'Bad Request' },
      );

      // Mock fetch twice since we call it twice in this test
      ((global as any).fetch as jest.Mock).mockResolvedValueOnce(mockResponse).mockResolvedValueOnce(mockResponse);

      await expect(client.storeApiKey('invalid-token', ApiKeyType.BITWARDEN, 'org-123')).rejects.toThrow(HttpError);

      await expect(client.storeApiKey('invalid-token', ApiKeyType.BITWARDEN, 'org-123')).rejects.toThrow(
        'Invalid API key format',
      );
    });

    it('should handle unauthorized errors', async () => {
      mockFetch(createMockResponse({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' }));

      await expect(client.storeApiKey('token', ApiKeyType.BITWARDEN, 'org-123')).rejects.toThrow('Unauthorized');
    });

    it('should work without JWT token', async () => {
      const clientWithoutJWT = new ApiKeyStoreClient({
        baseURL: 'http://localhost:3000',
      });

      const mockSecret = 'secret-hash-67890';

      mockFetch(
        createMockResponse(
          {},
          {
            status: 201,
            statusText: 'Created',
            headers: { 'X-Secret': mockSecret },
          },
        ),
      );

      const result = await clientWithoutJWT.storeApiKey('token', ApiKeyType.BITWARDEN, 'org-123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api-key-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'token',
        },
        body: JSON.stringify({
          keyType: ApiKeyType.BITWARDEN,
          organisationId: 'org-123',
        }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toBe(mockSecret);
    });
  });
});
