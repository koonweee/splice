# Feature Plan: Scheduled Data Collection Pipeline

## Overview
Transform splice from a real-time proxy into a data aggregation platform with scheduled background collection, normalization, and storage of transaction data. Includes backfill capabilities for historical data.

## Requirements
### Functional Requirements
- [ ] Scheduled data collection from all connected sources (hourly, daily, custom)
- [ ] Background job system with retry logic and failure handling
- [ ] Transaction normalization across different data sources
- [ ] Persistent transaction storage with deduplication
- [ ] Historical data backfill for new bank connections
- [ ] Data freshness monitoring and user notifications
- [ ] User-configurable sync schedules per bank connection
- [ ] Manual sync triggers for immediate data refresh

### Non-Functional Requirements
- [ ] Process 100k+ transactions per hour during peak times
- [ ] Job processing latency under 5 minutes for individual banks
- [ ] 99.9% job success rate with automatic retry on failures
- [ ] Transaction data available within 15 minutes of collection
- [ ] Support for 10,000+ active bank connections
- [ ] Data retention policies and archival

## Technical Design

### Architecture
Implements a job queue system using Bull/BullMQ with Redis. Creates a data pipeline that collects, normalizes, and stores transaction data. Uses the existing DataSourceManager to abstract source-specific collection logic.

### Components
- **Services**: DataCollectionService, TransactionNormalizerService, JobSchedulerService
- **Controllers**: DataCollectionController (admin), SyncController (user triggers)
- **Entities**: Transaction, Account, SyncJob, DataCollectionConfig
- **Modules**: DataCollectionModule, JobModule
- **Jobs**: BankSyncJob, BackfillJob, DataCleanupJob

### Database Changes
- **New entities**:
  - `Transaction` (normalized transaction records)
  - `Account` (bank account information)
  - `SyncJob` (job status and metadata)
  - `DataCollectionConfig` (per-user sync preferences)
- **Indexes**: Optimized for user/date/account queries
- **Partitioning**: Transaction table partitioned by date for performance

### API Changes
- **New endpoints**:
  - `POST /sync/manual/{connectionId}` - Trigger manual sync
  - `GET /sync/status/{connectionId}` - Check sync status
  - `POST /sync/backfill/{connectionId}` - Request historical backfill
  - `GET /sync/config` - Get user sync configuration
  - `PUT /sync/config` - Update sync preferences
- **Modified endpoints**:
  - Update transaction endpoints to serve cached data instead of real-time

## Implementation Plan

### Phase 1: Job System Foundation
- [ ] Set up Bull/BullMQ with Redis
- [ ] Create JobSchedulerService and base job classes
- [ ] Implement job monitoring and failure handling
- [ ] Create admin endpoints for job management

### Phase 2: Data Collection Pipeline
- [ ] Create Transaction and Account entities
- [ ] Implement DataCollectionService using DataSourceManager
- [ ] Build TransactionNormalizerService for data standardization
- [ ] Add transaction deduplication logic

### Phase 3: Scheduling & Configuration
- [ ] Create DataCollectionConfig entity and management
- [ ] Implement scheduled job creation based on user preferences
- [ ] Add manual sync triggers and user controls
- [ ] Build sync status monitoring and notifications

### Phase 4: Backfill & Optimization
- [ ] Implement historical data backfill jobs
- [ ] Add data retention and cleanup jobs
- [ ] Optimize database queries and indexing
- [ ] Add data freshness monitoring

## Testing Strategy
- [ ] Unit tests for job processing and data normalization
- [ ] Integration tests for full data collection pipeline
- [ ] Load tests for concurrent job processing
- [ ] E2E tests for user sync configuration and manual triggers
- [ ] Test job failure scenarios and retry logic
- [ ] Verify transaction deduplication accuracy

## Dependencies
- **Authentication Management** (for accessing bank data)
- **Multi-Source Architecture** (for data collection abstraction)
- **Bank Connection System** (for user connection data)
- Redis for job queue
- Job queue library (Bull/BullMQ)
- Database optimization (indexes, partitioning)

## Risks & Considerations
- **Data Volume**: Transaction storage will grow rapidly with many users
- **Job Failures**: Bank APIs can be unreliable, need robust error handling
- **Data Consistency**: Ensuring transaction data accuracy across sources
- **Performance**: Job processing may impact API response times
- **Cost**: Increased database and Redis infrastructure costs
- **Privacy**: Storing financial data requires enhanced security measures

## Timeline
**Estimated**: 3-4 weeks

## Questions & Decisions
- [ ] Should we implement real-time data streaming or stick to batch processing?
- [ ] How long should we retain raw transaction data vs aggregated summaries?
- [ ] What's the optimal job retry strategy for different failure types?
- [ ] Should users be able to pause data collection for specific accounts?
- [ ] How to handle data source schema changes without losing historical data?
- [ ] What level of transaction categorization should we implement?

---
**Created**: 2025-06-20  
**Author**: Claude  
**Status**: Planning