import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from 'src/config';
import { HealthModule } from 'src/health/health.module';
import { SecurityHeadersMiddleware } from 'src/middleware/security-headers.middleware';
import { ScraperModule } from 'src/scraper/scraper.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [TransactionsModule, ScraperModule, HealthModule, ConfigModule.forRoot(
    {
      isGlobal: true,
      load: [config],
    }
  )],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
