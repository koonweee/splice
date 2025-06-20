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
Extends the current User entity with a one-to-many relationship to BankConnection entities. Creates a registry system for available banks across different source types. This will be orchestrated by two main services: BankRegistryService and BankConnectionService.

### Bank Registry Service
This service is responsible for managing the master catalog of all financial institutions that Splice can connect to.

#### Entities
**BankRegistry**: A catalog of all available banks and their source types.
- `id`: (Primary Key, UUID) - Unique identifier for the bank.
- `name`: (String) - The official name of the bank (e.g., "DBS Bank").
- `logoUrl`: (String, Optional) - URL for the bank's logo.
- `sourceType`: (Enum: SCRAPER, PLAID, SIMPLEFIN) - The type of data source.
- `scraperIdentifier`: (String, Optional) - Identifier used by the scraper service (e.g., "dbs").
- `isActive`: (Boolean) - Whether the bank is available for new connections.
- `createdAt`: (Timestamp)
- `updatedAt`: (Timestamp)

#### Endpoints
- `GET /banks/available`: List all active banks from the BankRegistry that users can connect to.

### Bank Connection Service
This service manages the connections that individual users have established with banks from the registry.

#### Entities
**BankConnection**: Represents a user's connection to a specific bank.
- `id`: (Primary Key, UUID) - Unique identifier for the connection.
- `userId`: (Foreign Key to User) - The user who owns this connection.
- `bankId`: (Foreign Key to BankRegistry) - The bank this connection is for.
- `status`: (Enum: ACTIVE, INACTIVE, ERROR, PENDING_AUTH) - The current status of the connection.
- `alias`: (String, Optional) - A user-defined nickname for the connection (e.g., "My Savings").
- `lastSync`: (Timestamp, Optional) - The last time data was successfully synced.
- `authDetailsUuid`: (UUID) - A reference to the authentication details for this connection. The actual storage and management of auth details are handled in plan 3-authentication-management.md.
- `createdAt`: (Timestamp)
- `updatedAt`: (Timestamp)

**Relationships:**
- User -> BankConnection (One-to-Many)
- BankRegistry -> BankConnection (One-to-Many)

#### Endpoints
- `GET /users/{uuid}/banks`: Get a user's connected banks.
- `POST /users/{uuid}/banks`: Add a new bank connection for a user.
- `DELETE /users/{uuid}/banks/{connectionId}`: Remove a user's bank connection.
- `GET /users/{uuid}/banks/{connectionId}/status`: Check the status of a specific bank connection.

## Implementation Plan

### Phase 1: Bank Registry Implementation
- [ ] Entity: Create the BankRegistry TypeORM entity.
- [ ] Service: Implement the BankRegistryService with a method to find all active banks.
- [ ] Controller: Create the BankRegistryController to expose the GET /banks/available endpoint.

### Phase 2: Bank Connection Implementation
- [ ] Entity: Create the BankConnection TypeORM entity and establish its relationships with User and BankRegistry.
- [ ] Service: Implement the BankConnectionService with the core business logic for creating, retrieving, and deleting connections for a specific user.
- [ ] Controller: Create the BankConnectionController to handle all the user-specific bank connection endpoints.
- [ ] Authorization: Implement guards to ensure a user can only access and manage their own bank connections.

### Phase 3: Integration & Testing
- [ ] Scraper Flow: Update the existing scraper service logic to retrieve necessary details from a BankConnection record instead of config files.
- [ ] Testing: Write unit tests for both services and integration tests for all new controller endpoints.
- [ ] Data Migration: Write a script to create a default BankConnection for existing users to ensure a smooth transition.

## Testing Strategy

### Unit Tests:
- BankRegistryService: Test retrieval of banks.
- BankConnectionService: Test CRUD operations, ensuring user scoping is enforced.

### Integration Tests:
- BankRegistryController: Verify the GET /banks/available endpoint works correctly.
- BankConnectionController: Test the full lifecycle of a bank connection (create, get, get status, delete) and test failure cases (e.g., trying to access another user's connection).

### E2E Tests: 
Simulate a full user flow: viewing available banks, adding one, checking its status, and then removing it.

## Dependencies
- Current User entity and database setup
- TypeORM for entity relationships
- Existing authentication system

## Future Considerations for Bank Registry Population
Note: The following points are improvements for how the BankRegistry is populated and maintained. They are out of scope for the current implementation plan but are important for the long-term architecture.

**Automatic Scraper Registration**: Instead of manually populating the registry for scraper-based banks, a process will be run on application startup. This process will inspect all implemented scraper strategies in the ScraperModule, automatically adding or updating their corresponding entries in the BankRegistry. This makes adding new scrapers a "plug-and-play" operation.

**Scheduled Aggregator Sync**: For aggregator sources like Plaid or SimpleFin, a scheduled background job will run periodically (e.g., daily). This job will fetch the list of supported institutions directly from the aggregator's API and sync it with our BankRegistry, ensuring our list of available banks is always up-to-date.

---
**Created**: 2025-06-20  
**Author**: Claude  
**Status**: Planning