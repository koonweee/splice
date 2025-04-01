import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from 'src/transactions/transcations.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VaultModule } from 'src/vault/vault.module';
import { ScraperModule } from 'src/scraper/scraper.module';
@Module({
  controllers: [TransactionsController],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: '60s'
        }
      }),
      inject: [ConfigService],
    }),
    VaultModule,
    ConfigModule,
    ScraperModule,
  ],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
