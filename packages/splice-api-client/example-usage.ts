import type { CreateUserRequest, GetTransactionsQuery } from '@splice/api';
import { ApiKeyType } from '@splice/api';
import { ApiKeyStoreClient, BankConnectionClient, SpliceApiClient, UserClient } from './src/index';

// Example 1: Using individual clients
const config = {
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  jwt: 'your-jwt-token-here',
};

const userClient = new UserClient(config);
const bankClient = new BankConnectionClient(config);
const apiKeyClient = new ApiKeyStoreClient(config);

// Example 2: Using the unified client
const client = new SpliceApiClient(config);

async function exampleUsage() {
  try {
    // Create a user
    const createUserRequest: CreateUserRequest = {
      username: 'testuser',
      email: 'test@example.com',
    };

    const userResult = await client.users.createUser(createUserRequest);
    console.log('Created user:', userResult.user);
    console.log('API Key:', userResult.apiKey);

    // Set JWT token after login
    client.setJwt('new-jwt-token');

    // Store an API key
    const secret = await client.apiKeyStore.storeApiKey('bitwarden-access-token', ApiKeyType.BITWARDEN, 'org-id-123');
    console.log('Secret:', secret);

    // Get bank connections
    const connections = await client.bankConnections.getUserBankConnections();
    console.log('Bank connections:', connections);

    // Get transactions for a specific connection
    if (connections.length > 0) {
      const query: GetTransactionsQuery = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const transactions = await client.bankConnections.getBankConnectionTransactions(connections[0].id, secret, query);
      console.log('Transactions:', transactions);
    }
  } catch (error) {
    console.error('API Error:', error);
  }
}

// This file demonstrates type safety - TypeScript will catch errors
// if you try to pass wrong types to any of the methods
