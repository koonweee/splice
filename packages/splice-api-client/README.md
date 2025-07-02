# Splice API Client

Type-safe HTTP client for the Splice API, built with TypeScript and designed to work seamlessly with the `@splice/api` types.

## Installation

```bash
npm install @splice/api-client
```

## Usage

### Basic Setup

```typescript
import { SpliceApiClient } from '@splice/api-client';

const client = new SpliceApiClient({
  baseURL: 'http://localhost:3000',
  jwt: 'your-jwt-token', // Optional
  timeout: 30000,        // Optional, defaults to 30s
  retries: 3,            // Optional, defaults to 3
});
```

### User Management

```typescript
// Create a new user
const { user, apiKey } = await client.users.createUser({
  username: 'johndoe',
  email: 'john@example.com'
});

// Revoke all API keys for the authenticated user
await client.users.revokeApiKeys();
```

### API Key Storage

```typescript
import { ApiKeyType } from '@splice/api';

// Store an encrypted API key (returns secret for later retrieval)
const secret = await client.apiKeyStore.storeApiKey(
  'bitwarden-access-token',
  ApiKeyType.BITWARDEN,
  'organization-id'
);
```

### Bank Connections

```typescript
// Get all bank connections
const connections = await client.bankConnections.getUserBankConnections();

// Create a new bank connection
const newConnection = await client.bankConnections.createBankConnection({
  bankId: 'bank-123',
  alias: 'My Bank Account',
  authDetailsUuid: 'auth-uuid-123'
});

// Get accounts for a connection
const accounts = await client.bankConnections.getBankConnectionAccounts(
  'connection-id',
  'secret-from-api-key-store'
);

// Get transactions with date filtering
const transactions = await client.bankConnections.getBankConnectionTransactions(
  'connection-id',
  'secret-from-api-key-store',
  {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  }
);

// Delete a connection
await client.bankConnections.deleteBankConnection('connection-id');
```

### JWT Token Management

```typescript
// Set JWT token for all clients
client.setJwt('new-jwt-token');

// Clear JWT token from all clients  
client.clearJwt();
```

### Individual Clients

You can also use individual clients if you prefer:

```typescript
import { UserClient, BankConnectionClient, ApiKeyStoreClient } from '@splice/api-client';

const userClient = new UserClient({ baseURL: 'http://localhost:3000' });
const bankClient = new BankConnectionClient({ baseURL: 'http://localhost:3000' });
```

## Error Handling

The client throws `HttpError` instances for HTTP errors:

```typescript
import { HttpError } from '@splice/api-client';

try {
  await client.users.createUser({ username: 'existing-user' });
} catch (error) {
  if (error instanceof HttpError) {
    console.log('HTTP Status:', error.status);
    console.log('Response:', error.response);
  }
}
```

## Type Safety

All methods are fully typed using interfaces from `@splice/api`:

```typescript
import type { CreateUserRequest, BankConnectionResponse } from '@splice/api';

const request: CreateUserRequest = {
  username: 'test',
  email: 'test@example.com'  // TypeScript will catch type errors
};

const connection: BankConnectionResponse = await client.bankConnections.createBankConnection(request);
```

## Features

- ✅ **Type Safety**: Full TypeScript support with shared types from `@splice/api`
- ✅ **Authentication**: JWT Bearer token support  
- ✅ **Error Handling**: Consistent error responses with status codes
- ✅ **Retry Logic**: Configurable retry mechanism with exponential backoff
- ✅ **Custom Headers**: Support for API-specific headers (`X-Secret`, `X-Api-Key`)
- ✅ **Query Parameters**: Type-safe query parameter handling
- ✅ **Timeout Control**: Configurable request timeouts
- ✅ **Unified Interface**: Single client class for all API operations