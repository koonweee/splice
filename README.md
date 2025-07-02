# Splice 🔗

A self-hosted, extensible financial transaction aggregation API. Alternative to Plaid for banks without OAuth support.

**Current Status**: POC supporting DBS Singapore checking/savings accounts.

> 🚨 **Security Warning**: Splice handles sensitive financial credentials. Read [Security](#security) before self-hosting.

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) for PostgreSQL
- [Bitwarden](https://bitwarden.com/products/secrets-manager/) Secrets Manager account

### Installation

```bash
git clone <repo-url>
cd splice
bun install
```

### Environment Setup

```bash
cd packages/splice-service
cp .env.example .env
```

Configure `.env`:
- `API_STORE_ENCRYPTION_KEY` - Generate with `openssl rand -hex 32`
- `POSTGRES_*` - Database configuration
- `JWT_SECRET` - Generate with `openssl rand -hex 32`

### Development

**Start the database:**
```bash
# Start PostgreSQL with Docker Compose (detached)
bun run db
```

**Start the development server:**
```bash
# In a new terminal, start the NestJS development server
bun run dev
```

**Access the application:**
- **API Base URL**: `http://localhost:3000`
- **Scalar API Documentation**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/health`

The API documentation provides an interactive interface to test all endpoints directly from your browser.

## Usage

### Step 1: Create User & Get API Key

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "email": "your_email@example.com"
  }'
```

**Response**: You'll receive a user object and an `apiKey` for Bearer authentication:
```json
{
  "user": { ... },
  "apiKey": "your_api_key"
}
```

### Step 2: Store Bitwarden Token & Get X-Secret

```bash
curl -X POST http://localhost:3000/api-key-store \
  -H "Authorization: Bearer your_api_key" \
  -H "X-Api-Key: your_bitwarden_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "keyType": "BITWARDEN",
    "organisationId": "your_organisation_id"
  }'
```

**Response**: Save the `X-Secret` from response headers - you'll need it for credential operations.

### Step 3: Get Available Banks

```bash
curl -X GET http://localhost:3000/banks/available \
  -H "Authorization: Bearer your_api_key"
```

**Response**: List of available banks with their IDs and details.

### Step 4: Create Bank Connection

```bash
curl -X POST http://localhost:3000/users/banks \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "bankId": "dbs_bank_id",
    "alias": "My DBS Savings"
  }'
```

**Response**: Bank connection object with `connectionId`.

### Step 5: Bank Login (Two-Part Process)

**Initiate Login:**
```bash
curl -X POST http://localhost:3000/users/banks/{connectionId}/initiate-login \
  -H "Authorization: Bearer your_api_key"
```

**Finalize Login:**
```bash
curl -X POST http://localhost:3000/users/banks/{connectionId}/finalize-login \
  -H "Authorization: Bearer your_api_key" \
  -H "X-Secret: your_x_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_bank_username",
    "password": "your_bank_password"
  }'
```

### Step 6: Fetch Transactions

```bash
curl -X GET http://localhost:3000/users/banks/{connectionId}/transactions \
  -H "Authorization: Bearer your_api_key" \
  -H "X-Secret: your_x_secret"
```

**Response**: Array of standardized transactions.

## Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant S as Splice API
    participant KS as API Key Store
    participant V as Vault (Bitwarden)
    participant B as Bank Website

    %% User Creation & Authentication
    U->>S: POST /users<br>{username, email}
    S-->>U: {user, apiKey}

    %% Store Bitwarden Token
    U->>KS: POST /api-key-store<br>Authorization: Bearer apiKey<br>X-Api-Key: bitwarden_token
    KS->>KS: Encrypt token with user-specific key
    KS-->>U: X-Secret header

    %% Get Available Banks
    U->>S: GET /banks/available<br>Authorization: Bearer apiKey
    S-->>U: [{id, name, logoUrl}...]

    %% Create Bank Connection
    U->>S: POST /users/banks<br>Authorization: Bearer apiKey<br>{bankId, alias}
    S-->>U: {connectionId, status...}

    %% Initiate Login
    U->>S: POST /users/banks/{id}/initiate-login<br>Authorization: Bearer apiKey
    S-->>U: Login initialization data

    %% Finalize Login - Store Credentials
    U->>S: POST /users/banks/{id}/finalize-login<br>Authorization: Bearer apiKey<br>X-Secret: secret<br>{username, password}
    S->>KS: Decrypt Bitwarden token using X-Secret
    KS-->>S: bitwarden_token
    S->>V: Store bank credentials in vault<br>(createSecret with username/password)
    V-->>S: secret_uuid
    S->>S: Update connection with authDetailsUuid<br>Set status to ACTIVE
    S-->>U: Login finalized successfully

    %% Get Transactions - Fetch & Scrape
    U->>S: GET /users/banks/{id}/transactions<br>Authorization: Bearer apiKey<br>X-Secret: secret
    S->>KS: Decrypt Bitwarden token using X-Secret
    KS-->>S: bitwarden_token
    S->>V: Fetch stored credentials<br>(getSecret using authDetailsUuid)
    V-->>S: bank_credentials
    S->>B: Launch Playwright & execute scraping<br>using retrieved credentials
    B-->>S: Raw transaction data
    S->>S: Normalize to standardized format
    S-->>U: Standardized transactions
```

## API Client

Install the TypeScript client:

```bash
bun add @splice/api-client
```

```typescript
import { SpliceApiClient } from '@splice/api-client';

const client = new SpliceApiClient({
  baseURL: 'http://localhost:3000',
  jwt: 'your-jwt-token'  // Optional: can be set later
});

// Create user
const { user, apiKey } = await client.users.createUser({
  username: 'your_username',
  email: 'your_email@example.com'  // Optional
});

// Set JWT for authenticated requests
client.setJwt(apiKey);

// Store Bitwarden token and get secret
const secret = await client.apiKeyStore.storeApiKey(
  'your_bitwarden_token',
  'BITWARDEN',
  'your_organisation_id'
);

// Create bank connection
const connection = await client.bankConnections.createBankConnection({
  bankId: 'dbs',
  alias: 'My DBS Account'  // Optional
});

// Get transactions
const transactions = await client.bankConnections.getBankConnectionTransactions(
  connection.id,
  secret
);
```

## Architecture

```
splice/
├── packages/
│   ├── splice-api/           # Shared TypeScript types
│   ├── splice-api-client/    # HTTP client library
│   └── splice-service/       # Main NestJS application
│       ├── src/
│       │   ├── auth/         # JWT authentication
│       │   ├── users/        # User management
│       │   ├── bank-connections/ # Bank connection management
│       │   ├── api-key-store/    # Encrypted credential storage
│       │   ├── vault/        # Bitwarden integration
│       │   └── scraper/      # Web scraping + strategies
│       └── test/             # Unit and E2E tests
```

**Core Flow**:
1. User creates account → receives JWT API key
2. User stores encrypted Bitwarden token
3. User creates bank connection with Bitwarden secret ID
4. Transactions fetched via automated browser scraping

## Adding Banks

Create strategy in `packages/splice-service/src/scraper/strategies/`:

```typescript
@Injectable()
export class YourBankStrategy implements ScraperStrategy {
  name = 'your_bank';
  startUrl = 'https://your-bank-login-url.com';

  async scrape(secret: string, page: Page, logger: Logger): Promise<ScrapedData> {
    // 1. Parse credentials from Bitwarden secret
    // 2. Navigate login flow
    // 3. Extract transaction data
    // 4. Return normalized transactions
  }
}
```

Register in `scraper.module.ts` and add secret UUID to config.

## Development

**Local Development Setup:**
```bash
# Start PostgreSQL database
bun run db

# In another terminal, start development server with hot reload
bun run dev

# Access Scalar API docs at http://localhost:3000/api
```

**Testing:**
```bash
# Run all tests (unit + E2E)
bun run test

# Run only E2E tests
bun run test:e2e

# Run tests with coverage
bun run test:cov

# Run tests in watch mode
bun run test:watch
```

**Code Quality:**
```bash
# Lint and auto-fix issues
bun run lint

# Format code with Biome
bun run format

# Build for production
bun run build
```

## Security

**Encryption**: AES-256-GCM with PBKDF2 key derivation (100k iterations)
- Master key from `API_STORE_ENCRYPTION_KEY`
- Per-user keys derived with UUID salt
- Bitwarden tokens encrypted at rest

**Authentication**: JWT Bearer tokens with configurable expiration

> ⚠️ **Risk**: Self-hosting credential aggregation carries inherent security risks. Ensure proper infrastructure security.

## Technologies

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Scraping**: Playwright
- **Security**: Bitwarden Secrets Manager
- **Auth**: JWT with Passport
- **Docs**: Scalar API Reference