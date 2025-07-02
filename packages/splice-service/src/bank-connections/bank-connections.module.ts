import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyStoreModule } from '../api-key-store/api-key-store.module';
import { BankRegistryModule } from '../bank-registry/bank-registry.module';
import { DataSourcesModule } from '../data-sources/data-sources.module';
import { BankConnectionController } from './bank-connection.controller';
import { BankConnectionEntity } from './bank-connection.entity';
import { BankConnectionService } from './bank-connection.service';

@Module({
  imports: [TypeOrmModule.forFeature([BankConnectionEntity]), BankRegistryModule, DataSourcesModule, ApiKeyStoreModule],
  controllers: [BankConnectionController],
  providers: [BankConnectionService],
  exports: [BankConnectionService],
})
export class BankConnectionsModule {}
