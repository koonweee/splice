import { forwardRef, Inject, Logger, Module, OnModuleInit } from '@nestjs/common';
import { DataSourceAdapter, DataSourceType } from '@splice/api';
import { ScraperModule } from '../scraper/scraper.module';
import { VaultModule } from '../vault/vault.module';
import { DATA_SOURCE_ADAPTERS } from './adapters/adapter.constants';
import { PlaidAdapter } from './adapters/plaid.adapter';
import { ScraperAdapter } from './adapters/scraper.adapter';
import { DataSourceManager } from './manager/data-source-manager.service';

@Module({
  imports: [forwardRef(() => ScraperModule), VaultModule],
  providers: [
    DataSourceManager,
    {
      provide: DATA_SOURCE_ADAPTERS,
      useFactory: (): Map<DataSourceType, DataSourceAdapter<unknown>> => {
        const adapters = new Map<DataSourceType, DataSourceAdapter<unknown>>();
        // ScraperAdapter will be injected later when needed
        return adapters;
      },
    },
    ScraperAdapter,
    PlaidAdapter,
  ],
  exports: [DataSourceManager],
})
export class DataSourcesModule implements OnModuleInit {
  private readonly logger = new Logger(DataSourcesModule.name);

  constructor(
    @Inject(DATA_SOURCE_ADAPTERS)
    private adapters: Map<DataSourceType, DataSourceAdapter<unknown>>,
    private scraperAdapter: ScraperAdapter,
    private plaidAdapter: PlaidAdapter,
  ) {}

  onModuleInit() {
    this.logger.log('DataSourcesModule initialized');

    // Register adapters after module initialization to avoid circular dependency
    this.adapters.set(DataSourceType.SCRAPER, this.scraperAdapter);
    this.adapters.set(DataSourceType.PLAID, this.plaidAdapter);

    // Type safety validation - ensure all DataSourceTypes have implementations
    const missingAdapters: DataSourceType[] = [];

    for (const type of Object.values(DataSourceType)) {
      if (!this.adapters.has(type)) {
        missingAdapters.push(type);
      }
    }

    if (missingAdapters.length > 0) {
      this.logger.warn(
        `Missing DataSourceAdapter implementations for types: ${missingAdapters.join(', ')}. ` +
          'These will need to be implemented before the corresponding data sources can be used.',
      );
    } else {
      this.logger.log('All DataSourceType implementations are registered');
    }
  }
}
