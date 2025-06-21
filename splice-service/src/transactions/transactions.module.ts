import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeyStoreModule } from '../api-key-store/api-key-store.module';
import { ScraperModule } from '../scraper/scraper.module';
import { VaultModule } from '../vault/vault.module';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transcations.controller';
@Module({
  controllers: [TransactionsController],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: '60s',
        },
      }),
      inject: [ConfigService],
    }),
    VaultModule,
    ConfigModule,
    ScraperModule,
    ApiKeyStoreModule,
  ],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
