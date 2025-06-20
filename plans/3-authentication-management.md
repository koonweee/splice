# Feature Plan: Multi-Modal Authentication Management

## Overview
Implement authentication management for different data source types: credential-based authentication for scrapers and OAuth flows for aggregators. Extends the existing Bitwarden integration while adding OAuth capabilities.

## Requirements
### Functional Requirements
- [ ] OAuth 2.0 flow for aggregator sources (Plaid, SimpleFin)
- [ ] Enhanced credential storage for scraper sources
- [ ] Per-bank-connection authentication state management
- [ ] Token refresh handling for OAuth sources
- [ ] Authentication failure detection and re-authentication flows
- [ ] Secure storage of OAuth tokens and refresh tokens
- [ ] Migration of existing Bitwarden credentials to new system

### Non-Functional Requirements
- [ ] OAuth tokens encrypted at rest using AES-256-GCM
- [ ] Authentication flows complete within 30 seconds
- [ ] Automatic token refresh 24 hours before expiry
- [ ] Support for 10,000+ concurrent OAuth sessions
- [ ] PCI DSS compliance for credential handling

## Technical Design

### Architecture
Extends the current ApiKeyStore system with OAuth capabilities. Creates an AuthenticationManager that routes to appropriate auth providers based on bank connection source type.

### Components
- **Services**: AuthenticationManager, OAuthService, CredentialService
- **Controllers**: OAuthController, AuthenticationController
- **Entities**: OAuthToken, AuthenticationState
- **Modules**: AuthenticationModule, OAuthModule

### Database Changes
- **New entities**:
  - `OAuthToken` (stores OAuth access/refresh tokens per connection)
  - `AuthenticationState` (tracks auth status per bank connection)
- **Schema modifications**:
  - Add `authType` enum to BankConnection (OAUTH, CREDENTIALS)
  - Add foreign keys for OAuth and credential references

### API Changes
- **New endpoints**:
  - `POST /auth/oauth/initiate` - Start OAuth flow for bank connection
  - `GET /auth/oauth/callback` - Handle OAuth callback
  - `POST /auth/oauth/refresh` - Manually refresh OAuth token
  - `POST /auth/credentials/store` - Store scraper credentials (enhanced)
  - `GET /auth/status/{connectionId}` - Check authentication status
  - `POST /auth/reconnect/{connectionId}` - Re-authenticate failed connection

## Implementation Plan

### Phase 1: Authentication Framework
- [ ] Create AuthenticationManager service
- [ ] Design OAuthToken and AuthenticationState entities
- [ ] Extend BankConnection with authentication type
- [ ] Create authentication status tracking

### Phase 2: OAuth Implementation  
- [ ] Implement OAuthService with Plaid/SimpleFin providers
- [ ] Create OAuth flow controllers and endpoints
- [ ] Add token refresh scheduling
- [ ] Implement OAuth error handling and retry logic

### Phase 3: Enhanced Credential Management
- [ ] Extend CredentialService for improved scraper auth
- [ ] Migrate existing Bitwarden integration
- [ ] Add credential validation and health checks
- [ ] Implement credential rotation capabilities

### Phase 4: Integration & Monitoring
- [ ] Integrate with DataSourceManager (previous feature)
- [ ] Add authentication monitoring and alerting
- [ ] Create re-authentication workflows
- [ ] Implement authentication audit logging

## Testing Strategy
- [ ] Unit tests for OAuth flows with mocked providers
- [ ] Integration tests for credential storage and retrieval
- [ ] E2E tests for complete authentication flows
- [ ] Security tests for token encryption and storage
- [ ] Load tests for concurrent OAuth sessions
- [ ] Test authentication failure and recovery scenarios

## Dependencies
- **Multi-Source Architecture** (previous feature)
- **Bank Connection System** (foundation feature)
- OAuth 2.0 libraries (passport-oauth2 or similar)
- External provider SDKs (Plaid, SimpleFin)
- Current ApiKeyStore service
- Job scheduling system for token refresh

## Risks & Considerations
- **Security**: OAuth tokens are high-value targets for attackers
- **Token Expiry**: Handling token refresh failures and user re-authentication
- **Provider Changes**: OAuth providers may change their flows or requirements
- **Rate Limiting**: OAuth endpoints often have strict rate limits
- **User Experience**: OAuth flows can be complex for users to complete
- **Compliance**: Different providers have different compliance requirements

## Timeline
**Estimated**: 2-3 weeks

## Questions & Decisions
- [ ] Should we cache OAuth tokens in Redis for performance?
- [ ] How long should we retry failed OAuth refreshes before requiring user re-auth?
- [ ] Should we support OAuth PKCE for enhanced security?
- [ ] How to handle users who want to change their OAuth account for a bank?
- [ ] Should we notify users before tokens expire?
- [ ] What's the fallback strategy if OAuth provider is temporarily unavailable?

---
**Created**: 2025-06-20  
**Author**: Claude  
**Status**: Planning