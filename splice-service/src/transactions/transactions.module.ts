import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeyStoreModule } from 'src/api-key-store/api-key-store.module';
import { ScraperModule } from 'src/scraper/scraper.module';
import { TransactionsController } from 'src/transactions/transcations.controller';
import { VaultModule } from 'src/vault/vault.module';
import { TransactionsService } from './transactions.service';
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
export class TransactionsModule { }
