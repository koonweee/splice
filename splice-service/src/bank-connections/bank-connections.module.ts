import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankRegistryModule } from '../bank-registry/bank-registry.module';
import { BankConnectionController } from './bank-connection.controller';
import { BankConnectionEntity } from './bank-connection.entity';
import { BankConnectionService } from './bank-connection.service';

@Module({
  imports: [TypeOrmModule.forFeature([BankConnectionEntity]), BankRegistryModule],
  controllers: [BankConnectionController],
  providers: [BankConnectionService],
  exports: [BankConnectionService],
})
export class BankConnectionsModule {}
