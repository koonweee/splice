import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from 'src/config';
import { HealthModule } from 'src/health/health.module';
import { SecurityHeadersMiddleware } from 'src/middleware/security-headers.middleware';
import { ScraperModule } from 'src/scraper/scraper.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { User } from 'src/users/user.entity';
import { UsersModule } from 'src/users/users.module';

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
        entities: [User],
        synchronize: true, // Set to false in production
      }),
      inject: [ConfigService],
    }),
    TransactionsModule,
    ScraperModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
