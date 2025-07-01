import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyStoreModule } from './api-key-store/api-key-store.module';
import { AuthModule } from './auth/auth.module';
import { BankConnectionsModule } from './bank-connections/bank-connections.module';
import { BankRegistryModule } from './bank-registry/bank-registry.module';
import config from './config';
import { DataSourcesModule } from './data-sources/data-sources.module';
import { HealthModule } from './health/health.module';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { ScraperModule } from './scraper/scraper.module';
import { UsersModule } from './users/users.module';

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
        autoLoadEntities: true,
        synchronize: true, // Set to false in production
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ScraperModule,
    DataSourcesModule,
    HealthModule,
    UsersModule,
    ApiKeyStoreModule,
    BankRegistryModule,
    BankConnectionsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
