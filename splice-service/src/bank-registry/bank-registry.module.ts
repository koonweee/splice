import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankRegistryController } from './bank-registry.controller';
import { BankEntity } from './bank-registry.entity';
import { BankRegistryService } from './bank-registry.service';

@Module({
  imports: [TypeOrmModule.forFeature([BankEntity])],
  controllers: [BankRegistryController],
  providers: [BankRegistryService],
  exports: [BankRegistryService],
})
export class BankRegistryModule {}
