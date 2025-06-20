import { Module } from '@nestjs/common';
import { VaultModule } from 'src/vault/vault.module';
import { BankConnectionsModule } from '../bank-connections/bank-connections.module';
import { BankRegistryModule } from '../bank-registry/bank-registry.module';
import { ScraperService } from './scraper.service';
import { DBSStrategy } from './strategies/dbs.strategy';

const STRATEGIES = [DBSStrategy] as const;

@Module({
  imports: [VaultModule, BankRegistryModule, BankConnectionsModule],
  providers: [
    ScraperService,
    ...STRATEGIES,
    {
      provide: 'SCRAPER_STRATEGIES',
      useFactory: (...strategies) => strategies,
      inject: [...STRATEGIES],
    },
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
