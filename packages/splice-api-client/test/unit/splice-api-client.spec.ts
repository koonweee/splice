import { SpliceApiClient } from '../../src/index';

describe('SpliceApiClient', () => {
  let client: SpliceApiClient;

  beforeEach(() => {
    client = new SpliceApiClient({
      baseURL: 'http://localhost:3000',
      jwt: 'test-jwt-token',
    });
  });

  it('should initialize all sub-clients', () => {
    expect(client.users).toBeDefined();
    expect(client.bankConnections).toBeDefined();
    expect(client.bankRegistry).toBeDefined();
    expect(client.apiKeyStore).toBeDefined();
  });

  it('should set JWT on all sub-clients', () => {
    const newToken = 'new-jwt-token';

    client.setJwt(newToken);

    expect(client.users['jwt']).toBe(newToken);
    expect(client.bankConnections['jwt']).toBe(newToken);
    expect(client.bankRegistry['jwt']).toBe(newToken);
    expect(client.apiKeyStore['jwt']).toBe(newToken);
  });

  it('should clear JWT on all sub-clients', () => {
    client.setJwt('token');
    client.clearJwt();

    expect(client.users['jwt']).toBeUndefined();
    expect(client.bankConnections['jwt']).toBeUndefined();
    expect(client.bankRegistry['jwt']).toBeUndefined();
    expect(client.apiKeyStore['jwt']).toBeUndefined();
  });

  it('should pass configuration to all sub-clients', () => {
    const config = {
      baseURL: 'http://api.example.com',
      timeout: 10000,
      retries: 1,
      jwt: 'custom-token',
    };

    const customClient = new SpliceApiClient(config);

    expect(customClient.users['baseURL']).toBe('http://api.example.com');
    expect(customClient.users['timeout']).toBe(10000);
    expect(customClient.users['retries']).toBe(1);
    expect(customClient.users['jwt']).toBe('custom-token');

    expect(customClient.bankConnections['baseURL']).toBe('http://api.example.com');
    expect(customClient.bankRegistry['baseURL']).toBe('http://api.example.com');
    expect(customClient.apiKeyStore['baseURL']).toBe('http://api.example.com');
  });
});
