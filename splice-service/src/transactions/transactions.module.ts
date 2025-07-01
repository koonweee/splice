import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiKeyStoreModule } from '../api-key-store/api-key-store.module';
import { BankConnectionsModule } from '../bank-connections/bank-connections.module';
import { DataSourcesModule } from '../data-sources/data-sources.module';
import { ScraperModule } from '../scraper/scraper.module';
import { VaultModule } from '../vault/vault.module';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transcations.controller';
@Module({
  controllers: [TransactionsController],
  imports: [VaultModule, ConfigModule, ScraperModule, ApiKeyStoreModule, DataSourcesModule, BankConnectionsModule],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
