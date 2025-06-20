import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankRegistryModule } from '../bank-registry/bank-registry.module';
import { BankConnectionController } from './bank-connection.controller';
import { BankConnection } from './bank-connection.entity';
import { BankConnectionService } from './bank-connection.service';

@Module({
  imports: [TypeOrmModule.forFeature([BankConnection]), BankRegistryModule, JwtModule, ConfigModule],
  controllers: [BankConnectionController],
  providers: [BankConnectionService],
  exports: [BankConnectionService],
})
export class BankConnectionsModule {}
