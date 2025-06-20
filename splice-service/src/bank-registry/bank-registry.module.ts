import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankRegistryController } from './bank-registry.controller';
import { BankRegistry } from './bank-registry.entity';
import { BankRegistryService } from './bank-registry.service';

@Module({
  imports: [TypeOrmModule.forFeature([BankRegistry])],
  controllers: [BankRegistryController],
  providers: [BankRegistryService],
  exports: [BankRegistryService],
})
export class BankRegistryModule {}
