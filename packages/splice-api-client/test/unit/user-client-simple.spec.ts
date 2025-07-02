import { UserClient } from '../../src/client/user-client';

// Simplified test to verify basic functionality
describe('UserClient (Simple)', () => {
  let client: UserClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;

    client = new UserClient({
      baseURL: 'http://localhost:3000',
      jwt: 'test-jwt-token',
    });
  });

  it('should make correct API call for createUser', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
      json: () =>
        Promise.resolve({
          user: { id: '123', username: 'test' },
          apiKey: 'key-123',
        }),
    });

    const result = await client.createUser({ username: 'test' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/users',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        }),
        body: '{"username":"test"}',
      }),
    );

    expect(result.user.username).toBe('test');
    expect(result.apiKey).toBe('key-123');
  });

  it('should handle HTTP errors', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
      json: () => Promise.resolve({ message: 'Invalid input' }),
    });

    await expect(client.createUser({ username: 'test' })).rejects.toThrow('Invalid input');
  });
});
