import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from 'src/config';
import { HealthModule } from 'src/health/health.module';
import { SecurityHeadersMiddleware } from 'src/middleware/security-headers.middleware';
import { ScraperModule } from 'src/scraper/scraper.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { User } from 'src/users/user.entity';
import { UsersModule } from 'src/users/users.module';
import { ApiKeyStore } from './api-key-store/api-key-store.entity';
import { ApiKeyStoreModule } from './api-key-store/api-key-store.module';
import { AuthModule } from './auth/auth.module';
import { BankConnection } from './bank-connections/bank-connection.entity';
import { BankConnectionsModule } from './bank-connections/bank-connections.module';
import { BankRegistry } from './bank-registry/bank-registry.entity';
import { BankRegistryModule } from './bank-registry/bank-registry.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('postgres.host'),
        port: configService.get('postgres.port'),
        username: configService.get('postgres.username'),
        password: configService.get('postgres.password'),
        database: configService.get('postgres.database'),
        entities: [User, ApiKeyStore, BankRegistry, BankConnection],
        synchronize: true, // Set to false in production
      }),
      inject: [ConfigService],
    }),
    TransactionsModule,
    ScraperModule,
    HealthModule,
    UsersModule,
    ApiKeyStoreModule,
    BankRegistryModule,
    BankConnectionsModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
