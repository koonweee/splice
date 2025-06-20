# Feature Planning

This directory contains feature plans and collaboration documents for splice-service.

## Purpose

The `plans/` folder serves as a centralized location for:
- Feature specifications and requirements
- Technical design documents
- Implementation roadmaps
- Architecture decisions

## Usage

1. Create a new plan using the provided template: `cp template.md your-feature-name.md`
2. Fill out all relevant sections
3. Share and collaborate on the plan before implementation
4. Keep the plan updated as the feature evolves

## Structure

- `template.md` - Template for new feature plans
- `[feature-name].md` - Individual feature planning documents

## V1 Feature Plans

The following features comprise the v1 roadmap for transforming splice-service into a comprehensive financial data aggregation platform:

1. **`1-bank-connections.md`** - User Bank Management System
   - Foundation for multi-bank, multi-source architecture
   - User bank selection and connection management

2. **`2-multi-source-architecture.md`** - Multi-Source Data Architecture  
   - Abstract scrapers and add aggregator support (Plaid, SimpleFin)
   - Pluggable adapter system for different data sources

3. **`3-authentication-management.md`** - Multi-Modal Authentication Management
   - OAuth flows for aggregators + enhanced credential storage for scrapers
   - Per-connection authentication state management

4. **`4-scheduled-data-collection.md`** - Scheduled Data Collection Pipeline
   - Background job system for periodic data collection and storage
   - Transaction normalization and backfill capabilities

5. **`5-standardized-transaction-api.md`** - Standardized Transaction API
   - Unified API layer serving cached transaction data
   - Advanced querying, analytics, and export capabilities

Each feature builds on the previous ones, enabling incremental delivery while maintaining system stability.