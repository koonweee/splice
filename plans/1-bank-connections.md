# Feature Plan: User Bank Management System

## Overview
Enable users to manage multiple bank connections across different data sources (scrapers and aggregators). This creates the foundation for multi-bank, multi-source financial data aggregation.

## Requirements
### Functional Requirements
- [ ] Users can view available banks (scrapers + aggregator-supported banks) 
- [ ] Users can select and add banks to their profile
- [ ] Users can remove bank connections
- [ ] Users can view status of their connected banks
- [ ] Support different connection types (scraper vs aggregator)
- [ ] Store bank connection metadata and preferences

### Non-Functional Requirements
- [ ] Bank connection data must be encrypted at rest
- [ ] API responses under 200ms for connection listings
- [ ] Support for 100+ banks per user
- [ ] Audit logging for connection changes

## Technical Design

### Architecture
Extends the current User entity with a one-to-many relationship to BankConnection entities. Creates a registry system for available banks across different source types.

### Components
- **Services**: BankConnectionService, BankRegistryService
- **Controllers**: BankConnectionController  
- **Entities**: BankConnection, BankRegistry
- **Modules**: BankConnectionModule

### Database Changes
- **New entities**:
  - `BankConnection` (user connections to specific banks)
  - `BankRegistry` (catalog of available banks and their source types)
- **Relationships**: User -> BankConnection (one-to-many)

### API Changes
- **New endpoints**:
  - `GET /banks/available` - List all available banks
  - `GET /users/{uuid}/banks` - Get user's connected banks
  - `POST /users/{uuid}/banks` - Add bank connection
  - `DELETE /users/{uuid}/banks/{bankId}` - Remove bank connection
  - `GET /users/{uuid}/banks/{bankId}/status` - Check connection status

## Implementation Plan

### Phase 1: Data Model & Registry
- [ ] Create BankRegistry entity and service
- [ ] Create BankConnection entity
- [ ] Add relationship to User entity
- [ ] Populate registry with current scraper banks (DBS)
- [ ] Create database migrations

### Phase 2: User Management APIs
- [ ] Implement BankConnectionService 
- [ ] Create BankConnectionController with CRUD operations
- [ ] Add validation and error handling
- [ ] Implement connection status checking

### Phase 3: Integration & Testing
- [ ] Update existing scraper flow to use BankConnection
- [ ] Add connection status monitoring
- [ ] Create admin endpoints for bank registry management

## Testing Strategy
- [ ] Unit tests for BankConnectionService operations
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user bank management flow
- [ ] Test connection status updates and error handling

## Dependencies
- Current User entity and database setup
- TypeORM for entity relationships
- Existing authentication system

## Risks & Considerations
- **Data Migration**: Existing users need default bank connections created
- **Registry Management**: Need admin interface for adding new banks to registry
- **Connection State**: Status tracking complexity across different source types
- **Security**: Bank connection metadata must not expose sensitive data

## Timeline
**Estimated**: 1-2 weeks

## Questions & Decisions
- [ ] Should we support bank connection nicknames/aliases?
- [ ] How to handle bank mergers/name changes in registry?
- [ ] What connection metadata should be stored (last sync time, preferences)?
- [ ] Should users be able to temporarily disable connections vs delete?

---
**Created**: 2025-06-20  
**Author**: Claude  
**Status**: Planning