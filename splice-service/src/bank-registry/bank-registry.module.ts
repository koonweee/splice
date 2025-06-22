import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankEntity } from './bank.entity';
import { BankRegistryController } from './bank-registry.controller';
import { BankRegistryService } from './bank-registry.service';

@Module({
  imports: [TypeOrmModule.forFeature([BankEntity])],
  controllers: [BankRegistryController],
  providers: [BankRegistryService],
  exports: [BankRegistryService],
})
export class BankRegistryModule {}
