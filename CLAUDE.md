# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `cd splice-service && bun run dev` - Start development server with watch mode
- `cd splice-service && bun run db` - Start PostgreSQL database with Docker Compose
- `cd splice-api && bun run build` - Build shared types package

### Testing and Quality
- `cd splice-service && bun run test` - Run unit tests (22 tests in `/test/unit/`)
- `cd splice-service && bun run test:watch` - Run tests in watch mode
- `cd splice-service && bun run test:cov` - Run tests with coverage report
- `cd splice-service && bun run test:e2e` - Run end-to-end tests
- `cd splice-service && bun run lint` - Run ESLint with auto-fix
- `cd splice-service && bun run format` - Format code with Prettier

### Production
- `cd splice-service && bun run build` - Build for production
- `cd splice-service && bun run start:prod` - Start production server

## Architecture Overview

Splice is a monorepo with two main packages:
- `splice-api/` - Shared TypeScript types and interfaces
- `splice-service/` - Main NestJS application

### Core Services

**ScraperService** (`src/scraper/scraper.service.ts`)
- Manages Playwright browser lifecycle
- Coordinates scraping strategies for different financial institutions
- Handles error recovery and logging

**VaultService** (`src/vault/vault.service.ts`)
- Integrates with Bitwarden Secrets Manager
- Retrieves encrypted financial credentials

**ApiKeyStoreService** (`src/api-key-store/api-key-store.service.ts`)
- Encrypts/decrypts Bitwarden access tokens using AES-256-GCM
- Uses PBKDF2 key derivation with user UUID as salt

### Scraper Strategy Pattern

Financial institutions are implemented as strategies in `src/scraper/strategies/`:
- Each strategy implements `ScraperStrategy` interface
- Register new strategies in `src/scraper/scraper.module.ts`
- Add corresponding secret UUID to `src/config.ts`

### Data Flow
1. User provides Bitwarden access token → encrypted and stored
2. Transaction request → decrypt token → fetch credentials from Bitwarden
3. Launch Playwright → execute bank-specific scraping strategy
4. Normalize and return transaction data

### Environment Configuration

Required environment variables in `splice-service/.env`:
- `DBS_SECRET_UUID` - Bitwarden secret ID for DBS credentials
- `API_STORE_ENCRYPTION_KEY` - 256-bit hex key for encrypting tokens
- `POSTGRES_*` - Database connection settings

### Database

Uses TypeORM with PostgreSQL:
- Entities: `User`, `ApiKeyStore`
- Auto-synchronization enabled in development
- No migrations - schema changes via entity updates

### Testing Structure

Unit tests are located in `/test/unit/` mirroring the `src/` structure:
- `/test/unit/api-key-store/` - Tests for encryption/decryption service
- `/test/unit/vault/` - Tests for Bitwarden integration
- `/test/unit/scraper/strategies/parsers/` - Tests for CSV parsing logic
- Uses Jest with TypeScript support and proper mocking of external dependencies