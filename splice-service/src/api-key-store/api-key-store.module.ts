import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyStoreController } from './api-key-store.controller';
import { ApiKeyStore } from './api-key-store.entity';
import { ApiKeyStoreService } from './api-key-store.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyStore])],
  providers: [ApiKeyStoreService],
  controllers: [ApiKeyStoreController],
  exports: [ApiKeyStoreService],
})
export class ApiKeyStoreModule {}
