# Engineering Plan: Multi-Source Adapter Architecture

This document outlines the engineering plan to refactor the Splice application into a scalable, multi-source architecture. This design will enable seamless integration of various data source types (aggregators like Plaid, scrapers, etc.) and is optimized for open-source collaboration.

## Phase 1: Refactor Core Data Models and Types (`@splice/api`)

The first step is to establish a clear and consistent data model in the shared `@splice/api` package.

### 1.1. Rename `BankSourceType` to `DataSourceType`

To more accurately reflect the nature of the data providers, we will rename `BankSourceType`.

* **Action**: In `splice-api/src/banks/types.ts`, rename the `BankSourceType` enum to `DataSourceType`.
* **Task**: Perform a global search-and-replace across the entire monorepo to update all references from `BankSourceType` to `DataSourceType`. This will affect entities, services, and DTOs in `splice-service`.

```typescript
// file: splice-api/src/banks/types.ts
export enum DataSourceType { // <-- Renamed
  SCRAPER = 'SCRAPER',
  PLAID = 'PLAID',
  SIMPLEFIN = 'SIMPLEFIN',
}
```

### 1.2. Define the `DataSourceAdapter` Interface

We will create the new, standardized interfaces that will govern all data source interactions.

* **Action**: Create a new file at `splice-api/src/data-sources/types.ts`.
* **Content**: Add the `DataSourceAdapter`, `StandardizedAccount`, and `StandardizedTransaction` interfaces to this file. This content should be taken directly from the interface we designed previously.

```typescript
// file: splice-api/src/data-sources/types.ts

import { BankConnection } from '../bank-connections';

// ... StandardizedAccount and StandardizedTransaction interfaces ...

export interface DataSourceAdapter {
  initiateConnection(userId: string): Promise<{ linkToken?: string; status: 'ready' | 'redirect' }>;
  finalizeConnection(connectionData: object): Promise<{ authDetailsUuid: string; metadata: object }>;
  getHealthStatus(connection: BankConnection): Promise<{ healthy: boolean; error?: string }>;
  fetchAccounts(connection: BankConnection): Promise<StandardizedAccount[]>;
  fetchTransactions(connection: BankConnection, accountId: string, startDate: Date, endDate: Date): Promise<StandardizedTransaction[]>;
}
```

* **Action**: Export the new types from the package's main entry point.
* **File**: `splice-api/src/index.ts`
* **Task**: Add `export * from './data-sources/types';`

## Phase 2: Implement the Adapter Architecture (`splice-service`)

This phase involves creating the backend structure to manage and utilize the new adapters.

### 2.1. Create the `data-sources` Module

We will create a dedicated module for all data source-related logic.

* **Action**: Create a new directory: `splice-service/src/data-sources`.
* **Sub-directories**: Inside `data-sources`, create:
    * `adapters/`: This folder will hold the concrete adapter implementations (e.g., `plaid.adapter.ts`, `scraper.adapter.ts`).
    * `manager/`: This folder will contain the `DataSourceManager` service.

### 2.2. Implement the `DataSourceManager`

This service will act as the central router for all data operations.

* **Action**: Create `splice-service/src/data-sources/manager/data-source-manager.service.ts`.
* **Logic**:
    * The `DataSourceManager` will be injected with all available `DataSourceAdapter` implementations.
    * It will have a public method for each operation (e.g., `fetchAccounts`, `initiateConnection`).
    * Each method will take a `BankConnection` or `bankId`, look up the `DataSourceType` from the `Bank` registry, and delegate the call to the corresponding registered adapter.

## Phase 3: Dependency Injection and Type-Safe Registration

This is the most critical part for ensuring robustness and enabling open-source contributions. We will use NestJS's dependency injection system to create a type-safe and maintainable way to manage adapters.

### 3.1. Create Adapter Injection Tokens

* **Action**: Create a file like `splice-service/src/data-sources/adapters/adapter.constants.ts`.
* **Content**: Define constants for injection tokens.

```typescript
// file: splice-service/src/data-sources/adapters/adapter.constants.ts
export const DATA_SOURCE_ADAPTERS = 'DATA_SOURCE_ADAPTERS';
```

### 3.2. Configure the `data-sources.module.ts`

This module will register all adapters and ensure that every `DataSourceType` has a corresponding implementation.

* **Action**: Create `splice-service/src/data-sources/data-sources.module.ts`.
* **Logic**:
    1.  **Import and Provide Adapters**: Import each concrete adapter class (e.g., `PlaidAdapter`, `ScraperAdapter`). List them in the `providers` array so they are instantiated by NestJS.
    2.  **Use a Factory Provider**: Create a factory provider for `DATA_SOURCE_ADAPTERS`. This factory will be injected with all individual adapters and will return a `Map<DataSourceType, DataSourceAdapter>`.
    3.  **Implement `onModuleInit` for Type Safety**: The module will implement the `OnModuleInit` lifecycle hook. In the `onModuleInit` method, it will iterate through the `DataSourceType` enum and check if the injected map contains a registered adapter for each type. If an adapter is missing, the application will throw an error on startup. This guarantees that the system is never in a state where a data source type exists without a corresponding implementation.

```typescript
// Example for splice-service/src/data-sources/data-sources.module.ts

@Module({
  providers: [
    DataSourceManager,
    PlaidAdapter, // To be created
    ScraperAdapter, // To be created
    {
      provide: DATA_SOURCE_ADAPTERS,
      useFactory: (...adapters: DataSourceAdapter[]) => {
        // Create and return a Map<DataSourceType, DataSourceAdapter>
      },
      inject: [PlaidAdapter, ScraperAdapter], // Inject all concrete adapters
    },
  ],
  exports: [DataSourceManager],
})
export class DataSourcesModule implements OnModuleInit {
  constructor(@Inject(DATA_SOURCE_ADAPTERS) private adapters: Map<DataSourceType, DataSourceAdapter>) {}

  onModuleInit() {
    for (const type of Object.values(DataSourceType)) {
      if (!this.adapters.has(type)) {
        throw new Error(`FATAL: No DataSourceAdapter implementation provided for DataSourceType "${type}"`);
      }
    }
  }
}
```

This plan provides a solid foundation for a highly extensible and maintainable system, directly addressing your goal of supporting multiple aggregators and encouraging community contributions.
