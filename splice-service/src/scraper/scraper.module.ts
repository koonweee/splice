import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { DBSStrategy } from './strategies/dbs.strategy';
import { VaultModule } from 'src/vault/vault.module';

const STRATEGIES = [DBSStrategy] as const;

@Module({
  controllers: [ScraperController],
  imports: [VaultModule],
  providers: [
    ScraperService,
    ...STRATEGIES,
    {
      provide: 'SCRAPER_STRATEGIES',
      useFactory: (...strategies) => strategies,
      inject: [...STRATEGIES],
    }
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
