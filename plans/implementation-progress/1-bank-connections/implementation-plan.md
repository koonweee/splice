# Bank Connections Implementation Plan

## Current State Analysis
- **Entities**: User, ApiKeyStore with proper TypeORM setup
- **Scraper System**: Strategy pattern already implemented with DBS strategy
- **Config**: Simple environment-based configuration for bank secrets
- **Architecture**: Clean NestJS modular structure

## Implementation Plan

### Phase 1: Shared Types & Core Entities (Day 1)
1. **Create shared types in splice-api** - Bank-related interfaces for frontend/BFF
2. **Create BankRegistry Entity** - Master catalog of all available banks
3. **Create BankConnection Entity** - User's individual bank connections
4. **Implement BankRegistryService** - Business logic for bank catalog
5. **Implement BankConnectionService** - CRUD operations for user connections
6. **Create folder**: `plans/implementation-progress/1-bank-connections/`
7. **Store this plan**: `plans/implementation-progress/1-bank-connections/implementation-plan.md`
8. **Track progress**: `plans/implementation-progress/1-bank-connections/phase-1-entities.md`

### Phase 2: Controllers & API Endpoints (Day 1-2)
1. **BankRegistryController** - `GET /banks/available`
2. **BankConnectionController** - Full CRUD API for user bank connections  
3. **Authorization Guards** - Ensure users only access their own connections
4. **Update progress**: `plans/implementation-progress/1-bank-connections/phase-2-controllers.md`

### Phase 3: Integration & Refactoring (Day 2)
1. **Refactor ScraperService** - Use BankConnection entities instead of config
2. **Update existing scraper strategies** - Adapt to new connection model
3. **Auto-populate BankRegistry** - Seed with current scraper strategies
4. **Update progress**: `plans/implementation-progress/1-bank-connections/phase-3-integration.md`

### Phase 4: Testing & Validation (Day 2-3)
1. **Unit Tests** - Full coverage for new services
2. **Integration Tests** - API endpoint testing
3. **E2E Tests** - Complete user flow testing
4. **Final progress**: `plans/implementation-progress/1-bank-connections/phase-4-testing.md`

## Key Implementation Details
- **Shared Types**: All bank-related interfaces go in splice-api for frontend/BFF reuse
- **Clean Slate Approach**: Replace current hardcoded bank configuration
- **Automatic Strategy Registration**: Scraper strategies auto-register with BankRegistry
- **Proper Entity Relationships**: User → BankConnection → BankRegistry
- **Security**: Leverage existing ApiKeyStore encryption for auth details
- **Documentation**: Track progress in organized implementation-progress folder

## Success Criteria
- [ ] Shared types available in splice-api package
- [ ] Users can list available banks
- [ ] Users can add/remove bank connections
- [ ] Existing DBS scraping works through new system
- [ ] All tests pass
- [ ] Complete progress documentation

## Progress Tracking
- **Started**: 2025-06-20
- **Current Phase**: Phase 1 - Shared Types & Core Entities
- **Status**: In Progress