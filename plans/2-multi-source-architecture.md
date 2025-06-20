# Feature Plan: Multi-Source Data Architecture

## Overview
Transform the current scraper-only system into a pluggable architecture supporting multiple data source types (scrapers, aggregators like Plaid/SimpleFin). This enables unified access to financial data regardless of the underlying source.

## Requirements
### Functional Requirements
- [ ] Abstract data source operations behind unified interfaces
- [ ] Support scraper-based sources (current DBS strategy)
- [ ] Support aggregator sources (Plaid, SimpleFin, etc.)
- [ ] Pluggable adapter system for new source types
- [ ] Source-specific configuration management
- [ ] Unified transaction format across all sources
- [ ] Source health monitoring and error handling

### Non-Functional Requirements
- [ ] No breaking changes to existing scraper functionality
- [ ] New sources can be added without code changes to core system
- [ ] Source adapter failures don't impact other sources
- [ ] Response time parity with current scraper performance

## Technical Design

### Architecture
Implements Strategy + Adapter patterns to abstract data sources. Creates a unified DataSourceManager that coordinates between different source adapters while maintaining the current scraper functionality.

### Components
- **Services**: DataSourceManager, PlaidAdapter, SimplefinAdapter
- **Interfaces**: DataSourceAdapter, TransactionNormalizer
- **Controllers**: Update TransactionsController to use DataSourceManager
- **Modules**: DataSourceModule, PlaidModule, SimplefinModule

### Database Changes
- **New entities**:
  - `DataSource` (registry of available data source providers)
  - `SourceConfiguration` (source-specific settings)
- **Schema modifications**:
  - Add `sourceType` and `sourceId` to BankConnection
  - Add source metadata fields

### API Changes
- **Modified endpoints**:
  - Update transaction endpoints to work with unified data sources
  - Add source-specific configuration endpoints
- **New endpoints**:
  - `GET /data-sources` - List available data source types
  - `POST /data-sources/{type}/configure` - Configure source adapter

## Implementation Plan

### Phase 1: Core Abstraction Layer
- [ ] Create DataSourceAdapter interface
- [ ] Create TransactionNormalizer interface  
- [ ] Implement DataSourceManager service
- [ ] Create unified transaction format

### Phase 2: Refactor Existing Scrapers
- [ ] Wrap current ScraperService in ScraperAdapter
- [ ] Update existing DBS strategy to use new interfaces
- [ ] Migrate existing flows to use DataSourceManager
- [ ] Ensure backward compatibility

### Phase 3: Aggregator Adapters
- [ ] Implement PlaidAdapter with OAuth flow
- [ ] Implement SimplefinAdapter
- [ ] Add adapter configuration management
- [ ] Create adapter health checks

### Phase 4: Integration & Registry
- [ ] Update BankConnection to reference data sources
- [ ] Create source registry and discovery
- [ ] Add adapter lifecycle management
- [ ] Implement error handling and fallbacks

## Testing Strategy
- [ ] Unit tests for all adapters and interfaces
- [ ] Integration tests for DataSourceManager
- [ ] E2E tests ensuring existing scraper functionality unchanged
- [ ] Mock tests for external aggregator APIs
- [ ] Performance tests comparing old vs new architecture

## Dependencies
- **Bank Connection System** (previous feature)
- External aggregator SDKs (Plaid, SimpleFin)
- OAuth library for aggregator authentication
- Current ScraperService and strategies

## Risks & Considerations
- **Backward Compatibility**: Must not break existing scraper users
- **API Rate Limits**: Aggregators have different rate limiting policies
- **Data Format Variations**: Transaction schemas vary significantly between sources
- **Error Handling**: Different failure modes across scraper vs aggregator sources
- **Configuration Complexity**: Each source type has different setup requirements

## Timeline
**Estimated**: 2-3 weeks

## Questions & Decisions
- [ ] Should we support fallback sources if primary source fails?
- [ ] How to handle partial failures (some banks succeed, others fail)?
- [ ] What's the normalization strategy for conflicting transaction data?
- [ ] Should source adapters be hot-swappable or require restart?
- [ ] How to handle source-specific features that don't map to unified interface?

---
**Created**: 2025-06-20  
**Author**: Claude  
**Status**: Planning